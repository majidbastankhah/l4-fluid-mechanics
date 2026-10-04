#!/usr/bin/env python3
"""Screenshot rendered pages for visual checks (MathJax served locally; the sandbox blocks CDNs).
Usage:
  python3 _dev/screenshot.py <site_dir> <out_dir> <page>[#slideN] [<page>...]
    page: path relative to site_dir, e.g. notes/ch2.html  or  slides/ch2.html#5  (5 = slide number, 1-based)
    add  :full  to a notes page for a full-page capture, e.g. notes/ch2.html:full
Starts its own static server on a free port. Prints JS page errors.
"""
import asyncio, os, sys, pathlib, socket, threading, http.server, functools, urllib.parse as up
from playwright.async_api import async_playwright

site, out = sys.argv[1], sys.argv[2]; pages = sys.argv[3:]
os.makedirs(out, exist_ok=True)
s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=site)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Q, directory=site))
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = f'http://127.0.0.1:{port}/'
MJ3 = pathlib.Path('/tmp/mj/node_modules/mathjax'); MJ2 = pathlib.Path('/tmp/mj2/node_modules/mathjax')

async def main():
    async with async_playwright() as p:
        u = up.urlparse(os.environ.get('HTTPS_PROXY', ''))
        kw = {'args': ['--ignore-certificate-errors']}
        if u.hostname:
            px = {'server': f'{u.scheme}://{u.hostname}:{u.port}', 'bypass': '<-loopback>,localhost,127.0.0.1'}
            if u.username: px.update(username=up.unquote(u.username), password=up.unquote(u.password or ''))
            kw['proxy'] = px
        br = await p.chromium.launch(**kw)
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        async def mj3(route):
            f = MJ3 / route.request.url.split('/mathjax@')[1].split('/', 1)[1].split('?')[0]
            await (route.fulfill(path=str(f)) if f.exists() else route.abort())
        async def mj2(route):
            f = MJ2 / route.request.url.split('/mathjax/2.7.9/')[1].split('?')[0]
            await (route.fulfill(path=str(f)) if f.exists() else route.abort())
        await pg.route('**/mathjax@*/**', mj3)
        await pg.route('**/ajax/libs/mathjax/2.7.9/**', mj2)
        for spec in pages:
            full = spec.endswith(':full'); spec = spec[:-5] if full else spec
            path, _, slide = spec.partition('#')
            await pg.goto(B + path); await pg.wait_for_timeout(2500)
            name = path.replace('/', '_').replace('.html', '')
            if slide:
                await pg.evaluate(f"Reveal.slide({int(slide)-1}, 0, 999)"); await pg.wait_for_timeout(2000)
                name += f'_s{slide}'
            await pg.screenshot(path=f'{out}/{name}.png', full_page=full)
            print('saved', f'{out}/{name}.png')
        print('PAGE ERRORS:', errs)
        await br.close()
asyncio.run(main())
