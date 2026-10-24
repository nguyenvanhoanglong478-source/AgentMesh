from pathlib import Path

ROOT = Path(r"C:\Users\nguye\.gemini\antigravity\scratch\vang-player")
index_text = (ROOT / "index.html").read_text(encoding="utf-8")

# Extract CSS from index.html into src/style.css
css_start = index_text.find("<style>") + len("<style>")
css_end = index_text.find("</style>")
css_content = index_text[css_start:css_end].strip()
(ROOT / "src" / "style.css").write_text(css_content + "\n", encoding="utf-8")
print("Updated src/style.css from index.html")

# Update src/visualizer.js
# Visualizer3D in index.html is between `const Visualizer3D = (function () {` and `window.Visualizer3D = Visualizer3D;`
v_start = index_text.find("// ===== VANG 3D AUDIO-REACTIVE VISUALIZER =====")
v_end = index_text.find("window.Visualizer3D = Visualizer3D;") + len("window.Visualizer3D = Visualizer3D;")
if v_start != -1 and v_end != -1:
    v_content = index_text[v_start:v_end].strip()
    (ROOT / "src" / "visualizer.js").write_text(v_content + "\n", encoding="utf-8")
    print("Updated src/visualizer.js from index.html")

print("Modular files synchronized successfully!")
