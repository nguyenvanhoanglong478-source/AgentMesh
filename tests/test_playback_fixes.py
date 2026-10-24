import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent

async def test_fixes():
    base_url = (ROOT / "index.html").resolve().as_uri()
    print(f"Testing playback bug fixes on: {base_url}", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        await page.goto(base_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(500)

        # 1. TEST FIX 1: Opening playlist must NOT autoplay
        # Initial state should be paused
        is_playing_initial = await page.evaluate("window.AppState.playing")
        assert not is_playing_initial, "Initial state should not be playing"

        # Open Playlists tab
        await page.locator('[data-tab="playlists"]').click()
        await page.wait_for_timeout(200)

        # Click first playlist "Chill Lo-Fi & Mưa Đêm" (pl-1)
        await page.locator('#track-list .qrow[data-pl="pl-1"]').click()
        await page.wait_for_timeout(400)

        # Verify playlist is opened, tracks rendered, but AppState.playing is STILL false
        is_playing_after_open = await page.evaluate("window.AppState.playing")
        track_count = await page.locator("#track-list .qrow").count()
        assert track_count == 4, f"Expected 4 tracks in playlist pl-1, got {track_count}"
        assert not is_playing_after_open, f"Opening a playlist must NOT autoplay tracks! Got playing={is_playing_after_open}"
        print("[PASS] Test 1: Opening playlist displays tracklist WITHOUT autostarting playback", flush=True)

        # 2. TEST FIX 2: Explicitly clicking a track starts playing from 0:00 (no random midway offset)
        first_track = page.locator("#track-list .qrow").first
        await first_track.click()
        await page.wait_for_timeout(300)

        is_playing_now = await page.evaluate("window.AppState.playing")
        current_pos = await page.evaluate("window.AppState.pos")
        assert is_playing_now, "Clicking a track must start playback"
        assert current_pos <= 2.0, f"Track must start from the beginning (pos ~ 0s), got {current_pos}"
        print(f"[PASS] Test 2: Clicking track starts playback from beginning (pos={current_pos:.2f}s)", flush=True)

        # 3. TEST FIX 3: Verify playback does NOT stop after 4-6 seconds
        # Wait 6 seconds and verify it is still playing smoothly
        await page.wait_for_timeout(6000)
        is_still_playing = await page.evaluate("window.AppState.playing")
        pos_after_6s = await page.evaluate("window.AppState.pos")
        assert is_still_playing, "Track should still be playing after 6 seconds"
        assert pos_after_6s >= 5.0, f"Position after 6s should be >= 5s, got {pos_after_6s:.2f}s"
        print(f"[PASS] Test 3: Track continuous playback verified after 6s (pos={pos_after_6s:.2f}s, playing={is_still_playing})", flush=True)

        # 4. TEST FIX 4: Test switching to another track resets position to 0:00
        second_track = page.locator("#track-list .qrow").nth(1)
        await second_track.click()
        await page.wait_for_timeout(300)
        pos_track2 = await page.evaluate("window.AppState.pos")
        assert pos_track2 <= 2.0, f"Switching track must reset position to 0s, got {pos_track2}"
        print(f"[PASS] Test 4: Switching to next track starts cleanly at 0:00 (pos={pos_track2:.2f}s)", flush=True)

        # 5. TEST FIX 5: Test 'Phát tất cả' button in playlist header
        # Pause first
        await page.locator(".js-play").click()
        await page.wait_for_timeout(200)
        assert not (await page.evaluate("window.AppState.playing")), "Should be paused"

        # Click 'Phát tất cả' button
        play_all_btn = page.locator("#btn-play-collection")
        assert await play_all_btn.is_visible(), "'Phát tất cả' button must be present in playlist header"
        await play_all_btn.click()
        await page.wait_for_timeout(300)
        assert await page.evaluate("window.AppState.playing"), "'Phát tất cả' must start playback"
        print("[PASS] Test 5: 'Phát tất cả' button initiates playback from track 0 cleanly", flush=True)

        await browser.close()
        print("\n=== ALL PLAYBACK FIX VERIFICATIONS PASSED (100%) ===", flush=True)

if __name__ == "__main__":
    asyncio.run(test_fixes())
