from pathlib import Path

ROOT = Path(r"C:\Users\nguye\.gemini\antigravity\scratch\vang-player")
index_path = ROOT / "index.html"
text = index_path.read_text(encoding="utf-8")
nl = "\r\n" if "\r\n" in text else "\n"

target = '      <!-- 6. Music Player Utilities (Sleep Timer & Update Check) -->' + nl + '      <div class="sec-block" style="margin-top:auto">'

replacement = (
    '      <!-- 6. Giao diện (Chế độ Sáng / Tối) -->' + nl +
    '      <div class="sec-block">' + nl +
    '        <div class="sec-hdr">' + nl +
    '          <span class="mono sec-label">Giao diện</span>' + nl +
    '          <span class="mono acc js-theme-status" style="font-size:10.5px">Chế độ Tối</span>' + nl +
    '        </div>' + nl +
    '        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + nl +
    '          <button class="word mono js-set-theme-dark on" type="button" data-t="dark">🌙 Tối</button>' + nl +
    '          <button class="word mono js-set-theme-light" type="button" data-t="light">☀️ Sáng</button>' + nl +
    '        </div>' + nl +
    '      </div>' + nl + nl +
    '      <!-- 7. Music Player Utilities (Sleep Timer & Update Check) -->' + nl +
    '      <div class="sec-block" style="margin-top:auto">'
)

if target in text:
    text = text.replace(target, replacement)
    index_path.write_text(text, encoding="utf-8")
    print("Theme block successfully added to right-pane!")
else:
    print("Target not found in index.html")
