import sys
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = (ROOT / "index.html").resolve().as_uri()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    errors = []
    page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.goto(BASE_URL)
    page.wait_for_timeout(600)

    # 1. Test Left Pane Width (Default 420px)
    left_w = page.locator(".left-pane").evaluate("el => el.getBoundingClientRect().width")
    print(f"1. Left Pane Width on Desktop: {left_w}px")
    assert left_w >= 400, f"Expected left pane >= 400px, got {left_w}px"

    # 2. Test Draggable Resizer
    resizer = page.locator("#left-resizer")
    assert resizer.count() > 0, "#left-resizer element must exist"
    # Drag resizer to the right
    resizer_box = resizer.bounding_box()
    page.mouse.move(resizer_box["x"] + 2, resizer_box["y"] + 200)
    page.mouse.down()
    page.mouse.move(resizer_box["x"] + 80, resizer_box["y"] + 200)
    page.mouse.up()
    page.wait_for_timeout(200)

    new_left_w = page.locator(".left-pane").evaluate("el => el.getBoundingClientRect().width")
    print(f"2. Left Pane Width after dragging +80px: {new_left_w}px")
    assert new_left_w > left_w + 50, f"Resizing failed: {new_left_w} vs {left_w}"

    # Test double click to reset
    resizer.dblclick()
    page.wait_for_timeout(200)
    reset_w = page.locator(".left-pane").evaluate("el => el.getBoundingClientRect().width")
    print(f"   Left Pane Width after double-click reset: {reset_w}px")
    assert abs(reset_w - 420) < 5, f"Double-click reset failed: {reset_w}"

    # 3. Verify Track Titles Full Visibility in Queue
    track_title_box = page.locator('#track-list .qrow[data-idx="0"] .qt').bounding_box()
    print(f"3. Track Title Width in Queue: {track_title_box['width']}px")
    assert track_title_box["width"] > 160, f"Track title column too narrow: {track_title_box['width']}"

    # 4. Verify 3D Text Removed from Right Pane (Image 3)
    right_text = page.locator(".right-pane").text_content()
    print("4. Checking Right Pane text...")
    assert "Mô phỏng chấn tiêu" not in right_text, "Found 3D simulation text in right pane, should be removed!"
    assert "QUỸ ĐẠO LĂNG KÍNH" not in right_text, "Found QUỸ ĐẠO LĂNG KÍNH in right pane, should be removed!"
    print("   Verified: 3D text in Image 3 completely removed from Right Pane!")

    # 5. Verify Zero Spotify Footprint (Eliminate phone conflict) & 100% Square Modals
    sp_modal_count = page.locator("#spotify-modal").count()
    sp_btn_count = page.locator(".js-open-spotify").count()
    print(f"5. Spotify Modal count: {sp_modal_count}, Spotify Button count: {sp_btn_count}")
    assert sp_modal_count == 0, "Spotify modal must be removed"
    assert sp_btn_count == 0, "Spotify connect button must be removed"

    # Verify Create Playlist modal is present and 100% square
    page.locator(".js-btn-new-playlist").first.click()
    page.wait_for_timeout(200)
    cpl_modal = page.locator("#create-playlist-modal")
    assert not cpl_modal.is_hidden(), "Create Playlist modal should open"
    cpl_radius = page.locator("#create-playlist-modal .modal-card").evaluate("el => getComputedStyle(el).borderRadius")
    print("   Create Playlist modal border-radius:", cpl_radius)
    assert cpl_radius in ["0px", "0"], f"Modal must have 0px border-radius, got: {cpl_radius}"
    page.locator(".js-close-cpl-modal").first.click()
    page.wait_for_timeout(200)

    # 6. Verify Liked Songs Hero Header and Tiles
    page.locator(".nav-tabs [data-tab='liked']").click()
    page.wait_for_timeout(300)
    # Check that Liked tab has SVG heart, no emoji
    liked_hero_html = page.locator("#track-list").inner_html()
    assert "❤️" not in liked_hero_html and "🤍" not in liked_hero_html and "💖" not in liked_hero_html, "Found emoji in liked songs list!"
    print("6. Liked Songs list verified: 0 emojis present!")

    # 7. Take updated screenshots
    page.screenshot(path="tests/ui_refinements_desktop.png")
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(200)
    page.screenshot(path="tests/ui_refinements_mobile.png")
    print("7. Screenshots saved to tests/ui_refinements_desktop.png and tests/ui_refinements_mobile.png")

    print(f"Console errors: {len(errors)}")
    assert len(errors) == 0, f"Errors found: {errors}"
    print("\n=== ALL UI REFINEMENTS TESTS PASSED 100%! ===")
    browser.close()
