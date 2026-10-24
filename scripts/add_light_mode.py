import sys
from pathlib import Path

ROOT = Path(r"C:\Users\nguye\.gemini\antigravity\scratch\vang-player")

def apply_light_mode():
    index_path = ROOT / "index.html"
    index_text = index_path.read_text(encoding="utf-8")
    nl = "\r\n" if "\r\n" in index_text else "\n"
    
    # 1. Update CSS :root and add html[data-theme="light"]
    old_root = (
        ':root {' + nl +
        '  --ink: #0E0D0B;' + nl +
        '  --ink-elev: #161411;' + nl +
        '  --paper: #ECE5D8;' + nl +
        '  --dim: #8C857A;' + nl +
        '  --muted: #4E4942;' + nl +
        '  --line: rgba(236, 229, 216, 0.13);' + nl +
        '  --line-strong: rgba(236, 229, 216, 0.26);' + nl +
        '  --acc: #D9822B;' + nl +
        '  --acc-rgb: 217, 130, 43;' + nl +
        '  --f-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' + nl +
        '  --f-mono: ui-monospace, "SF Mono", "IBM Plex Mono", Menlo, Consolas, monospace;' + nl +
        '}'
    )
    
    new_root = (
        ':root {' + nl +
        '  --ink: #0E0D0B;' + nl +
        '  --ink-elev: #161411;' + nl +
        '  --paper: #ECE5D8;' + nl +
        '  --dim: #8C857A;' + nl +
        '  --muted: #4E4942;' + nl +
        '  --line: rgba(236, 229, 216, 0.13);' + nl +
        '  --line-strong: rgba(236, 229, 216, 0.26);' + nl +
        '  --btn-bg: rgba(236, 229, 216, 0.03);' + nl +
        '  --btn-bg-hover: rgba(236, 229, 216, 0.08);' + nl +
        '  --glass-bg: rgba(14, 13, 11, 0.86);' + nl +
        '  --glass-bg-trans: rgba(14, 13, 11, 0.90);' + nl +
        '  --modal-overlay: rgba(8, 7, 6, 0.80);' + nl +
        '  --stage-vignette-start: rgba(14, 13, 11, 0.18);' + nl +
        '  --stage-vignette-mid: rgba(14, 13, 11, 0.58);' + nl +
        '  --stage-vignette-end: rgba(14, 13, 11, 0.88);' + nl +
        '  --ambient-primary-op: 0.88;' + nl +
        '  --ambient-sec-op: 0.72;' + nl +
        '  --card-shadow: 0 24px 64px rgba(0, 0, 0, 0.75);' + nl +
        '  --acc: #D9822B;' + nl +
        '  --acc-rgb: 217, 130, 43;' + nl +
        '  --f-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' + nl +
        '  --f-mono: ui-monospace, "SF Mono", "IBM Plex Mono", Menlo, Consolas, monospace;' + nl +
        '}' + nl + nl +
        'html[data-theme="light"] {' + nl +
        '  --ink: #F7F5F0;' + nl +
        '  --ink-elev: #FFFFFF;' + nl +
        '  --paper: #161412;' + nl +
        '  --dim: #645E55;' + nl +
        '  --muted: #9E9689;' + nl +
        '  --line: rgba(22, 20, 18, 0.10);' + nl +
        '  --line-strong: rgba(22, 20, 18, 0.22);' + nl +
        '  --btn-bg: rgba(22, 20, 18, 0.04);' + nl +
        '  --btn-bg-hover: rgba(22, 20, 18, 0.08);' + nl +
        '  --glass-bg: rgba(247, 245, 240, 0.88);' + nl +
        '  --glass-bg-trans: rgba(247, 245, 240, 0.92);' + nl +
        '  --modal-overlay: rgba(22, 20, 18, 0.45);' + nl +
        '  --stage-vignette-start: rgba(247, 245, 240, 0.15);' + nl +
        '  --stage-vignette-mid: rgba(247, 245, 240, 0.45);' + nl +
        '  --stage-vignette-end: rgba(247, 245, 240, 0.85);' + nl +
        '  --ambient-primary-op: 0.35;' + nl +
        '  --ambient-sec-op: 0.22;' + nl +
        '  --card-shadow: 0 20px 48px rgba(30, 26, 22, 0.12);' + nl +
        '}'
    )
    if old_root in index_text:
        index_text = index_text.replace(old_root, new_root)
        print("Replaced :root in index.html")
    else:
        print("Warning: old_root not found in index.html")

    # 2. Update CSS background references in index.html
    replacements = [
        ('background: rgba(14, 13, 11, 0.86);', 'background: var(--glass-bg, rgba(14, 13, 11, 0.86));'),
        ('background: rgba(14, 13, 11, 0.90);', 'background: var(--glass-bg-trans, rgba(14, 13, 11, 0.90));'),
        ('background: rgba(8, 7, 6, 0.80);', 'background: var(--modal-overlay, rgba(8, 7, 6, 0.80));'),
        ('background: rgba(236, 229, 216, 0.03);', 'background: var(--btn-bg, rgba(236, 229, 216, 0.03));'),
        ('background: rgba(236, 229, 216, 0.02);', 'background: var(--btn-bg, rgba(236, 229, 216, 0.02));'),
        (
            '  background:' + nl +
            '    radial-gradient(circle at 50% 44%, transparent 38%, rgba(14, 13, 11, 0.58) 100%),' + nl +
            '    linear-gradient(180deg, rgba(14, 13, 11, 0.18) 0%, transparent 22%, transparent 62%, rgba(14, 13, 11, 0.88) 100%);',
            '  background:' + nl +
            '    radial-gradient(circle at 50% 44%, transparent 38%, var(--stage-vignette-mid, rgba(14, 13, 11, 0.58)) 100%),' + nl +
            '    linear-gradient(180deg, var(--stage-vignette-start, rgba(14, 13, 11, 0.18)) 0%, transparent 22%, transparent 62%, var(--stage-vignette-end, rgba(14, 13, 11, 0.88)) 100%);'
        )
    ]
    for old_s, new_s in replacements:
        if old_s in index_text:
            index_text = index_text.replace(old_s, new_s)
            print(f"Replaced: {old_s[:40]}...")

    # 3. Add Theme Toggle button in topbar header
    old_top_right = (
        '      <div class="top-right">' + nl +
        '        <button class="word mono js-open-devices" type="button">Thiết bị</button>' + nl +
        '        <button class="word mono on js-open-spotify" type="button">Spotify</button>' + nl +
        '      </div>'
    )
    new_top_right = (
        '      <div class="top-right">' + nl +
        '        <button class="word mono js-toggle-theme" type="button" title="Chuyển chế độ Sáng / Tối" aria-label="Đổi giao diện">' + nl +
        '          <span class="js-theme-icon">☀️</span> <span class="js-theme-label">Sáng</span>' + nl +
        '        </button>' + nl +
        '        <button class="word mono js-open-devices" type="button">Thiết bị</button>' + nl +
        '        <button class="word mono on js-open-spotify" type="button">Spotify</button>' + nl +
        '      </div>'
    )
    if old_top_right in index_text:
        index_text = index_text.replace(old_top_right, new_top_right)
        print("Added js-toggle-theme button to topbar")
    else:
        print("Warning: old_top_right not found")

    # 4. Add Theme Control Block in Right Pane
    old_timer_sec = (
        '      <!-- 5. Sleep Timer -->' + nl +
        '      <div class="sec-block">'
    )
    new_timer_sec = (
        '      <!-- 5. Theme Appearance Mode -->' + nl +
        '      <div class="sec-block">' + nl +
        '        <div class="sec-hdr">' + nl +
        '          <span class="mono sec-label">Giao diện</span>' + nl +
        '          <span class="mono acc js-theme-status" style="font-size:10.5px">Chế độ Tối</span>' + nl +
        '        </div>' + nl +
        '        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + nl +
        '          <button class="word mono js-set-theme-dark on" type="button" data-t="dark">🌙 Chế độ Tối</button>' + nl +
        '          <button class="word mono js-set-theme-light" type="button" data-t="light">☀️ Chế độ Sáng</button>' + nl +
        '        </div>' + nl +
        '      </div>' + nl + nl +
        '      <!-- 6. Sleep Timer -->' + nl +
        '      <div class="sec-block">'
    )
    if old_timer_sec in index_text:
        index_text = index_text.replace(old_timer_sec, new_timer_sec)
        print("Added theme selector in right pane")
    else:
        print("Warning: old_timer_sec not found")

    # 5. Update Visualizer3D in index.html to support light mode
    # In drawCluster:
    old_cluster_clear = (
        '    // Clear with deep warm ink + audio-reactive ambient core glow' + nl +
        '    ctx.fillStyle = "#0E0D0B";' + nl +
        '    ctx.fillRect(0, 0, w, h);' + nl +
        nl +
        '    const glowR = scale * (1.25 + bands.bass * 0.65 + punch * 0.55);' + nl +
        '    const grad = ctx.createRadialGradient(cx, cy, scale * 0.04, cx, cy, glowR);' + nl +
        '    const glowAlpha = Math.min(0.42, 0.08 + bands.energy * 0.22 + punch * 0.22);' + nl +
        '    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);' + nl +
        '    grad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${glowAlpha.toFixed(3)})`);' + nl +
        '    grad.addColorStop(0.55, `rgba(${ar}, ${ag}, ${ab}, ${(glowAlpha * 0.22).toFixed(3)})`);' + nl +
        '    grad.addColorStop(1, "rgba(14, 13, 11, 0)");' + nl +
        '    ctx.fillStyle = grad;' + nl +
        '    ctx.fillRect(0, 0, w, h);'
    )
    new_cluster_clear = (
        '    const isLight = document.documentElement.getAttribute("data-theme") === "light";' + nl +
        '    // Clear with deep warm ink / porcelain paper + audio-reactive ambient core glow' + nl +
        '    ctx.fillStyle = isLight ? "#F7F5F0" : "#0E0D0B";' + nl +
        '    ctx.fillRect(0, 0, w, h);' + nl +
        nl +
        '    const glowR = scale * (1.25 + bands.bass * 0.65 + punch * 0.55);' + nl +
        '    const grad = ctx.createRadialGradient(cx, cy, scale * 0.04, cx, cy, glowR);' + nl +
        '    const glowAlpha = Math.min(isLight ? 0.26 : 0.42, (isLight ? 0.05 : 0.08) + bands.energy * 0.22 + punch * 0.22);' + nl +
        '    const ar = Math.round(acc[0]), ag = Math.round(acc[1]), ab = Math.round(acc[2]);' + nl +
        '    grad.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, ${glowAlpha.toFixed(3)})`);' + nl +
        '    grad.addColorStop(0.55, `rgba(${ar}, ${ag}, ${ab}, ${(glowAlpha * 0.22).toFixed(3)})`);' + nl +
        '    grad.addColorStop(1, isLight ? "rgba(247, 245, 240, 0)" : "rgba(14, 13, 11, 0)");' + nl +
        '    ctx.fillStyle = grad;' + nl +
        '    ctx.fillRect(0, 0, w, h);'
    )
    if old_cluster_clear in index_text:
        index_text = index_text.replace(old_cluster_clear, new_cluster_clear)
        print("Updated drawCluster clear logic for Light Mode")
    else:
        print("Warning: old_cluster_clear not found")

    old_cluster_styles = (
        '    // 9 Pre-computed draw styles: Back-to-front order (0 to 7) + Halo (8)' + nl +
        '    const baseR = 236, baseG = 229, baseB = 216;' + nl +
        '    const styles = [' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.22)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.28)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.46)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.54)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.72)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.80)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.92)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.98)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, ${(0.16 + punch * 0.22).toFixed(3)})`' + nl +
        '    ];'
    )
    new_cluster_styles = (
        '    // 9 Pre-computed draw styles: Back-to-front order (0 to 7) + Halo (8)' + nl +
        '    const baseR = isLight ? 34 : 236;' + nl +
        '    const baseG = isLight ? 30 : 229;' + nl +
        '    const baseB = isLight ? 26 : 216;' + nl +
        '    const styles = isLight ? [' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.26)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.36)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.50)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.60)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.74)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.82)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.94)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.98)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, ${(0.22 + punch * 0.26).toFixed(3)})`' + nl +
        '    ] : [' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.22)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.28)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.46)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.54)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.72)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.80)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.92)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.98)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, ${(0.16 + punch * 0.22).toFixed(3)})`' + nl +
        '    ];'
    )
    if old_cluster_styles in index_text:
        index_text = index_text.replace(old_cluster_styles, new_cluster_styles)
        print("Updated drawCluster styles for Light Mode")
    else:
        print("Warning: old_cluster_styles not found")

    # In drawRidge:
    old_ridge_clear = (
        '    ctx.fillStyle = "#0E0D0B";' + nl +
        '    ctx.fillRect(0, 0, w, h);'
    )
    new_ridge_clear = (
        '    const isLight = document.documentElement.getAttribute("data-theme") === "light";' + nl +
        '    ctx.fillStyle = isLight ? "#F7F5F0" : "#0E0D0B";' + nl +
        '    ctx.fillRect(0, 0, w, h);'
    )
    if old_ridge_clear in index_text:
        index_text = index_text.replace(old_ridge_clear, new_ridge_clear)
        print("Updated drawRidge clear for Light Mode")
        
    old_ridge_fill = (
        '      ctx.fillStyle = "#0E0D0B";' + nl +
        '      ctx.fill();'
    )
    new_ridge_fill = (
        '      ctx.fillStyle = isLight ? "#F7F5F0" : "#0E0D0B";' + nl +
        '      ctx.fill();'
    )
    if old_ridge_fill in index_text:
        index_text = index_text.replace(old_ridge_fill, new_ridge_fill)
        print("Updated drawRidge mountain fill for Light Mode")

    old_ridge_stroke = (
        '        ctx.strokeStyle = `rgba(236, 229, 216, ${(0.15 + 0.62 * depthFactor).toFixed(3)})`;'
    )
    new_ridge_stroke = (
        '        const lineAlpha = (isLight ? (0.22 + 0.65 * depthFactor) : (0.15 + 0.62 * depthFactor)).toFixed(3);' + nl +
        '        ctx.strokeStyle = isLight ? `rgba(34, 30, 26, ${lineAlpha})` : `rgba(236, 229, 216, ${lineAlpha})`;'
    )
    if old_ridge_stroke in index_text:
        index_text = index_text.replace(old_ridge_stroke, new_ridge_stroke)
        print("Updated drawRidge stroke for Light Mode")

    # In drawVortex:
    old_vortex_clear = (
        '  // Render Mode 3: "Xoáy hạt" (3D Spectrum Ring Vortex - Batch Rendered)' + nl +
        '  function drawVortex(bands, acc, isMobile) {' + nl +
        '    const w = canvas.width;' + nl +
        '    const h = canvas.height;' + nl +
        '    const cx = w * 0.5;' + nl +
        '    const cy = h * (isMobile ? 0.44 : 0.45);' + nl +
        '    const scale = Math.min(w, h) * 0.32;' + nl +
        '    const bins = bands.bins;' + nl +
        '    const punch = bands.punch || 0;' + nl +
        nl +
        '    ctx.fillStyle = "#0E0D0B";' + nl +
        '    ctx.fillRect(0, 0, w, h);'
    )
    new_vortex_clear = (
        '  // Render Mode 3: "Xoáy hạt" (3D Spectrum Ring Vortex - Batch Rendered)' + nl +
        '  function drawVortex(bands, acc, isMobile) {' + nl +
        '    const w = canvas.width;' + nl +
        '    const h = canvas.height;' + nl +
        '    const cx = w * 0.5;' + nl +
        '    const cy = h * (isMobile ? 0.44 : 0.45);' + nl +
        '    const scale = Math.min(w, h) * 0.32;' + nl +
        '    const bins = bands.bins;' + nl +
        '    const punch = bands.punch || 0;' + nl +
        nl +
        '    const isLight = document.documentElement.getAttribute("data-theme") === "light";' + nl +
        '    ctx.fillStyle = isLight ? "#F7F5F0" : "#0E0D0B";' + nl +
        '    ctx.fillRect(0, 0, w, h);'
    )
    if old_vortex_clear in index_text:
        index_text = index_text.replace(old_vortex_clear, new_vortex_clear)
        print("Updated drawVortex clear for Light Mode")

    old_vortex_styles = (
        '    const baseR = 236, baseG = 229, baseB = 216;' + nl +
        '    const styles = [' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.32)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.42)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.72)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.88)`' + nl +
        '    ];'
    )
    new_vortex_styles = (
        '    const baseR = isLight ? 34 : 236;' + nl +
        '    const baseG = isLight ? 30 : 229;' + nl +
        '    const baseB = isLight ? 26 : 216;' + nl +
        '    const styles = isLight ? [' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.38)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.48)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.78)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.92)`' + nl +
        '    ] : [' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.32)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.42)`,' + nl +
        '      `rgba(${baseR}, ${baseG}, ${baseB}, 0.72)`,' + nl +
        '      `rgba(${ar}, ${ag}, ${ab}, 0.88)`' + nl +
        '    ];'
    )
    if old_vortex_styles in index_text:
        index_text = index_text.replace(old_vortex_styles, new_vortex_styles)
        print("Updated drawVortex styles for Light Mode")

    # In ambient tick update:
    old_amb_tick = (
        '    // Update Ambient Light Background with music bass energy' + nl +
        '    const ambEl = document.querySelector(\'.js-ambient-primary\');' + nl +
        '    if (ambEl) {' + nl +
        '      const boost = AppState.playing ? Math.min(0.28, bands.bass * 0.30) : 0;' + nl +
        '      ambEl.style.opacity = (0.78 + boost).toFixed(2);' + nl +
        '    }'
    )
    new_amb_tick = (
        '    // Update Ambient Light Background with music bass energy' + nl +
        '    const ambEl = document.querySelector(\'.js-ambient-primary\');' + nl +
        '    if (ambEl) {' + nl +
        '      const isLight = document.documentElement.getAttribute(\'data-theme\') === \'light\';' + nl +
        '      const baseOp = isLight ? 0.32 : 0.78;' + nl +
        '      const boostCap = isLight ? 0.18 : 0.28;' + nl +
        '      const boost = AppState.playing ? Math.min(boostCap, bands.bass * (isLight ? 0.20 : 0.30)) : 0;' + nl +
        '      ambEl.style.opacity = (baseOp + boost).toFixed(2);' + nl +
        '    }'
    )
    if old_amb_tick in index_text:
        index_text = index_text.replace(old_amb_tick, new_amb_tick)
        print("Updated ambient tick for Light Mode")

    # 6. Add initTheme & setTheme functions in script
    theme_js = (
        '  // Theme Management (Light / Dark)' + nl +
        '  function setTheme(theme, showToast) {' + nl +
        '    const t = theme === "light" ? "light" : "dark";' + nl +
        '    document.documentElement.setAttribute("data-theme", t);' + nl +
        '    try { localStorage.setItem("openmusic_theme", t); } catch (e) {}' + nl +
        nl +
        '    const isLight = (t === "light");' + nl +
        '    document.querySelectorAll(".js-theme-icon").forEach(el => (el.textContent = isLight ? "🌙" : "☀️"));' + nl +
        '    document.querySelectorAll(".js-theme-label").forEach(el => (el.textContent = isLight ? "Tối" : "Sáng"));' + nl +
        '    document.querySelectorAll(".js-theme-status").forEach(el => (el.textContent = isLight ? "Chế độ Sáng" : "Chế độ Tối"));' + nl +
        nl +
        '    document.querySelectorAll(".js-set-theme-dark").forEach(btn => btn.classList.toggle("on", !isLight));' + nl +
        '    document.querySelectorAll(".js-set-theme-light").forEach(btn => btn.classList.toggle("on", isLight));' + nl +
        nl +
        '    const ambEl = document.querySelector(".js-ambient-primary");' + nl +
        '    if (ambEl) ambEl.style.opacity = isLight ? "0.35" : "0.78";' + nl +
        nl +
        '    if (showToast && typeof showToastMessage === "function") {' + nl +
        '      showToastMessage(isLight ? "Đã kích hoạt Chế độ Sáng" : "Đã kích hoạt Chế độ Tối");' + nl +
        '    }' + nl +
        '  }' + nl +
        nl +
        '  function initTheme() {' + nl +
        '    let saved = null;' + nl +
        '    try { saved = localStorage.getItem("openmusic_theme"); } catch (e) {}' + nl +
        '    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;' + nl +
        '    const initial = saved || (prefersLight ? "light" : "dark");' + nl +
        '    setTheme(initial, false);' + nl +
        nl +
        '    document.querySelectorAll(".js-toggle-theme").forEach(btn => {' + nl +
        '      btn.onclick = () => {' + nl +
        '        const cur = document.documentElement.getAttribute("data-theme") || "dark";' + nl +
        '        setTheme(cur === "dark" ? "light" : "dark", true);' + nl +
        '      };' + nl +
        '    });' + nl +
        nl +
        '    document.querySelectorAll(".js-set-theme-dark").forEach(btn => {' + nl +
        '      btn.onclick = () => setTheme("dark", true);' + nl +
        '    });' + nl +
        '    document.querySelectorAll(".js-set-theme-light").forEach(btn => {' + nl +
        '      btn.onclick = () => setTheme("light", true);' + nl +
        '    });' + nl +
        '  }' + nl + nl
    )
    
    old_init_app = 'function initApp() {'
    new_init_app = theme_js + 'function initApp() {' + nl + '  initTheme();'
    if old_init_app in index_text:
        index_text = index_text.replace(old_init_app, new_init_app, 1)
        print("Added initTheme to initApp")

    index_path.write_text(index_text, encoding="utf-8")
    print("Successfully updated index.html with Light Mode!")

if __name__ == "__main__":
    apply_light_mode()
