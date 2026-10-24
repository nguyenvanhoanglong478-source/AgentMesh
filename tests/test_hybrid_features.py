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

    # 1. Verify Topbar Brand and Status
    user_status = page.locator(".js-user-status").first.text_content().strip()
    print("1. User Status:", user_status)
    assert user_status == "Web Mở", f"Expected 'Web Mở', got: '{user_status}'"
    assert "thử nghiệm" not in user_status.lower(), "Must not contain 'thử nghiệm'"

    # 2. Verify Theme button has NO emojis
    theme_btn_text = page.locator(".js-toggle-theme").first.text_content().strip()
    print("2. Theme Button Text:", theme_btn_text)
    assert "☀️" not in theme_btn_text and "🌙" not in theme_btn_text, f"Theme button must not have icons: {theme_btn_text}"

    # 3. Test Spotify Modal
    sp_modal = page.locator("#spotify-modal")
    assert sp_modal.get_attribute("hidden") is not None, "Spotify modal should initially be hidden"
    page.locator(".js-open-spotify").first.click()
    page.wait_for_timeout(200)
    assert sp_modal.get_attribute("hidden") is None, "Spotify modal should be open"
    client_id_val = page.locator("#sp-client-id").input_value()
    print("3. Spotify Modal opened successfully. Client ID input accessible.")

    # Check modal border-radius is 0px
    modal_card_radius = page.locator("#spotify-modal .modal-card").evaluate("el => getComputedStyle(el).borderRadius")
    print("   Modal Card border-radius:", modal_card_radius)
    assert modal_card_radius in ["0px", "0"], f"Modal must have 0px border-radius, got: {modal_card_radius}"

    # Close Spotify Modal
    page.locator(".js-close-spotify").first.click()
    page.wait_for_timeout(200)
    assert sp_modal.get_attribute("hidden") is not None, "Spotify modal should be hidden after close"
    print("   Spotify Modal closed successfully.")

    # 4. Verify Device Modal and Device Selector are Completely Removed (as instructed)
    dev_modal_count = page.locator("#device-modal").count()
    open_devices_count = page.locator(".js-open-devices").count()
    assert dev_modal_count == 0, "#device-modal should be completely removed from DOM"
    assert open_devices_count == 0, ".js-open-devices should be completely removed from DOM"
    print("4. Device Modal and Device Selector verified: completely removed (count = 0).")

    # 5. Test Search Source Switcher
    page.locator(".nav-tabs [data-tab='search']").click()
    page.wait_for_timeout(300)
    pill_open_on = page.locator("#src-pill-open").evaluate("el => el.classList.contains('on')")
    print("5. Search tab active. Web Mở pill active:", pill_open_on)
    assert pill_open_on, "Web Mở pill should be active by default"

    # Click Spotify pill when not logged in -> prompts toast and opens Spotify modal
    page.locator("#src-pill-spotify").click()
    page.wait_for_timeout(300)
    assert sp_modal.get_attribute("hidden") is None, "Spotify modal should open when clicking Spotify search while logged out"
    page.locator(".js-close-spotify").first.click()
    page.wait_for_timeout(200)

    # 6. Test Mobile Viewport and Drawer Navigation
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(300)
    # Open Left Drawer
    page.locator(".mob-bar [data-mob-drawer='left']").click()
    page.wait_for_timeout(300)
    left_open = page.locator(".left-pane").evaluate("el => el.classList.contains('mob-open')")
    print("6. Mobile Drawer Left opened:", left_open)
    assert left_open, "Left pane should be open on mobile"

    # Close Drawer
    page.keyboard.press("Escape")
    page.wait_for_timeout(200)
    left_closed = page.locator(".left-pane").evaluate("el => !el.classList.contains('mob-open')")
    print("   Mobile Drawer closed via Escape:", left_closed)
    assert left_closed, "Left pane should close on Escape"

    # Capture screenshots for evidence
    page.set_viewport_size({"width": 1280, "height": 800})
    page.wait_for_timeout(300)
    page.screenshot(path="tests/hybrid_desktop.png")
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(300)
    page.screenshot(path="tests/hybrid_mobile.png")
    print("7. Screenshots saved to tests/hybrid_desktop.png and tests/hybrid_mobile.png")

    print("Console errors count:", len(errors))
    if errors:
        print("ERRORS:", errors)
    assert len(errors) == 0, f"Found console errors: {errors}"
    print("\n=== ALL HYBRID AUDIT TESTS PASSED 100%! ===")
    browser.close()
