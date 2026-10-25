import json
import sys
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

    print("=== BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG AI AGENTS VISUALIZER ===")

    # 1. Verify Topbar and Brand
    brand_text = page.locator(".brand-logo").first.text_content().strip()
    print(f"1. Brand Logo: '{brand_text}'")
    assert "AGENT MESH" in brand_text, f"Brand text mismatch: {brand_text}"

    # 2. Verify 100% Square Buttons (border-radius: 0px)
    non_square = page.evaluate("""() => {
        const els = document.querySelectorAll('button, .t-stat, .left-tab-btn, .stream-event, .agent-card, .sec-box, .modal-card');
        const bad = [];
        for (const el of els) {
            const rad = window.getComputedStyle(el).borderRadius;
            if (rad && rad !== '0px' && rad !== '0') {
                bad.push({ tag: el.tagName, class: el.className, rad });
            }
        }
        return bad;
    }""")
    print(f"2. Non-square elements count: {len(non_square)}")
    assert len(non_square) == 0, f"Found non-square elements: {non_square[:3]}"

    # 3. Test Resizer Dragging & Double Click Reset
    left_pane = page.locator("#left-pane")
    init_w = left_pane.evaluate("el => el.getBoundingClientRect().width")
    print(f"3. Initial Left Pane width: {init_w}px")
    assert abs(init_w - 380) < 5, f"Expected 380px, got {init_w}"

    resizer = page.locator("#left-resizer")
    r_box = resizer.bounding_box()
    page.mouse.move(r_box["x"] + 2, r_box["y"] + 200)
    page.mouse.down()
    page.mouse.move(r_box["x"] + 70, r_box["y"] + 200)
    page.mouse.up()
    page.wait_for_timeout(200)

    dragged_w = left_pane.evaluate("el => el.getBoundingClientRect().width")
    print(f"   Left Pane width after drag: {dragged_w}px")
    assert dragged_w > init_w + 40, "Resizer drag failed"

    # Double click reset
    resizer.dblclick()
    page.wait_for_timeout(200)
    reset_w = left_pane.evaluate("el => el.getBoundingClientRect().width")
    print(f"   Left Pane width after dblclick: {reset_w}px")
    assert abs(reset_w - 380) < 5, "Double click reset failed"

    # 4. Test Simulation Playback and Stream Events
    btn_play = page.locator("#btn-toggle-play")
    btn_play.click()
    page.wait_for_timeout(1200)
    
    sim_state = page.evaluate("""() => {
        return {
            playing: window.AppEngine.isPlaying,
            time: window.AppEngine.currentTime,
            eventCount: document.querySelectorAll('.stream-event').length
        };
    }""")
    print("4. Simulation running state:", json.dumps(sim_state, ensure_ascii=False))
    assert sim_state["playing"] and sim_state["time"] > 0, "Simulation did not advance"
    assert sim_state["eventCount"] > 0, "No stream events rendered during simulation"

    # Pause
    btn_play.click()
    page.wait_for_timeout(200)
    assert not page.evaluate("() => window.AppEngine.isPlaying"), "Simulation did not pause"

    # 5. Test Inspector Card Details
    inspect_name = page.locator("#inspect-name").text_content().strip()
    inspect_model = page.locator("#inspect-model").text_content().strip()
    print(f"5. Inspector active agent: '{inspect_name}', Model: '{inspect_model}'")
    assert len(inspect_name) > 0 and len(inspect_model) > 0, "Inspector fields empty"

    # 6. Test Scenario Switching
    selector = page.locator("#scenario-selector")
    selector.select_option("research")
    page.wait_for_timeout(400)
    res_agents = page.locator("#active-agents-count").text_content()
    print(f"6. Switched to Deep Research scenario, agent count: {res_agents}")
    assert "5" in res_agents, f"Expected 5 agents in research scenario, got {res_agents}"

    # 7. Test Human-in-the-Loop Approval Modal
    page.locator("#btn-trigger-approval").click()
    page.wait_for_timeout(200)
    app_modal = page.locator("#approval-modal")
    assert not app_modal.is_hidden(), "Approval modal did not open"
    # Approve
    page.locator("#btn-approve-gate").click()
    page.wait_for_timeout(300)
    assert app_modal.is_hidden(), "Approval modal did not close on approve"
    print("7. Human-in-the-Loop Approval Gate passed!")

    # 8. Test Inject Custom Task Modal
    page.locator("#btn-inject-task").click()
    page.wait_for_timeout(200)
    task_modal = page.locator("#task-modal")
    assert not task_modal.is_hidden(), "Task modal did not open"
    page.fill("#task-input-text", "Kiểm thử thâm nhập tự động cụm API Gateway")
    page.locator("#btn-submit-task").click()
    page.wait_for_timeout(300)
    assert task_modal.is_hidden(), "Task modal did not close on submit"
    print("8. Custom Task injection verified successfully!")

    # 9. Test Theme Switcher
    theme_btn = page.locator("#btn-toggle-theme")
    assert theme_btn.text_content().strip() == "Sáng"
    theme_btn.click()
    page.wait_for_timeout(200)
    assert page.locator("html").get_attribute("data-theme") == "light"
    assert theme_btn.text_content().strip() == "Tối"
    theme_btn.click()
    page.wait_for_timeout(200)
    assert page.locator("html").get_attribute("data-theme") == "dark"
    print("9. Theme switcher (Dark <-> Light) verified!")

    # 10. Capture Screenshots
    page.screenshot(path="tests/visualizer_desktop.png")
    page.set_viewport_size({"width": 390, "height": 844})
    page.wait_for_timeout(300)
    page.screenshot(path="tests/visualizer_mobile.png")
    print("10. Screenshots saved to tests/visualizer_desktop.png and tests/visualizer_mobile.png")

    print(f"\nConsole Errors Count: {len(errors)}")
    if errors:
        print("Console errors:", errors)
    assert len(errors) == 0, f"Errors encountered: {errors}"
    print("=== TẤT CẢ 10/10 MỤC KIỂM THỬ ĐẠT CHUẨN 100%! ===")
    browser.close()
