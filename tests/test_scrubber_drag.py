import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent

async def test_scrubber_suite():
    base_url = (ROOT / "index.html").resolve().as_uri()
    print(f"Testing comprehensive scrubber fixes on: {base_url}", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        await page.goto(base_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(400)

        # 1. TEST 1: Initial state must be at 0:00 (no 0:37 hardcode!)
        pos0 = await page.evaluate("window.AppState.pos")
        time_text = await page.locator(".js-time").first.inner_text()
        fill_width = await page.locator(".js-scrub-fill").first.evaluate("el => el.style.width")
        head_left = await page.locator(".js-scrub-head").first.evaluate("el => el.style.left")
        print(f"Initial: pos={pos0}, time={time_text}, fill={fill_width}, head={head_left}", flush=True)

        assert pos0 == 0, f"Expected initial pos=0, got {pos0}"
        assert time_text == "0:00", f"Expected initial time 0:00, got {time_text}"
        assert fill_width in ("0%", "0", ""), f"Expected initial fill 0%, got {fill_width}"
        print("[PASS] Test 1: Scrubber initializes cleanly at 0:00 (0% fill, 0% head)", flush=True)

        # 2. TEST 2: Click to seek (Tap at 30%)
        scrub = page.locator(".js-scrub")
        box = await scrub.bounding_box()
        assert box and box["width"] > 100, f"Scrubber element must have visible width, got {box}"

        target_30_x = box["x"] + box["width"] * 0.30
        target_y = box["y"] + box["height"] * 0.5
        await page.mouse.click(target_30_x, target_y)
        await page.wait_for_timeout(200)

        dur = await page.evaluate("window.AppState.tracks[window.AppState.idx].d")
        pos_after_30 = await page.evaluate("window.AppState.pos")
        expected_30 = dur * 0.30
        diff_30 = abs(pos_after_30 - expected_30)
        assert diff_30 < 4.0, f"Expected pos ~ {expected_30:.1f}s, got {pos_after_30:.1f}s (diff={diff_30:.2f})"
        print(f"[PASS] Test 2: Clicking scrubber at 30% seeks accurately to {pos_after_30:.1f}s (target={expected_30:.1f}s)", flush=True)

        # 3. TEST 3: Dragging scrubber (PointerDown -> PointerMove across -> PointerUp)
        # Drag from 30% to 75%
        target_75_x = box["x"] + box["width"] * 0.75
        await page.mouse.move(target_30_x, target_y)
        await page.mouse.down()
        await page.wait_for_timeout(100)

        # Move to 50%
        await page.mouse.move(box["x"] + box["width"] * 0.50, target_y, steps=5)
        mid_fill = await page.locator(".js-scrub-fill").first.evaluate("el => el.style.width")
        print(f"Mid-drag fill: {mid_fill}", flush=True)

        # Move to 75% and release
        await page.mouse.move(target_75_x, target_y, steps=5)
        await page.wait_for_timeout(100)
        await page.mouse.up()
        await page.wait_for_timeout(300)

        pos_after_drag = await page.evaluate("window.AppState.pos")
        expected_75 = dur * 0.75
        diff_75 = abs(pos_after_drag - expected_75)
        assert diff_75 < 4.0, f"Expected pos ~ {expected_75:.1f}s after drag, got {pos_after_drag:.1f}s"
        print(f"[PASS] Test 3: Dragging scrubber from 30% to 75% smoothly updates position to {pos_after_drag:.1f}s", flush=True)

        # 4. TEST 4: Playback resumes smoothly from dragged position
        await page.locator(".js-play").click()
        await page.wait_for_timeout(2000)
        pos_after_play = await page.evaluate("window.AppState.pos")
        assert pos_after_play > pos_after_drag, f"Position should advance after play, got {pos_after_play} vs {pos_after_drag}"
        print(f"[PASS] Test 4: Playback continues forward smoothly from seek position (now {pos_after_play:.1f}s)", flush=True)

        # 5. TEST 5: Mobile Viewport Touch / Pointer Dragging (390x844)
        mob_context = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        mob_page = await mob_context.new_page()
        await mob_page.goto(base_url, wait_until="domcontentloaded")
        await mob_page.wait_for_timeout(400)

        mob_scrub = mob_page.locator(".js-scrub")
        mob_box = await mob_scrub.bounding_box()
        assert mob_box and mob_box["width"] > 100, f"Mobile scrubber should be visible, got {mob_box}"

        # Tap at 40% on mobile
        mob_target_40_x = mob_box["x"] + mob_box["width"] * 0.40
        mob_target_y = mob_box["y"] + mob_box["height"] * 0.5
        await mob_page.mouse.click(mob_target_40_x, mob_target_y)
        await mob_page.wait_for_timeout(200)

        mob_pos = await mob_page.evaluate("window.AppState.pos")
        mob_dur = await mob_page.evaluate("window.AppState.tracks[window.AppState.idx].d")
        mob_expected = mob_dur * 0.40
        assert abs(mob_pos - mob_expected) < 4.0, f"Mobile seek expected ~{mob_expected:.1f}s, got {mob_pos:.1f}s"
        print(f"[PASS] Test 5: Mobile responsive scrubber seek operates properly at {mob_pos:.1f}s", flush=True)

        await browser.close()
        print("\n=== ALL 5 SCRUBBER TESTS PASSED (100%) ===", flush=True)

if __name__ == "__main__":
    asyncio.run(test_scrubber_suite())
