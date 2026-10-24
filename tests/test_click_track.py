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
    page = browser.new_page()
    errors = []
    page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(str(err)))
    page.goto(BASE_URL)
    page.wait_for_timeout(500)

    # 1. Click Play button directly on load
    page.locator(".js-play").first.click()
    page.wait_for_function("() => window.AudioEngine.getRefAudio() && window.AudioEngine.getRefAudio().currentTime > 0.3", timeout=8000)
    s1 = page.evaluate("""() => {
        const a = window.AudioEngine.getRefAudio();
        const tr = window.AppState.tracks[window.AppState.idx];
        return {
            title: tr.t,
            id: tr.id,
            playing: window.AppState.playing,
            refPaused: a ? a.paused : null,
            refTime: a ? Math.round(a.currentTime * 100) / 100 : null,
            pos: Math.round(window.AppState.pos * 100) / 100,
            srcOk: a ? a.src.startsWith('https://') : false
        };
    }""")
    print("1. Direct Play Button on Load:", json.dumps(s1, ensure_ascii=False))
    assert not s1["refPaused"] and s1["refTime"] > 0.3 and s1["srcOk"], f"Failed 1: {s1}"

    # 2. Click Track #2 in Queue
    page.locator('#track-list .qrow[data-idx="1"]').click()
    page.wait_for_function("() => window.AudioEngine.getRefAudio() && window.AudioEngine.getRefAudio().currentTime > 0.3", timeout=8000)
    s2 = page.evaluate("""() => {
        const a = window.AudioEngine.getRefAudio();
        const tr = window.AppState.tracks[window.AppState.idx];
        return {
            title: tr.t,
            id: tr.id,
            playing: window.AppState.playing,
            refPaused: a ? a.paused : null,
            refTime: a ? Math.round(a.currentTime * 100) / 100 : null,
            pos: Math.round(window.AppState.pos * 100) / 100
        };
    }""")
    print("2. Click Track #2 in Queue:", json.dumps(s2, ensure_ascii=False))
    assert not s2["refPaused"] and s2["refTime"] > 0.3, f"Failed 2: {s2}"

    # 3. Scrubber Seek to 50%
    sbox = page.locator(".js-scrub").bounding_box()
    page.mouse.click(sbox["x"] + sbox["width"] * 0.5, sbox["y"] + sbox["height"] / 2)
    page.wait_for_timeout(600)
    s3 = page.evaluate("""() => {
        const a = window.AudioEngine.getRefAudio();
        return {
            refTime: a ? Math.round(a.currentTime * 100) / 100 : null,
            pos: Math.round(window.AppState.pos * 100) / 100,
            dur: window.AppState.tracks[window.AppState.idx].d
        };
    }""")
    print("3. Scrubber Seek 50%:", json.dumps(s3, ensure_ascii=False))
    assert abs(s3["pos"] - 15.0) < 2.5 and abs(s3["refTime"] - 15.0) < 2.5, f"Failed 3: {s3}"

    # 4. Liked Tab track click
    page.locator('[data-tab="liked"]').click()
    page.wait_for_timeout(300)
    page.locator('#track-list .qrow[data-idx="2"]').click()
    page.wait_for_function("() => window.AudioEngine.getRefAudio() && window.AudioEngine.getRefAudio().currentTime > 0.3", timeout=8000)
    s4 = page.evaluate("""() => {
        const a = window.AudioEngine.getRefAudio();
        const tr = window.AppState.tracks[window.AppState.idx];
        return {
            title: tr.t,
            id: tr.id,
            refPaused: a ? a.paused : null,
            refTime: a ? Math.round(a.currentTime * 100) / 100 : null
        };
    }""")
    print("4. Click Track in Liked Tab:", json.dumps(s4, ensure_ascii=False))
    assert not s4["refPaused"] and s4["refTime"] > 0.3, f"Failed 4: {s4}"

    print("Errors:", errors)
    assert len(errors) == 0, f"Console errors: {errors}"
    print("=== ALL 4 REAL PLAYBACK TESTS PASSED 100%! ===")
    browser.close()
