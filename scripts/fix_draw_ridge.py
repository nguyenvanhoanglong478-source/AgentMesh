from pathlib import Path

ROOT = Path(r"C:\Users\nguye\.gemini\antigravity\scratch\vang-player")
index_path = ROOT / "index.html"
text = index_path.read_text(encoding="utf-8")
nl = "\r\n" if "\r\n" in text else "\n"

old_ridge = (
    '  // Render Mode 2: "Địa hình" (Real-Time 3D Waterfall Spectrogram Terrain)' + nl +
    '  function drawRidge(bands, acc, progressRatio, isMobile) {' + nl +
    '    const w = canvas.width;' + nl +
    '    const h = canvas.height;' + nl +
    '    const top = h * 0.16;' + nl +
    '    const bot = h * (isMobile ? 0.76 : 0.70);' + nl +
    '    const st = (bot - top) / RIDGE_ROWS;' + nl +
    '    const maxAmp = h * (isMobile ? 0.19 : 0.22);' + nl +
    nl +
    '    ctx.fillStyle = \'#0E0D0B\';' + nl +
    '    ctx.fillRect(0, 0, w, h);'
)

new_ridge = (
    '  // Render Mode 2: "Địa hình" (Real-Time 3D Waterfall Spectrogram Terrain)' + nl +
    '  function drawRidge(bands, acc, progressRatio, isMobile) {' + nl +
    '    const w = canvas.width;' + nl +
    '    const h = canvas.height;' + nl +
    '    const top = h * 0.16;' + nl +
    '    const bot = h * (isMobile ? 0.76 : 0.70);' + nl +
    '    const st = (bot - top) / RIDGE_ROWS;' + nl +
    '    const maxAmp = h * (isMobile ? 0.19 : 0.22);' + nl +
    nl +
    '    const isLight = document.documentElement.getAttribute("data-theme") === "light";' + nl +
    '    ctx.fillStyle = isLight ? "#F7F5F0" : "#0E0D0B";' + nl +
    '    ctx.fillRect(0, 0, w, h);'
)

if old_ridge in text:
    text = text.replace(old_ridge, new_ridge)
    index_path.write_text(text, encoding="utf-8")
    print("Successfully fixed isLight in drawRidge!")
else:
    print("old_ridge target not found in index.html")
