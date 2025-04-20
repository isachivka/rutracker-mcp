# -*- coding: utf-8 -*-
"""RuTracker search engine plugin for qBittorrent."""
#VERSION: 3.0
#AUTHORS: nbusseneau (https://github.com/nbusseneau/qBittorrent-RuTracker-plugin)

import logging
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from html import unescape
from http.cookiejar import MozillaCookieJar
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Callable
import urllib
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode, unquote, quote
from urllib.request import build_opener, HTTPCookieProcessor, ProxyHandler

TORRENT_DIR = Path("/home/is/torrentFiles")

try:
    from novaprinter import prettyPrinter
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent.parent.absolute()))
    from novaprinter import prettyPrinter

FILE = Path(__file__)
BASEDIR = FILE.parent.absolute()

FILENAME = FILE.stem
FILE_J, FILE_C = [BASEDIR / (FILENAME + fl) for fl in (".json", ".cookie")]

RE_TORRENTS = re.compile(
    r'<a\sdata-topic_id="(\d+?)".+?">(.+?)</a.+?tor-size"\sdata-ts_text="(\d+?)'
    r'">.+?data-ts_text="([-\d]+?)">.+?Личи">(\d+?)</.+?data-ts_text="(\d+?)">',
    re.S
)
RE_RESULTS = re.compile(r"Результатов\sпоиска:\s(\d{1,3})\s<span", re.S)
PATTERNS = ("%stracker.php?nm=%s&c=%s", "%s&start=%s")

PAGES = 50

# base64 encoded image
ICON = ("AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAABMLAAATCw"
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAABs3wUAY8wFBGPMBQN2sw8A9kA6AOdOOl/nTjo/5046"
        "AOdOOgDnTjoA5046AOdOOgHnTjoAAAAAAAAAAAB28wUAY8wFAGPMBWBjzAVWXtEHAMdsKg"
        "DnTjqf50464+dOOmnnTjoh5046JudOOmLnTjp85046DAAAAAAAAAAAbN8FAGPMBQxjzAXA"
        "Y8wF1WPMBSNX2AAA9z86nehNOv/nTjr750464+dOOubnTjr/5046oedOOgMAAAAAdfEFAG"
        "PMBQBjzAVPY8wF82PMBf9jzAW0XdEHOt5XNnbhVDSm6U04v+dOOvvnTjr/5046/edOOl3n"
        "TjoAbN8FDWPMBSljzAVpY8wF3GPMBf9jzAX/Y8wF/2PMBe5Y1wXYS+MAyY2kHHvwRjvr50"
        "46/+dOOvnnTjpK5046AGPMBZRjzAXpY8wF/WPMBf9jzAX/Y8wF/2PNBP9jzAX/YswF/1rU"
        "Aa/qSzat5046/udOOv/nTjr/5046iudOOgJjzAUsY8wFq2PMBfxjzAX/Y8wF/2LFDsNfvx"
        "afY90AzVjhAM/WXy6U6E07+OdOOv/nTjr/5046/+dOOuznTjpbY8wFAGPMBRJjzAWxY8wF"
        "/2PNA/5cojyQRQD/t0kn36dejFVk+Ek4wedOOv/nTjr/6E447edOOsznTjrI5046pmzfBQ"
        "BjzAUAY8wFWWPMBf1jzAX/YtgAu0cc7LhGI+T/Nxb+su9LM6zoTjn/8U4v1bBAc2i/R1MT"
        "/1oLC/dOKgwAAAAAbN8FAGPMBUxjzAX6Y8wF+WPmAK5JKdyiRiPj/zgj8euqPnOP/08e4p"
        "o6iosuI/zSNyTydS0j/A41JPUAAAAAAG7iBQBjzAVVY8wF2GPkAGFVfHYhRhrvwkYk4v9F"
        "JOP/WCvPn89BU3w3JfHHRiTi/0Yk4vtGJOKgRiTiEAAAAAB39QUAbeEFHGrsACdGItcBRh"
        "fzdUYk4vtGJOL/RiTi/0Yk4vA6JO7dRiTi/UYk4t1GJOKNRiTiQk0k+AcAAAAAAAAAAAAA"
        "AABGF/8ARiTiGkYk4rRGJOLMRiTiz0Yk4vNGJOL/RiTi/0Yk4tNGJOIxRiTiAFMq/wAAAA"
        "AAAAAAAAAAAAAAAAAAVCv/AE0k+gRNJPoRTST4DkYk4hFGJOJRRiTi3UYk4v9GJOJyRiTi"
        "AFMq/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABTKv8ARiTiAEYk4l"
        "ZGJOLgRiTiN00k+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        "AAAAAE0k+ABGJOIIRiTiT0Yk4g9NJPoAAAAAAAAAAAAAAAAA//8AAP//AAD/uwAA+/cAAP"
        "H3AADgcwAA5+MAAO/PAAD23wAA/v8AAP53AAD+fwAA/58AAP/fAAD//wAA//8AAA==")

# setup logging
logging.basicConfig(
    format="%(asctime)s %(name)-12s %(levelname)-8s %(message)s",
    datefmt="%m-%d %H:%M",
    level=logging.DEBUG
)

logger = logging.getLogger(__name__)


def rng(t: int) -> range:
    return range(PAGES, -(-t // PAGES) * PAGES, PAGES)


class EngineError(Exception):
    ...


class rutracker:
    name = "Rutracker"
    url = "https://rutracker.org/forum/"
    url_dl = url + "dl.php?t="
    url_login = url + "login.php"
    supported_categories = {"all": "-1"}

    # cookies
    mcj = MozillaCookieJar()
    # establish connection
    session = build_opener(HTTPCookieProcessor(mcj))

    def search(self, what: str, cat: str = "all") -> None:
        self._catch_errors(self._search, what, cat)

    def download_torrent(self, url: str) -> None:
        logger.info(f"Downloading torrent {url}")
        self._catch_errors(self._download_torrent, url)

    def login(self) -> None:
        self.mcj.clear()

        form_data = {
            "login_username": "...",
            "login_password": "...",
            "login": "\u0432\u0445\u043e\u0434"  # вход в cp1251 ("вход")
        }

        data_encoded = urlencode(form_data, encoding="cp1251").encode()

        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
            "Cache-Control": "max-age=0",
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "https://rutracker.org",
            "Referer": "https://rutracker.org/forum/index.php",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
        }

        request = urllib.request.Request(
            self.url_login,
            data=data_encoded,
            headers=headers
        )

        response = self.session.open(request)

        self.mcj.extract_cookies(response, request)

        if "bb_session" not in [cookie.name for cookie in self.mcj]:
            raise EngineError("Authorization failed, please check your credentials!")

        self.mcj.save(FILE_C, ignore_discard=True, ignore_expires=True)
        logger.info("Successfully authorized")

    def searching(self, query: str, first: bool = False) -> int:
        logger.info(f"Searching {query}")
        page, torrents_found = self._request(query).decode("cp1251"), -1
        if first:
            # check login status
            if "log-out-icon" not in page:
                if "login-form-full" not in page:
                    raise EngineError("Unexpected page content")
                logger.debug("Looks like we lost session id, lets login")
                self.login()
                # retry request because guests cant search
                page = self._request(query).decode("cp1251")
            # firstly we check if there is a result
            try:
                torrents_found = int(RE_RESULTS.search(page)[1])
            except TypeError:
                raise EngineError("Unexpected page content")
            if torrents_found <= 0:
                return 0
        self.draw(page)

        return torrents_found

    def draw(self, html: str) -> None:
        for tor in RE_TORRENTS.findall(html):
            magnetFetchLink = self.url + "viewtopic.php?t=" + tor[0]

            try:
                req = urllib.request.Request(
                    magnetFetchLink,
                    headers={
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
                        "Referer": self.url
                    }
                )
                with self.session.open(req) as response:
                    topic_html = response.read().decode("cp1251")
                magnet_match = re.search(r'href="(magnet:\?xt=urn:btih:[^"]+)"', topic_html)
                if magnet_match:
                    magnet_link = magnet_match.group(1)
                else:
                    logger.warning("Magnet-ссылка не найдена в теме, используем стандартную ссылку для скачивания")
                    magnet_link = self.url_dl + tor[0]
            except Exception as e:
                logger.exception("Ошибка при получении magnet-ссылки со страницы темы")
                magnet_link = self.url_dl + tor[0]

            prettyPrinter({
                "engine_url": self.url,
                "desc_link": magnetFetchLink,
                "name": unescape(tor[1]),
                "link": magnet_link,
                "size": tor[2],
                "seeds": max(0, int(tor[3])),
                "leech": tor[4],
                "pub_date": int(tor[5])
            })

    def _catch_errors(self, handler: Callable, *args: str):
        try:
            self._init()
            handler(*args)
        except EngineError as ex:
            self.pretty_error(args[0], str(ex))
        except Exception as ex:
            self.pretty_error(args[0], "Unexpected error, please check logs" + str(ex))
            logger.exception(ex)

    def _init(self) -> None:
        # load local cookies
        try:
            self.mcj.load(FILE_C, ignore_discard=True)
            if "bb_session" in [cookie.name for cookie in self.mcj]:
                # if cookie.expires < int(time.time())
                return logger.info("Local cookies is loaded")
            logger.info("Local cookies expired or bad, try to login")
            logger.debug(f"That we have: {[cookie for cookie in self.mcj]}")
        except FileNotFoundError:
            logger.info("Local cookies not exists, try to login")
        self.login()

    def _search(self, what: str, cat: str = "all") -> None:
        query = PATTERNS[0] % (self.url, quote(unquote(what)), self.supported_categories[cat])

        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
            "Referer": "https://rutracker.org/forum/index.php",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1"
        }

        request = urllib.request.Request(query, headers=headers)

        response = self.session.open(request)
        page = response.read().decode("cp1251")

        torrents_found = -1
        if "log-out-icon" not in page:
            if "login-form-full" in page:
                logger.debug("Lost session id, logging in again")
                self.login()
                response = self.session.open(request)
                page = response.read().decode("cp1251")

        try:
            torrents_found = int(RE_RESULTS.search(page)[1])
        except TypeError:
            raise EngineError("Unexpected page content")

        if torrents_found <= 0:
            logger.info("No torrents found")
            return

        self.draw(page)

        if torrents_found > PAGES:
            qrs = [PATTERNS[1] % (query, x) for x in rng(torrents_found)]
            with ThreadPoolExecutor(len(qrs)) as executor:
                executor.map(self.searching, qrs, timeout=30)

        logger.info(f"Found torrents: {torrents_found}")

    def _download_torrent(self, url: str) -> None:
        headers = {
            "Accept": "application/x-bittorrent",
            "Referer": "https://rutracker.org/forum/index.php",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
        }

        request = urllib.request.Request(url, headers=headers)
        response = self.session.open(request)

        logger.info(f"Downloading torrent: {url}")

        torrent_data = response.read()

        logger.info(f"Downloaded torrent: {url}")

        if torrent_data.startswith(b"<"):
            error_page = torrent_data.decode("cp1251", errors='ignore')
            raise EngineError(f"Failed to download torrent. Server response: {error_page[:300]}")

        try:
            torrent_path = Path("/home/is/torrentFiles")
            torrent_path.mkdir(parents=True, exist_ok=True)


            file_path = torrent_path / f"{url.split('=')[-1]}.torrent"

            with open(torrent_path / f"{torrent_path.stem}.torrent", "wb") as fd:
                fd.write(torrent_data)
                logger.debug(f"Torrent downloaded to {torrent_path}")
                print(fd.name + " " + url)

        except Exception as e:
            logger.exception(f"Failed to download torrent: {str(e)}")




    def _request(
            self, url: str, data: bytes = None, repeated: bool = False
    ) -> bytes:
        try:
            with self.session.open(url, data, 5) as r:
                # checking that tracker isn't blocked
                if r.geturl().startswith((self.url, self.url_dl)):
                    return r.read()
                raise EngineError(f"{url} is blocked. Try another proxy.")
        except (URLError, HTTPError) as err:
            error = str(err.reason)
            reason = f"{url} is not response! Maybe it is blocked."
            if "timed out" in error and not repeated:
                logger.debug("Request timed out. Repeating...")
                return self._request(url, data, True)
            if "no host given" in error:
                reason = "Proxy is bad, try another!"
            elif hasattr(err, "code"):
                reason = f"Request to {url} failed with status: {err.code}"

            raise EngineError(reason)

    def pretty_error(self, what: str, error: str) -> None:
        prettyPrinter({
            "engine_url": self.url,
            "desc_link": "https://github.com/imDMG/qBt_SE",
            "name": f"[{unquote(what)}][Error]: {error}",
            "link": self.url + "error",
            "size": "1 TB",  # lol
            "seeds": 100,
            "leech": 100
        })

log_file = BASEDIR / (FILENAME + ".log")

logging.basicConfig(
    format="%(asctime)s %(name)-12s %(levelname)-8s %(message)s",
    datefmt="%m-%d %H:%M",
    level=logging.DEBUG
)

file_handler = logging.FileHandler(log_file, mode="a")  # режим "a" для добавления записей
formatter = logging.Formatter("%(asctime)s %(name)-12s %(levelname)-8s %(message)s", datefmt="%m-%d %H:%M")
file_handler.setFormatter(formatter)

logger.addHandler(file_handler)


# engine = rutracker()
# engine.search('Теория большого взрыва')
# engine.download_torrent('https://rutracker.org/forum/dl.php?t=6583513')
