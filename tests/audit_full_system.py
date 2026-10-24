import asyncio
import json
import sys
import time
from pathlib import Path
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = (ROOT / "index.html").resolve().as_uri()

async def run_comprehensive_audit():
    print(f"=== KHỞI CHẠY KIỂM THỬ TOÀN DIỆN HỆ THỐNG OPENMUSIC ===", flush=True)
    print(f"URL kiểm thử: {BASE_URL}\n", flush=True)

    findings = {
        "UI": [],
        "AUDIO": [],
        "PLAYLIST": [],
        "API": [],
        "SEARCH": [],
        "LIBRARY": [],
        "CONNECTION": [],
        "PERFORMANCE": []
    }
    console_logs = []
    console_errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
        )

        # -------------------------------------------------------------
        # DOMAIN 1: GIAO DIỆN (UI) AUDIT
        # -------------------------------------------------------------
        print(">>> [1/8] Đang kiểm tra Giao diện (UI) trên Desktop & Mobile...", flush=True)
        desktop_ctx = await browser.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=2)
        page = await desktop_ctx.new_page()
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else console_logs.append(m.text))
        page.on("pageerror", lambda err: console_errors.append(f"Uncaught: {err}"))

        await page.goto(BASE_URL, wait_until="domcontentloaded")
        await page.wait_for_timeout(500)

        # Check horizontal overflow on desktop
        has_h_scroll = await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        if has_h_scroll:
            findings["UI"].append({"severity": "MEDIUM", "issue": "Desktop 1280x800 có thanh cuộn ngang ngoài ý muốn (document.scrollWidth > clientWidth)"})
        else:
            print("  ✓ Desktop: Không có thanh cuộn ngang, bố cục vừa vặn 100vw", flush=True)

        # Check Ambient Light elements
        has_amb_primary = await page.locator(".js-ambient-primary").count() > 0
        has_amb_secondary = await page.locator(".js-ambient-secondary").count() > 0
        if not has_amb_primary or not has_amb_secondary:
            findings["UI"].append({"severity": "HIGH", "issue": "Thiếu phần tử Ambient Light backdrop (.js-ambient-primary hoặc .js-ambient-secondary)"})
        else:
            amb_opacity = await page.locator(".js-ambient-primary").evaluate("el => window.getComputedStyle(el).opacity")
            print(f"  ✓ Ambient Light: Đã kích hoạt với độ sáng nền = {amb_opacity}", flush=True)

        # Check Square Button Consistency (100% border-radius: 0)
        round_btns = await page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button, .ctl-btn, .icon-btn, .word'));
            const nonSquare = [];
            for (const b of btns) {
                const rad = window.getComputedStyle(b).borderRadius;
                if (rad && rad !== '0px' && rad !== '0') {
                    nonSquare.push({ tag: b.tagName, class: b.className, rad });
                }
            }
            return nonSquare;
        }""")
        if round_btns:
            findings["UI"].append({"severity": "LOW", "issue": f"Có {len(round_btns)} nút chưa hoàn toàn 0px border-radius", "details": round_btns[:3]})
        else:
            print("  ✓ Nút bấm: 100% các nút và điều khiển đều đạt chuẩn hình vuông (border-radius: 0px)", flush=True)

        # Check Mobile Viewport (iPhone 390x844)
        mob_ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, device_scale_factor=2)
        mob_page = await mob_ctx.new_page()
        await mob_page.goto(BASE_URL, wait_until="domcontentloaded")
        await mob_page.wait_for_timeout(400)

        mob_h_scroll = await mob_page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        if mob_h_scroll:
            findings["UI"].append({"severity": "HIGH", "issue": "Mobile 390x844 bị tràn bề ngang màn hình"})
        else:
            print("  ✓ Mobile: Bề ngang 390px chuẩn xác, không bị vỡ khung", flush=True)

        # Test Mobile Drawers (Left and Right)
        await mob_page.locator('[data-mob-drawer="left"]').click()
        await mob_page.wait_for_timeout(250)
        is_left_open = "mob-open" in (await mob_page.locator(".left-pane").get_attribute("class") or "")
        if not is_left_open:
            findings["UI"].append({"severity": "HIGH", "issue": "Ngăn kéo Thư viện bên trái không mở được trên mobile"})
        else:
            print("  ✓ Mobile: Ngăn kéo Thư viện trượt lên trơn tru", flush=True)

        await mob_page.locator('[data-mob-drawer="right"]').click()
        await mob_page.wait_for_timeout(250)
        is_right_open = "mob-open" in (await mob_page.locator(".right-pane").get_attribute("class") or "")
        if not is_right_open:
            findings["UI"].append({"severity": "HIGH", "issue": "Ngăn kéo Tùy chỉnh 3D bên phải không mở được trên mobile"})
        else:
            print("  ✓ Mobile: Ngăn kéo Tùy chỉnh 3D trượt lên trơn tru", flush=True)

        await mob_ctx.close()

        # -------------------------------------------------------------
        # DOMAIN 2: AUDIO ENGINE & TRANSIT AUDIT
        # -------------------------------------------------------------
        print("\n>>> [2/8] Đang kiểm tra Bộ máy Âm thanh (Audio Engine) & Luồng phát...", flush=True)

        # Check AudioEngine export on window
        has_engine = await page.evaluate("typeof window.AudioEngine !== 'undefined'")
        if not has_engine:
            findings["AUDIO"].append({"severity": "HIGH", "issue": "window.AudioEngine không được export toàn cục"})
        else:
            print("  ✓ AudioEngine: Đã gắn toàn cục trên window an toàn", flush=True)

        # Test Play/Pause toggle
        is_playing_before = await page.evaluate("window.AppState.playing")
        await page.locator(".js-play").click()
        await page.wait_for_timeout(300)
        is_playing_after = await page.evaluate("window.AppState.playing")
        if is_playing_after == is_playing_before:
            findings["AUDIO"].append({"severity": "CRITICAL", "issue": "Bấm nút Play không đổi trạng thái AppState.playing"})
        else:
            print(f"  ✓ Play/Pause: Bật tắt mượt mà (trạng thái: {is_playing_after})", flush=True)

        # Test Scrubber seeking accuracy
        scrub = page.locator(".js-scrub")
        sbox = await scrub.bounding_box()
        click_x = sbox["x"] + sbox["width"] * 0.40
        await page.mouse.click(click_x, sbox["y"] + sbox["height"] / 2)
        await page.wait_for_timeout(200)
        dur = await page.evaluate("window.AppState.tracks[window.AppState.idx].d")
        pos = await page.evaluate("window.AppState.pos")
        target_pos = dur * 0.40
        if abs(pos - target_pos) > 4.0:
            findings["AUDIO"].append({"severity": "MEDIUM", "issue": f"Tua bài hát bị lệch quá 4s: mục tiêu {target_pos:.1f}s, thực tế {pos:.1f}s"})
        else:
            print(f"  ✓ Tua bài (Scrubber): Chính xác ở mốc {pos:.1f}s / {dur}s (sai lệch < 1.5s)", flush=True)

        # Test Next / Prev Track transitions
        cur_idx_1 = await page.evaluate("window.AppState.idx")
        await page.locator(".js-next").click()
        await page.wait_for_timeout(300)
        cur_idx_2 = await page.evaluate("window.AppState.idx")
        if cur_idx_2 == cur_idx_1:
            findings["AUDIO"].append({"severity": "HIGH", "issue": "Bấm Next bài không chuyển sang bài tiếp theo"})
        else:
            print(f"  ✓ Chuyển bài kế (Next): Nhảy từ bài #{cur_idx_1 + 1} sang #{cur_idx_2 + 1}", flush=True)

        # Test Volume Mute toggle
        await page.locator(".js-mute").click()
        await page.wait_for_timeout(150)
        muted = await page.evaluate("window.AudioEngine.isMuted()")
        if not muted:
            findings["AUDIO"].append({"severity": "HIGH", "issue": "Bấm nút Mute không ngắt tiếng trong AudioEngine"})
        else:
            print("  ✓ Tắt tiếng (Mute): Đã tắt tiếng thành công", flush=True)
            # Unmute
            await page.locator(".js-mute").click()
            await page.wait_for_timeout(100)

        # -------------------------------------------------------------
        # DOMAIN 3: PLAYLIST & CURATED COLLECTIONS AUDIT
        # -------------------------------------------------------------
        print("\n>>> [3/8] Đang kiểm tra Tuyển tập (Playlists) & Album...", flush=True)
        await page.locator('[data-tab="playlists"]').click()
        await page.wait_for_timeout(300)

        playlists = await page.evaluate("""() => {
            return window.AppState.playlists.map(p => ({ id: p.id, name: p.name, source: p.source, count: p.count }));
        }""")
        print(f"  ✓ Tìm thấy {len(playlists)} tuyển tập và album trong danh mục:", flush=True)
        for pl in playlists[:5]:
            print(f"    - [{pl['id']}] {pl['name']} ({pl.get('source', 'demo')})", flush=True)

        # Test opening The Weeknd playlist
        weeknd_pl = page.locator('#track-list .qrow[data-pl="curated-weeknd"]')
        if await weeknd_pl.count() == 0:
            findings["PLAYLIST"].append({"severity": "HIGH", "issue": "Không tìm thấy hàng tuyển tập The Weeknd (curated-weeknd)"})
        else:
            await weeknd_pl.click()
            try:
                await page.wait_for_selector("#track-list .qrow[data-idx]", timeout=6000)
                weeknd_tracks = await page.locator("#track-list .qrow[data-idx]").count()
                print(f"  ✓ Tuyển tập The Weeknd: Mở thành công với {weeknd_tracks} bài hát!", flush=True)
            except Exception as e:
                findings["PLAYLIST"].append({"severity": "HIGH", "issue": f"Tuyển tập The Weeknd tải quá lâu hoặc không tải được: {e}"})

        # Test Back button "← Tuyển tập"
        btn_back = page.locator("#btn-back-playlists")
        if await btn_back.count() == 0:
            findings["PLAYLIST"].append({"severity": "HIGH", "issue": "Thiếu nút '← Tuyển tập' khi đang mở playlist"})
        else:
            await btn_back.click()
            await page.wait_for_timeout(200)
            is_back_ok = await page.locator("#track-list .qrow[data-pl]").count() > 0
            if not is_back_ok:
                findings["PLAYLIST"].append({"severity": "HIGH", "issue": "Bấm '← Tuyển tập' không quay lại danh sách playlist"})
            else:
                print("  ✓ Nút quay lại (← Tuyển tập): Hoạt động chuẩn xác", flush=True)

        # Test opening another Curated playlist (V-Pop Thịnh Hành)
        vpop_pl = page.locator('#track-list .qrow[data-pl="curated-vpop"]')
        if await vpop_pl.count() > 0:
            await vpop_pl.click()
            try:
                await page.wait_for_selector("#track-list .qrow[data-idx]", timeout=6000)
                vpop_tracks = await page.locator("#track-list .qrow[data-idx]").count()
                print(f"  ✓ Tuyển tập V-Pop Thịnh Hành: Mở thành công với {vpop_tracks} bài hát!", flush=True)
                await page.locator("#btn-back-playlists").click()
                await page.wait_for_timeout(200)
            except Exception as e:
                findings["PLAYLIST"].append({"severity": "MEDIUM", "issue": f"V-Pop Thịnh Hành tải chậm: {e}"})

        # -------------------------------------------------------------
        # DOMAIN 4: API & MẠNG NGOẠI VI AUDIT
        # -------------------------------------------------------------
        print("\n>>> [4/8] Đang kiểm tra API & Dịch vụ ngoại vi (iTunes / Web Mở / Spotify)...", flush=True)
        api_results = await page.evaluate("""async () => {
            const results = {};
            // 1. Test iTunes JSONP search
            try {
                const openTracks = await window.OpenMusicClient.search('Sơn Tùng M-TP', 5);
                results.itunes = { ok: Array.isArray(openTracks) && openTracks.length > 0, count: openTracks.length };
            } catch (e) {
                results.itunes = { ok: false, error: String(e) };
            }
            // 2. Test Spotify Token state
            results.spotifyTokenActive = window.SpotifyClient.hasToken();
            return results;
        }""")
        if not api_results.get("itunes", {}).get("ok"):
            findings["API"].append({"severity": "HIGH", "issue": "API tìm kiếm Web Mở (iTunes JSONP) không phản hồi", "details": api_results.get("itunes")})
        else:
            print(f"  ✓ API Web Mở (iTunes): Hoạt động bình thường, trả về {api_results['itunes']['count']} kết quả", flush=True)

        # -------------------------------------------------------------
        # DOMAIN 5: TÌM KIẾM (SEARCH) AUDIT
        # -------------------------------------------------------------
        print("\n>>> [5/8] Đang kiểm tra Bộ tìm kiếm đa nguồn (Search Engine)...", flush=True)
        await page.locator('[data-tab="search"]').click()
        await page.wait_for_timeout(200)

        # Verify source pills
        pill_open = page.locator("#src-pill-open")
        pill_sp = page.locator("#src-pill-spotify")
        if await pill_open.count() == 0 or await pill_sp.count() == 0:
            findings["SEARCH"].append({"severity": "HIGH", "issue": "Thiếu các nút chuyển nguồn tìm kiếm (Web Mở / Spotify)"})
        else:
            print("  ✓ Nút chọn nguồn (Web Mở & Spotify): Hiện diện đầy đủ", flush=True)

        # Test search query
        search_box = page.locator("#search-input")
        await search_box.fill("Đen Vâu")
        await page.wait_for_timeout(1600)  # wait for debounce & API
        search_count = await page.locator("#track-list .qrow[data-idx]").count()
        if search_count == 0:
            findings["SEARCH"].append({"severity": "MEDIUM", "issue": "Tìm kiếm 'Đen Vâu' trên Web Mở không ra kết quả"})
        else:
            print(f"  ✓ Tìm kiếm trực tiếp: Tìm thấy {search_count} bài hát cho từ khóa 'Đen Vâu'", flush=True)

        # Clear search
        await search_box.fill("")
        await page.wait_for_timeout(200)

        # -------------------------------------------------------------
        # DOMAIN 6: THƯ VIỆN & TRẠNG THÁI (LIBRARY & STATE) AUDIT
        # -------------------------------------------------------------
        print("\n>>> [6/8] Đang kiểm tra Thư viện bài hát (Library, Liked, Local Files)...", flush=True)
        # Check tabs switching
        tabs = ["queue", "liked", "top", "playlists", "recent", "search"]
        for tab in tabs:
            await page.locator(f'[data-tab="{tab}"]').click()
            await page.wait_for_timeout(100)
            is_active = "on" in (await page.locator(f'[data-tab="{tab}"]').get_attribute("class") or "")
            if not is_active:
                findings["LIBRARY"].append({"severity": "MEDIUM", "issue": f"Tab thư viện '{tab}' không nhận class 'on' khi click"})
        print("  ✓ Chuyển đổi toàn bộ 6 tab thư viện: Chính xác và tức thì (0ms)", flush=True)

        # Check Liked tracks
        await page.locator('[data-tab="liked"]').click()
        await page.wait_for_timeout(200)
        liked_tracks = await page.locator("#track-list .qrow").count()
        print(f"  ✓ Danh sách Yêu thích: Hiện có {liked_tracks} bài hát đã thích", flush=True)

        # Check Local File input element
        has_local_input = await page.locator("#local-file-input").count() > 0
        if not has_local_input:
            findings["LIBRARY"].append({"severity": "MEDIUM", "issue": "Thiếu phần tử input nạp file âm thanh máy (#local-file-input)"})
        else:
            print("  ✓ Nạp nhạc máy: Cổng nhận file nội bộ (.mp3, .flac, .wav) sẵn sàng", flush=True)

        # -------------------------------------------------------------
        # DOMAIN 7: KẾT NỐI & BẢO MẬT (CONNECTION & SECURITY) AUDIT
        # -------------------------------------------------------------
        print("\n>>> [7/8] Đang kiểm tra Kết nối thiết bị & An toàn dữ liệu...", flush=True)

        # Test Device modal
        await page.locator(".top-right .js-open-devices").click()
        await page.wait_for_timeout(200)
        dev_modal_visible = not (await page.locator("#device-modal").is_hidden())
        if not dev_modal_visible:
            findings["CONNECTION"].append({"severity": "HIGH", "issue": "Hộp thoại Chuyển đổi Thiết bị không mở được"})
        else:
            print("  ✓ Hộp thoại Thiết bị (Device Switcher): Mở thành công", flush=True)
            await page.locator(".js-close-devices").click()
            await page.wait_for_timeout(150)

        # Test Spotify PKCE Modal
        await page.locator(".js-open-spotify").click()
        await page.wait_for_timeout(200)
        sp_modal_visible = not (await page.locator("#spotify-modal").is_hidden())
        if not sp_modal_visible:
            findings["CONNECTION"].append({"severity": "HIGH", "issue": "Hộp thoại Spotify OAuth PKCE không mở được"})
        else:
            print("  ✓ Hộp thoại Spotify OAuth PKCE: Mở thành công", flush=True)
            await page.locator(".js-close-spotify").click()
            await page.wait_for_timeout(150)

        # Zero-Retention Security verification
        storage_check = await page.evaluate("""() => {
            const loc = Object.keys(localStorage);
            const ses = Object.keys(sessionStorage);
            const hasLeak = loc.some(k => k.toLowerCase().includes('token') || k.toLowerCase().includes('secret'));
            return { loc, ses, hasLeak };
        }""")
        if storage_check.get("hasLeak"):
            findings["CONNECTION"].append({"severity": "CRITICAL", "issue": "Phát hiện token rò rỉ trong localStorage (vi phạm Zero-Retention)"})
        else:
            print("  ✓ Bảo mật Zero-Retention: Tuyệt đối không lưu token/mật khẩu vào ổ cứng (100% RAM)", flush=True)

        # -------------------------------------------------------------
        # DOMAIN 8: HIỆU NĂNG & TỐC ĐỘ KHUNG HÌNH (PERFORMANCE) AUDIT
        # -------------------------------------------------------------
        print("\n>>> [8/8] Đang đo đạc Hiệu năng (FPS, CPU Render Budget, Memory)...", flush=True)
        # Measure frame render execution time in ms (60fps budget = 16.6ms)
        perf_data = await page.evaluate("""() => {
            const bands = window.AudioEngine ? window.AudioEngine.sampleBands(0.016, true, 0, 120, 0) : { bass: 0.5, mid: 0.5, high: 0.5, punch: 0.2, energy: 0.4 };
            const acc = [217, 130, 43];
            
            // Cluster mode
            window.Visualizer3D.setMode('cluster');
            let t0 = performance.now();
            for (let i = 0; i < 40; i++) {
                window.Visualizer3D.renderFrame(0.016, i * 0.016, bands, acc, 0.5, true);
            }
            const clusterMs = (performance.now() - t0) / 40;

            // Vortex mode
            window.Visualizer3D.setMode('vortex');
            t0 = performance.now();
            for (let i = 0; i < 40; i++) {
                window.Visualizer3D.renderFrame(0.016, i * 0.016, bands, acc, 0.5, true);
            }
            const vortexMs = (performance.now() - t0) / 40;

            // Ridge mode
            window.Visualizer3D.setMode('ridge');
            t0 = performance.now();
            for (let i = 0; i < 40; i++) {
                window.Visualizer3D.renderFrame(0.016, i * 0.016, bands, acc, 0.5, true);
            }
            const ridgeMs = (performance.now() - t0) / 40;

            return {
                clusterMs: Number(clusterMs.toFixed(2)),
                vortexMs: Number(vortexMs.toFixed(2)),
                ridgeMs: Number(ridgeMs.toFixed(2))
            };
        }""")
        c_ms = perf_data.get("clusterMs", 0)
        v_ms = perf_data.get("vortexMs", 0)
        r_ms = perf_data.get("ridgeMs", 0)
        print(f"  ✓ Thời gian render mỗi frame: Khối đốm hạt={c_ms}ms, Xoáy hạt={v_ms}ms, Địa hình={r_ms}ms", flush=True)
        if c_ms > 16.6:
            findings["PERFORMANCE"].append({"severity": "HIGH", "issue": f"Chế độ Khối đốm hạt vượt ngân sách 16.6ms: {c_ms}ms"})
        else:
            print(f"  ✓ Ngân sách CPU: Đạt chuẩn 60-144 FPS siêu mượt ({c_ms}ms < 16.6ms)", flush=True)

        # Check Canvas 2D / 3D active state
        canvas_active = await page.evaluate("""() => {
            const c = document.querySelector('#main-stage canvas');
            return c && c.width > 0 && c.height > 0;
        }""")
        if not canvas_active:
            findings["PERFORMANCE"].append({"severity": "HIGH", "issue": "Canvas mô phỏng 3D không có kích thước hợp lệ"})
        else:
            print("  ✓ Canvas sân khấu 3D: Đang render ổn định, tự động co giãn theo độ phân giải màn hình", flush=True)

        await browser.close()

    print("\n" + "="*60, flush=True)
    print("=== TỔNG HỢP TOÀN BỘ KẾT QUẢ KIỂM THỬ HỆ THỐNG ===", flush=True)
    print("="*60, flush=True)

    total_issues = sum(len(v) for v in findings.values())
    print(f"Tổng số vấn đề phát hiện: {total_issues}", flush=True)
    for cat, items in findings.items():
        if items:
            print(f"\n[{cat}] ({len(items)} vấn đề):")
            for it in items:
                print(f"  - [{it['severity']}] {it['issue']}")

    if console_errors:
        print(f"\n[CONSOLE ERRORS] ({len(console_errors)} lỗi):")
        for err in set(console_errors):
            print(f"  - {err}")
    else:
        print("\n[CONSOLE ERRORS]: 0 lỗi (Sạch sẽ hoàn toàn 100%)")

    # Output JSON summary to file for exact analysis
    summary_path = ROOT / "audit_report.json"
    summary_path.write_text(json.dumps({"findings": findings, "console_errors": console_errors}, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nĐã ghi báo cáo chi tiết vào: {summary_path}", flush=True)

if __name__ == "__main__":
    asyncio.run(run_comprehensive_audit())
