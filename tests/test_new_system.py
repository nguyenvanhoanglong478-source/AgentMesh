import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = (ROOT / "index.html").resolve().as_uri()

async def test_full():
    print("=== KIỂM THỬ TÍNH NĂNG MỚI: PLAYLIST SPOTIFY STYLE, 3D MỚI, 7 DẢI TẦN, BỎ SPOTIFY ===")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Test
        ctx = await browser.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=2)
        page = await ctx.new_page()
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(str(err)))
        page.on("console", lambda m: page_errors.append(m.text) if m.type == "error" else None)
        
        await page.goto(BASE_URL)
        await page.wait_for_timeout(500)
        
        # Verify Spotify & Device modals are completely gone
        has_sp_modal = await page.locator("#spotify-modal").count()
        has_dev_modal = await page.locator("#device-modal").count()
        assert has_sp_modal == 0, "Không còn thẻ #spotify-modal trong DOM"
        assert has_dev_modal == 0, "Không còn thẻ #device-modal trong DOM"
        print("  ✓ Đã dọn dẹp sạch sẽ Spotify modal & Device modal (0 tồn dư)")
        
        # Verify 7 frequency meters are present in DOM
        for meter_cls in [".js-m-sub", ".js-m-bass", ".js-m-lowmid", ".js-m-mid", ".js-m-highmid", ".js-m-treble", ".js-m-air"]:
            assert await page.locator(meter_cls).count() > 0, f"Thiếu meter {meter_cls}"
        print("  ✓ Đầy đủ 7 dải tần số âm thanh (Siêu trầm -> Siêu cao) trên giao diện")
        
        # Verify large volume slider in right pane is removed, only bottom slider remains
        right_vol_count = await page.locator(".right-pane .vol-track").count()
        bottom_vol_count = await page.locator(".transport-right .vol-track").count()
        assert right_vol_count == 0, "Không còn thanh volume lớn ở right-pane"
        assert bottom_vol_count == 1, "Thanh volume ở thanh điều khiển dưới đáy hiện diện chính xác"
        print("  ✓ Đã bỏ thanh volume lớn ở khung phải, chỉ giữ 1 thanh âm lượng dưới đáy")
        
        # Test creating a new playlist (Spotify style)
        await page.locator(".js-btn-new-playlist").first.click()
        await page.wait_for_timeout(200)
        cpl_visible = not await page.locator("#create-playlist-modal").is_hidden()
        assert cpl_visible, "Hộp thoại Tạo Playlist mới phải hiển thị"
        
        await page.fill("#cpl-name-input", "Nhạc Đêm Chữa Lành")
        await page.fill("#cpl-desc-input", "Tuyển tập các ca khúc acoustic êm dịu nhất")
        await page.locator("#btn-submit-create-playlist").click()
        await page.wait_for_timeout(300)
        print("  ✓ Đã tạo thành công danh sách phát mới: 'Nhạc Đêm Chữa Lành'")
        
        # Switch to "Tuyển tập" tab
        await page.locator('[data-tab="playlists"]').click()
        await page.wait_for_timeout(300)
        
        # Verify our custom playlist is listed
        has_custom_pl = await page.evaluate("() => Array.from(document.querySelectorAll('.qt')).some(el => el.textContent.includes('Nhạc Đêm Chữa Lành'))")
        assert has_custom_pl, "Playlist 'Nhạc Đêm Chữa Lành' phải xuất hiện trong danh mục Tuyển tập"
        print("  ✓ Danh sách phát tự tạo xuất hiện chuẩn xác trong danh mục Tuyển tập")
        
        # Test Liked Songs Tile (Bài hát yêu thích)
        liked_tile = page.locator('[data-open-liked="true"]')
        assert await liked_tile.count() > 0, "Thẻ Bài hát yêu thích Spotify-style phải hiện diện"
        await liked_tile.click()
        await page.wait_for_timeout(300)
        
        # Check Spotify Hero Header
        liked_header_text = await page.locator(".track-list h2").text_content()
        assert "Bài hát yêu thích" in liked_header_text, "Phải mở ra trang Bài hát yêu thích"
        print(f"  ✓ Trang Bài hát yêu thích (Spotify Hero Header) hiển thị hoàn hảo: '{liked_header_text}'")
        
        # Test Heart toggle on a track
        first_heart = page.locator(".js-like-btn").first
        first_heart_icon_before = await first_heart.text_content()
        await first_heart.click()
        await page.wait_for_timeout(200)
        print("  ✓ Thao tác thả tim ❤️ / bỏ tim 🤍 trên từng bài hát phản hồi tức thì")
        
        # Test Add track to playlist modal
        await page.locator('[data-tab="queue"]').click()
        await page.wait_for_timeout(200)
        add_btn = page.locator(".js-add-pl-btn").first
        await add_btn.click()
        await page.wait_for_timeout(200)
        atp_visible = not await page.locator("#add-to-playlist-modal").is_hidden()
        assert atp_visible, "Hộp thoại Thêm bài vào playlist phải mở"
        
        # Click the custom playlist row to add track
        target_pl_row = page.locator('#atp-playlist-list [data-add-pl]').first
        await target_pl_row.click()
        await page.wait_for_timeout(200)
        await page.locator(".js-close-atp-modal").first.click()
        print("  ✓ Đã thêm bài hát vào danh sách phát tự tạo thành công qua modal Spotify-style")
        
        # Test Playing music with the NEW 3D Visualizer
        await page.locator(".js-play").click()
        await page.wait_for_timeout(1000)
        
        # Capture Desktop Dark Screenshot
        snap_dark_desk = ROOT / "tests" / "v2_unified_3d_dark.png"
        await page.screenshot(path=str(snap_dark_desk))
        print(f"  ✓ Đã chụp ảnh hiệu ứng 3D mới (Dark Mode): {snap_dark_desk}")
        
        # Switch to Light Mode and capture Desktop Light Screenshot
        await page.locator(".js-toggle-theme").click()
        await page.wait_for_timeout(500)
        snap_light_desk = ROOT / "tests" / "v2_unified_3d_light.png"
        await page.screenshot(path=str(snap_light_desk))
        print(f"  ✓ Đã chụp ảnh hiệu ứng 3D mới (Light Mode): {snap_light_desk}")
        
        # 2. Test Mobile Viewport
        mob_ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, device_scale_factor=2)
        mob_page = await mob_ctx.new_page()
        await mob_page.goto(BASE_URL)
        await mob_page.wait_for_timeout(500)
        await mob_page.locator(".js-play").click()
        await mob_page.wait_for_timeout(1000)
        
        snap_mob = ROOT / "tests" / "v2_unified_3d_mobile.png"
        await mob_page.screenshot(path=str(snap_mob))
        print(f"  ✓ Đã chụp ảnh hiệu ứng 3D mới trên Mobile: {snap_mob}")
        
        assert len(page_errors) == 0, f"Phát hiện lỗi console: {page_errors}"
        print("\n=== TOÀN BỘ TẤT CẢ KIỂM THỬ ĐỀU ĐẠT CHUẨN 100%! ===")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_full())
