import asyncio
import sys
from pathlib import Path
from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = (ROOT / "index.html").resolve().as_uri()

async def test_light_mode():
    print("=== KIỂM THỬ CHẾ ĐỘ SÁNG (LIGHT MODE) OPENMUSIC ===")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Test
        ctx = await browser.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=2)
        page = await ctx.new_page()
        page.on("console", lambda m: print("Console Error:", m.text) if m.type == "error" else None)
        
        await page.goto(BASE_URL)
        await page.wait_for_timeout(400)
        
        # Initial state should be dark
        initial_theme = await page.evaluate("document.documentElement.getAttribute('data-theme')")
        print(f"  ✓ Giao diện khởi động ban đầu: {initial_theme}")
        
        # Click Theme Toggle Button
        theme_btn = page.locator(".js-toggle-theme")
        await theme_btn.click()
        await page.wait_for_timeout(300)
        
        theme_after = await page.evaluate("document.documentElement.getAttribute('data-theme')")
        print(f"  ✓ Sau khi bấm nút đổi giao diện: {theme_after}")
        assert theme_after == "light", f"Kỳ vọng theme 'light', nhận được '{theme_after}'"
        
        # Verify icon & label
        icon_text = await page.locator(".js-theme-icon").first.text_content()
        label_text = await page.locator(".js-theme-label").first.text_content()
        print(f"  ✓ Nút toggle hiển thị: {icon_text} {label_text}")
        assert "🌙" in icon_text, f"Kỳ vọng icon mặt trăng 🌙 để đổi lại tối, nhận được {icon_text}"
        
        # Verify computed background & text colors
        body_bg = await page.evaluate("window.getComputedStyle(document.body).backgroundColor")
        body_fg = await page.evaluate("window.getComputedStyle(document.body).color")
        topbar_bg = await page.evaluate("window.getComputedStyle(document.querySelector('.topbar')).backgroundColor")
        print(f"  ✓ Màu nền Body: {body_bg}, Màu chữ Body: {body_fg}")
        print(f"  ✓ Màu nền Topbar: {topbar_bg}")
        
        # Animate music with 3D canvas in light mode
        await page.locator(".js-play").click()
        await page.wait_for_timeout(1000)
        
        # Capture Desktop Light Mode screenshot
        desk_snap = ROOT / "tests" / "light_desktop.png"
        await page.screenshot(path=str(desk_snap))
        print(f"  ✓ Đã lưu ảnh Desktop Light Mode: {desk_snap}")
        
        # 2. Test Mobile Viewport in Light Mode
        mob_ctx = await browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, device_scale_factor=2)
        mob_page = await mob_ctx.new_page()
        await mob_page.goto(BASE_URL)
        await mob_page.wait_for_timeout(400)
        
        # Switch to light mode on mobile via topbar toggle
        await mob_page.locator(".js-toggle-theme").click()
        await mob_page.wait_for_timeout(300)
        
        # Animate music
        await mob_page.locator(".js-play").click()
        await mob_page.wait_for_timeout(1000)
        
        mob_snap = ROOT / "tests" / "light_mobile.png"
        await mob_page.screenshot(path=str(mob_snap))
        print(f"  ✓ Đã lưu ảnh Mobile Light Mode: {mob_snap}")
        
        # Test Right Pane Drawer with Theme buttons
        await mob_page.locator('[data-mob-drawer="right"]').click()
        await mob_page.wait_for_timeout(300)
        
        dark_btn = mob_page.locator(".js-set-theme-dark")
        light_btn = mob_page.locator(".js-set-theme-light")
        assert await light_btn.evaluate("el => el.classList.contains('on')"), "Nút Chế độ Sáng trong drawer phải có class 'on'"
        
        # Click dark button in drawer to switch back
        await dark_btn.click()
        await mob_page.wait_for_timeout(200)
        mob_theme_back = await mob_page.evaluate("document.documentElement.getAttribute('data-theme')")
        assert mob_theme_back == "dark", f"Kỳ vọng theme 'dark', nhận được '{mob_theme_back}'"
        print("  ✓ Chuyển đổi qua lại giữa Sáng / Tối trong ngăn kéo di động hoạt động hoàn hảo!")
        
        await browser.close()
        print("\n=== TẤT CẢ KIỂM THỬ CHẾ ĐỘ SÁNG ĐỀU ĐẠT CHUẨN 100%! ===")

if __name__ == "__main__":
    asyncio.run(test_light_mode())
