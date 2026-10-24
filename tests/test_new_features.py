import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent

async def test_suite():
    base_url = (ROOT / "index.html").resolve().as_uri()
    print(f"Testing new features (Ambient light, The Weeknd playlist, Volume slider) on: {base_url}", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        await page.goto(base_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(400)

        # 1. VERIFY AMBIENT LIGHT
        amb_primary = page.locator(".js-ambient-primary")
        assert await amb_primary.count() == 1, "Primary ambient glow must exist in DOM"
        assert await page.locator(".js-ambient-secondary").count() == 1, "Secondary ambient glow must exist in DOM"
        amb_opacity = await amb_primary.evaluate("el => window.getComputedStyle(el).opacity")
        assert float(amb_opacity) > 0.5, f"Ambient light must be visible (opacity > 0.5), got {amb_opacity}"
        print(f"[PASS] 1. Ambient Light verified (primary opacity={amb_opacity})", flush=True)

        # 2. VERIFY THE WEEKND PLAYLIST OPENING
        await page.locator('[data-tab="playlists"]').click()
        await page.wait_for_timeout(300)

        # Look for curated-weeknd
        weeknd_row = page.locator('#track-list .qrow[data-pl="curated-weeknd"]')
        assert await weeknd_row.count() == 1, "The Weeknd playlist must be listed in Tuyển tập"
        print("Found The Weeknd playlist row, clicking...", flush=True)
        await weeknd_row.click()

        # Wait for tracklist to load from iTunes API
        await page.wait_for_selector("#track-list .qrow[data-idx]", timeout=8000)

        # Check tracklist is loaded
        tracks_count = await page.locator("#track-list .qrow[data-idx]").count()
        assert tracks_count >= 10, f"The Weeknd playlist should load at least 10 tracks, got {tracks_count}"
        first_title = await page.locator("#track-list .qrow[data-idx='0'] .qt").inner_text()
        first_artist = await page.locator("#track-list .qrow[data-idx='0'] .qa").inner_text()
        print(f"[PASS] 2. The Weeknd playlist opened with {tracks_count} tracks! First song: '{first_title}' by '{first_artist}'", flush=True)

        # 3. VERIFY VOLUME CONTROLS
        vol_track = page.locator(".transport-right .js-vol-track")
        assert await vol_track.is_visible(), "Volume track in transport-right must be visible"
        vol_box = await vol_track.bounding_box()
        assert vol_box and vol_box["width"] >= 90, f"Volume track should be wider (>=90px), got {vol_box['width']}px"
        assert await page.locator(".transport-right .js-vol-head").is_visible(), "Square volume head/knob must be visible"

        # Click at 50% on volume track
        target_50_x = vol_box["x"] + vol_box["width"] * 0.50
        target_y = vol_box["y"] + vol_box["height"] * 0.5
        await page.mouse.click(target_50_x, target_y)
        await page.wait_for_timeout(150)
        vol_val = await page.locator(".transport-right .js-vol-lbl").inner_text()
        print(f"Volume after 50% click: {vol_val}", flush=True)
        assert "50" in vol_val or "49" in vol_val or "51" in vol_val, f"Volume should be ~50%, got {vol_val}"

        # Test Volume Presets in right panel
        preset_100 = page.locator('.right-pane .js-vol-preset[data-v="1"]')
        if await preset_100.count() > 0:
            await preset_100.click()
            await page.wait_for_timeout(100)
            vol_val_100 = await page.locator(".transport-right .js-vol-lbl").inner_text()
            assert "100" in vol_val_100, f"Expected 100% after clicking preset, got {vol_val_100}"
            print("[PASS] 3. Master volume slider & 100% preset verified", flush=True)

        # Test Mute button
        mute_btn = page.locator(".transport-right .js-mute")
        await mute_btn.click()
        await page.wait_for_timeout(100)
        is_muted = await page.evaluate("window.AudioEngine.isMuted()")
        assert is_muted, "AudioEngine should be muted after clicking mute button"
        print("[PASS] 4. Mute toggle button verified", flush=True)

        await browser.close()
        print("\n=== ALL NEW FEATURE VERIFICATIONS PASSED (100%) ===", flush=True)

if __name__ == "__main__":
    asyncio.run(test_suite())
