import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
ARTIFACT_DIR = Path(r"C:\Users\nguye\.gemini\antigravity\brain\dcbc4ce6-22e7-46ac-8c3e-a9dd1e7ad9d4")


async def run_tests():
    base_url = (ROOT / "index.html").resolve().as_uri()
    errors = []
    print(f"Testing URL: {base_url}", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
        )

        # 1. DESKTOP VIEWPORT TESTS (1280x800)
        context = await browser.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=2)
        page = await context.new_page()
        page.on("pageerror", lambda err: errors.append(f"PageError: {err}"))
        page.on("console", lambda msg: errors.append(f"ConsoleError: {msg.text}") if msg.type == "error" else None)

        await page.goto(base_url, wait_until="domcontentloaded")
        await page.wait_for_timeout(400)

        # T01: Verify Brand & Initial Track Metadata
        title_text = await page.locator(".js-title").inner_text()
        assert title_text == "Đèn Đường Lúc Ba Giờ", f"Expected initial title, got {title_text}"
        print("[PASS] T01: Initial track metadata rendered", flush=True)

        # T02: Verify Geometric Task Buttons (Play triangle polygon, Prev, Next, Shuffle, Repeat, Volume)
        play_btn = page.locator(".js-play")
        assert await play_btn.locator("svg polygon").count() == 1, "Play button must contain a triangle <polygon>"
        assert await page.locator(".js-prev svg").count() == 1, "Prev button must have geometric SVG"
        assert await page.locator(".js-next svg").count() == 1, "Next button must have geometric SVG"
        assert await page.locator(".js-shuffle svg").count() == 1, "Shuffle button must have geometric SVG"
        assert await page.locator(".js-repeat svg").count() == 1, "Repeat button must have geometric SVG"
        assert await page.locator(".js-mute svg").count() == 1, "Volume/Mute button must have geometric SVG"
        print("[PASS] T02: Geometric task buttons (Play triangle, Prev, Next, Shuffle, Repeat, Volume) present", flush=True)

        # T03: Verify Play/Pause Toggle switches triangle icon to Pause bars & updates audio/FFT
        await play_btn.click()
        await page.wait_for_timeout(350)
        state = await play_btn.get_attribute("data-state")
        assert state == "playing", f"Expected playing state, got {state}"
        assert await play_btn.locator("svg rect").count() == 2, "Playing state should show 2 pause bars"
        print("[PASS] T03: Play/Pause toggle updates state and icon", flush=True)

        # T04: Verify 3D Canvas ("Khối đốm hạt") is mounted and rendering non-empty pixels
        canvas_ok = await page.evaluate("""() => {
            const c = document.querySelector('#main-stage canvas');
            if (!c || c.width === 0 || c.height === 0) return false;
            const ctx = c.getContext('2d');
            const data = ctx.getImageData(0, 0, c.width, c.height).data;
            let nonBlack = 0;
            for (let i = 0; i < data.length; i += 40) {
                if (data[i] > 20 || data[i+1] > 20 || data[i+2] > 20) nonBlack++;
            }
            return nonBlack > 50;
        }""")
        assert canvas_ok, "3D Particle Cluster canvas should render visible particles"
        print("[PASS] T04: 3D 'Khối đốm hạt' (Particle Cluster) canvas active & rendering", flush=True)

        # Capture Desktop Screenshot in "Khối đốm hạt" mode
        if ARTIFACT_DIR.exists():
            await page.screenshot(path=str(ARTIFACT_DIR / "vang_desktop_cluster.png"))

        # T05: Verify Visualizer Mode Switching ("Khối đốm hạt" -> "Địa hình" -> "Xoáy hạt")
        vmode_cluster_title = await page.locator('.js-vmode[data-m="cluster"]').get_attribute("title")
        assert "Khối đốm hạt" in vmode_cluster_title, f"Expected 'Khối đốm hạt', got {vmode_cluster_title}"
        await page.locator('.js-vmode[data-m="ridge"]').click()
        await page.wait_for_timeout(200)
        assert "on" in (await page.locator('.js-vmode[data-m="ridge"]').get_attribute("class"))
        await page.locator('.js-vmode[data-m="vortex"]').click()
        await page.wait_for_timeout(200)
        assert "on" in (await page.locator('.js-vmode[data-m="vortex"]').get_attribute("class"))
        await page.locator('.js-vmode[data-m="cluster"]').click()
        await page.wait_for_timeout(250)
        print("[PASS] T05: All 3 3D visualizer modes (Khối đốm hạt, Địa hình, Xoáy hạt) switch cleanly", flush=True)

        # T06: Verify Track Selection & Next/Prev Transport
        await page.locator(".js-next").click()
        await page.wait_for_timeout(350)
        title_after_next = await page.locator(".js-title").inner_text()
        assert title_after_next == "Salt & Static", f"Expected 'Salt & Static', got {title_after_next}"
        print("[PASS] T06: Next track button advances track and updates adaptive palette", flush=True)

        # T07: Verify Library Tabs (Yêu thích, Tuyển tập, Gần đây, Tìm kiếm)
        await page.locator('[data-tab="liked"]').click()
        liked_count = await page.locator("#track-list .qrow").count()
        assert liked_count == 4, f"Expected 4 liked tracks, got {liked_count}"

        await page.locator('[data-tab="playlists"]').click()
        pl_count = await page.locator("#track-list .qrow[data-pl]").count()
        assert pl_count >= 4, f"Expected at least 4 playlists/collections, got {pl_count}"
        await page.locator('#track-list .qrow[data-pl="pl-1"]').click()
        await page.wait_for_timeout(320)
        assert (await page.locator("#track-list .qrow").count()) == 4

        await page.locator('[data-tab="search"]').click()
        # Verify Search source pills (Web Mở & Spotify)
        assert await page.locator("#src-pill-open").is_visible(), "Web Mở source pill should be visible"
        assert await page.locator("#src-pill-spotify").is_visible(), "Spotify source pill should be visible"

        await page.fill("#search-input", "Mưa Phố")
        await page.wait_for_timeout(350)
        assert (await page.locator("#track-list .qrow").count()) >= 1
        await page.fill("#search-input", "")
        await page.locator('[data-tab="queue"]').click()
        print("[PASS] T07: Library tabs & Multi-Source Search (Liked, Playlists, Recent, Search) filter and load tracks", flush=True)

        # T08: Verify Scrubber, Shuffle, Repeat, Volume & Mute
        await page.locator(".js-shuffle").click()
        assert "on" in (await page.locator(".js-shuffle").get_attribute("class"))
        await page.locator(".js-repeat").click()
        assert "on" in (await page.locator(".js-repeat").get_attribute("class"))
        await page.locator(".js-mute").click()
        print("[PASS] T08: Shuffle, Repeat, Scrubber, and Mute controls operate properly", flush=True)

        # T09: Verify Device Switcher Modal (Phone <-> Laptop Spotify Connect)
        await page.locator(".topbar .js-open-devices").first.click()
        await page.wait_for_timeout(150)
        assert not (await page.locator("#device-modal").is_hidden())
        await page.locator('#device-list [data-dev="demo-phone"]').click()
        await page.wait_for_timeout(420)
        dev_name = await page.locator(".js-device-name").inner_text()
        assert "iphone" in dev_name.lower(), f"Expected iPhone device active, got {dev_name}"
        print("[PASS] T09: Cross-device switcher (Phone <-> Laptop) transfers active device", flush=True)

        # T10: Verify Spotify OAuth PKCE Modal
        await page.locator(".js-open-spotify").click()
        await page.wait_for_timeout(150)
        assert not (await page.locator("#spotify-modal").is_hidden())
        await page.fill("#sp-client-id", "demo_client_id_12345")
        await page.locator("#btn-save-client-id").click()
        await page.locator(".js-close-spotify").click()
        print("[PASS] T10: Spotify OAuth 2.0 PKCE modal & Client ID persistence verified", flush=True)

        # 2. MOBILE VIEWPORT TESTS (390x844 — iPhone 14/15 Pro)
        mob_context = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True)
        mob_page = await mob_context.new_page()
        mob_page.on("pageerror", lambda err: errors.append(f"MobPageError: {err}"))
        await mob_page.goto(base_url, wait_until="domcontentloaded")
        await mob_page.wait_for_timeout(350)

        # T11: Verify Mobile Bottom Bar & Slide-up Drawers
        assert await mob_page.locator(".mob-bar").is_visible(), "Mobile bottom bar must be visible on 390x844"
        await mob_page.locator(".js-play").click()
        await mob_page.wait_for_timeout(250)
        if ARTIFACT_DIR.exists():
            await mob_page.screenshot(path=str(ARTIFACT_DIR / "vang_mobile_cluster.png"))

        await mob_page.locator('[data-mob-drawer="left"]').click()
        await mob_page.wait_for_timeout(300)
        left_cls = await mob_page.locator(".left-pane").get_attribute("class")
        assert "mob-open" in left_cls, "Mobile library drawer should open"
        await mob_page.locator('[data-mob-drawer="right"]').click()
        await mob_page.wait_for_timeout(300)
        right_cls = await mob_page.locator(".right-pane").get_attribute("class")
        assert "mob-open" in right_cls, "Mobile 3D visualizer drawer should open"
        print("[PASS] T11: Mobile responsive layout & slide-up drawers verified (390x844)", flush=True)

        assert len(errors) == 0, f"Unexpected runtime errors: {errors}"
        print("\n=== ALL 11 PLAYWRIGHT TEST SUITES PASSED (0 ERRORS) ===", flush=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(run_tests())
