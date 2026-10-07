#!/usr/bin/env python3
"""Save every slide deck in _site/slides/ as a PDF (_site/slides/pdf/<deck>.pdf).

Each slide is printed exactly as it looks on screen (all steps revealed), one slide per page,
and the pages are joined into one PDF per deck. Run after `quarto render`; the GitHub
workflow does this automatically.

Needs:    pip install playwright pypdf && playwright install chromium
Usage:    python3 _dev/make-slide-pdfs.py            (all decks)
          python3 _dev/make-slide-pdfs.py ch2        (one deck)
Optional: MATHJAX2_DIR=/path/to/mathjax-2.7.9 serves MathJax locally (offline testing).
"""
import asyncio, functools, http.server, io, os, pathlib, sys, threading
from playwright.async_api import async_playwright
from pypdf import PdfReader, PdfWriter

ROOT = pathlib.Path(__file__).resolve().parent.parent / "_site"
OUT = ROOT / "slides" / "pdf"
W, H = 1200, 750                                   # slide size (slides/_metadata.yml)
decks = sys.argv[1:] or sorted(p.stem for p in (ROOT / "slides").glob("*.html"))

HIDE_UI = """
.reveal .controls, .reveal .progress, .slide-menu-button, .slide-chalkboard-buttons,
.reveal .slide-number, .reveal .notes-link { display: none !important; }
"""

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{srv.server_address[1]}/slides/"

async def print_deck(page, deck):
    await page.goto(BASE + deck + ".html", wait_until="load", timeout=60000)
    await page.wait_for_function("window.Reveal && Reveal.isReady && Reveal.isReady()", timeout=60000)
    # wait until MathJax has typeset everything (a callback queued after all typesetting)
    await page.wait_for_function("!!(window.MathJax && MathJax.Hub && MathJax.Hub.Queue)", timeout=60000)
    await page.evaluate("window.__mjdone = false; MathJax.Hub.Queue(function(){ window.__mjdone = true; })")
    await page.wait_for_function("window.__mjdone === true", timeout=120000)
    await page.add_style_tag(content=HIDE_UI)
    await page.wait_for_timeout(1500)
    idx = await page.evaluate("Reveal.getSlides().map(s => { const i = Reveal.getIndices(s); return [i.h, i.v || 0]; })")
    writer = PdfWriter()
    for h, v in idx:
        await page.evaluate(f"Reveal.slide({h}, {v}, 999)")          # 999 = show every step
        await page.wait_for_timeout(700)
        pdf = await page.pdf(width=f"{W}px", height=f"{H}px", print_background=True, page_ranges="1")
        writer.add_page(PdfReader(io.BytesIO(pdf)).pages[0])
    writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)   # smaller file
    with open(OUT / f"{deck}.pdf", "wb") as f:
        writer.write(f)
    print(f"saved {OUT / (deck + '.pdf')} ({len(idx)} slides)")

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    mj = os.environ.get("MATHJAX2_DIR")
    failed = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": W, "height": H})
        await page.emulate_media(media="screen")                     # print the slides as seen on screen
        if mj:
            async def serve_mj(route):
                f = pathlib.Path(mj) / route.request.url.split("/mathjax/2.7.9/")[1].split("?")[0]
                await (route.fulfill(path=str(f)) if f.exists() else route.abort())
            await page.route("**/ajax/libs/mathjax/2.7.9/**", serve_mj)
        for d in decks:
            try:
                await print_deck(page, d)
            except Exception as e:
                failed.append(d); print("FAILED", d, e, file=sys.stderr)
        await browser.close()
    srv.shutdown()
    if failed:
        sys.exit(1)

asyncio.run(main())
