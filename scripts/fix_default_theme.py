from pathlib import Path

ROOT = Path(r"C:\Users\nguye\.gemini\antigravity\scratch\vang-player")
index_path = ROOT / "index.html"
text = index_path.read_text(encoding="utf-8")
nl = "\r\n" if "\r\n" in text else "\n"

target = (
    '    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;' + nl +
    '    const initial = saved || (prefersLight ? "light" : "dark");'
)

replacement = '    const initial = saved || "dark";'

if target in text:
    text = text.replace(target, replacement)
    index_path.write_text(text, encoding="utf-8")
    print("Updated default theme to dark!")
else:
    print("Target not found")
