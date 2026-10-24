import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"C:\Users\nguye\.gemini\antigravity\scratch\vang-player")
BASE_URL = (ROOT / "index.html").resolve().as_uri()

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--autoplay-policy=no-user-gesture-required",
                "--use-fake-ui-for-media-stream"
            ]
        )
        page = await browser.new_page()
        
        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        page.on("console", lambda m: print(f"[{m.type}] {m.text}"))
        
        await page.goto(BASE_URL)
        await page.wait_for_timeout(500)
        
        await page.locator('[data-tab="playlists"]').click()
        await page.wait_for_timeout(300)
        await page.locator('#track-list .qrow[data-pl="curated-weeknd"]').click()
        await page.wait_for_selector("#track-list .qrow[data-idx]", timeout=8000)
        
        print("Clicking Weeknd track 0...")
        await page.locator("#track-list .qrow[data-idx='0']").click()
        await page.wait_for_timeout(2000)
        
        diag = await page.evaluate("""() => {
            const ref = window.AudioEngine.getRefAudio();
            const ctx = window.AudioEngine.ctx || (window.AudioEngine ? window.AudioEngine._ctx : null);
            return {
                refExists: !!ref,
                src: ref ? ref.src : null,
                paused: ref ? ref.paused : null,
                currentTime: ref ? ref.currentTime : null,
                duration: ref ? ref.duration : null,
                readyState: ref ? ref.readyState : null,
                networkState: ref ? ref.networkState : null,
                error: ref && ref.error ? { code: ref.error.code, message: ref.error.message } : null,
                appPos: window.AppState.pos,
                appPlaying: window.AppState.playing
            };
        }""")
        print("Diagnostic:", diag)
        
        await browser.close()

asyncio.run(run())
