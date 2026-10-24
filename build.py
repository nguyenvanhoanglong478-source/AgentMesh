import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

css = (SRC / "style.css").read_text(encoding="utf-8")
audio_js = (SRC / "audio.js").read_text(encoding="utf-8")
visualizer_js = (SRC / "visualizer.js").read_text(encoding="utf-8")
spotify_js = (SRC / "spotify.js").read_text(encoding="utf-8")
app_js = (SRC / "app.js").read_text(encoding="utf-8")

HTML_TEMPLATE = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0E0D0B" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="VANG" />
  <title>VANG — Không gian âm thanh 3D cho Spotify</title>
  <link rel="manifest" href="./manifest.webmanifest" />
  <link rel="icon" type="image/svg+xml" href="./icon.svg" />
  <link rel="apple-touch-icon" href="./icon.svg" />
  <style>
{css}
  </style>
</head>
<body>
  <div class="app-shell">
    <!-- TOP BAR -->
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">
          <span class="status-dot"></span>
          <span>VANG · 01</span>
        </div>
        <span class="mono dim js-user-status">Chế độ thử nghiệm</span>
      </div>

      <div class="top-center">
        <div class="mono dim">
          Đầu ra âm thanh:
          <button class="word js-open-devices" type="button" style="margin-left:6px">
            <span class="js-device-name">Trình phát Web · Vang (Máy này)</span>
          </button>
        </div>
        <div class="mono dim">60 FPS · 3D AUDIO STAGE</div>
      </div>

      <div class="top-right">
        <button class="word mono js-open-install" type="button">Tải ứng dụng</button>
        <button class="word mono js-open-devices" type="button">Thiết bị phát</button>
        <button class="word mono acc js-open-spotify" type="button">Kết nối Spotify</button>
      </div>
    </header>

    <!-- LEFT PANE: LIBRARY & QUEUE -->
    <aside class="left-pane" aria-label="Thư viện và danh sách phát">
      <nav class="nav-tabs" aria-label="Phân mục thư viện">
        <button class="word on" type="button" data-tab="queue">Danh sách phát</button>
        <button class="word" type="button" data-tab="liked">Yêu thích</button>
        <button class="word" type="button" data-tab="top">Nghe nhiều</button>
        <button class="word" type="button" data-tab="playlists">Tuyển tập</button>
        <button class="word" type="button" data-tab="recent">Gần đây</button>
        <button class="word" type="button" data-tab="search">Tìm kiếm</button>
      </nav>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 26px;border-bottom:1px solid var(--line)">
        <span class="mono dim js-track-count">6 bài</span>
        <button class="word mono acc js-sync-library" type="button" style="font-size:11px">Đồng bộ đầy đủ</button>
      </div>

      <div id="search-wrap" class="search-wrap">
        <input
          id="search-input"
          class="search-input"
          type="search"
          placeholder="Nhập tên bài hát, nghệ sĩ hoặc album..."
          autocomplete="off"
        />
      </div>

      <div id="track-list" class="track-list" role="list"></div>
    </aside>

    <!-- CENTER STAGE: 3D PARTICLE CLUSTER & EDITORIAL METADATA -->
    <main id="main-stage" class="stage" aria-label="Không gian mô phỏng âm thanh 3D">
      <div class="stage-vignette"></div>

      <div class="stage-hud-top">
        <div class="mono dim">KÉO CHUỘT HOẶC CHẠM ĐỂ XOAY KHỐI 3D</div>
        <div class="mono dim">TÍN HIỆU THỜI GIAN THỰC · FFT</div>
      </div>

      <div class="stage-meta">
        <div class="mono track-album js-album">Phố Không Ngủ · 2024</div>
        <h1 class="track-title js-title">Đèn Đường Lúc Ba Giờ</h1>
        <div class="track-artist js-artist">Nhóm Gác Mái</div>
      </div>
    </main>

    <!-- RIGHT PANE: VISUALIZER MODES & SIGNAL METERS -->
    <aside class="right-pane" aria-label="Cấu hình thị giác 3D và phổ tần số">
      <div class="sec-block">
        <div class="mono sec-label">Hình thái 3D</div>
        <button class="word js-vmode on" type="button" data-m="cluster">Khối đốm hạt</button>
        <button class="word js-vmode" type="button" data-m="ridge">Địa hình</button>
        <button class="word js-vmode" type="button" data-m="vortex">Xoáy hạt</button>
      </div>

      <div class="sec-block">
        <div class="mono sec-label">Nguồn phân tích sóng âm</div>
        <button class="word js-src-mode on" type="button" data-src="auto">Đồng bộ nội bộ</button>
        <button class="word js-src-mode" type="button" data-src="mic">Thu âm trực tiếp (Mic)</button>
      </div>

      <div class="sec-block">
        <div class="mono sec-label">Phổ tần số (FFT)</div>

        <div class="meter-row">
          <div class="meter-hdr mono">
            <span class="dim">Trầm · 60Hz</span>
            <span class="js-mb-val">0</span>
          </div>
          <div class="meter"><i class="acc-bar js-mb"></i></div>
        </div>

        <div class="meter-row">
          <div class="meter-hdr mono">
            <span class="dim">Trung · 1kHz</span>
            <span class="js-mm-val">0</span>
          </div>
          <div class="meter"><i class="js-mm"></i></div>
        </div>

        <div class="meter-row">
          <div class="meter-hdr mono">
            <span class="dim">Cao · 8kHz</span>
            <span class="js-mh-val">0</span>
          </div>
          <div class="meter"><i class="js-mh"></i></div>
        </div>
      </div>

      <div class="sec-block" style="margin-top:auto">
        <div class="mono sec-label">Ứng dụng độc lập</div>
        <div class="dim" style="font-size:12.5px;line-height:1.5">
          Hỗ trợ dùng trực tiếp trên Web, cài đặt PWA trên Điện thoại hoặc tải bản <button class="word acc js-open-install" type="button" style="font-size:12.5px">VANG.exe</button> chạy độc lập trên PC.
        </div>
      </div>
    </aside>

    <!-- BOTTOM TRANSPORT BAR (Geometric Task Buttons + Scrubber + Volume) -->
    <footer class="transport" aria-label="Điều khiển phát nhạc">
      <div class="transport-left">
        <button class="ctl-btn js-shuffle" type="button" title="Trộn bài" aria-label="Trộn bài"></button>
        <button class="ctl-btn js-prev" type="button" title="Bài trước" aria-label="Bài trước"></button>
        <button class="ctl-btn play-btn js-play" type="button" title="Phát / Tạm dừng" aria-label="Phát" data-state="paused">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <polygon points="4,2.2 13.8,8 4,13.8"/>
          </svg>
        </button>
        <button class="ctl-btn js-next" type="button" title="Bài tiếp" aria-label="Bài tiếp"></button>
        <button class="ctl-btn js-repeat" type="button" title="Lặp bài" aria-label="Lặp bài"></button>
      </div>

      <div class="transport-center">
        <span class="mono dim js-time">0:37</span>
        <div class="scrub-track js-scrub" role="slider" aria-label="Tiến độ bài hát">
          <div class="scrub-fill js-scrub-fill" style="width:14.6%"></div>
          <div class="scrub-head js-scrub-head" style="left:14.6%"></div>
        </div>
        <span class="mono dim js-dur">4:12</span>
      </div>

      <div class="transport-right">
        <button class="ctl-btn js-mute" type="button" title="Âm lượng / Tắt tiếng" aria-label="Âm lượng"></button>
        <div class="vol-track js-vol-track" role="slider" aria-label="Thanh âm lượng">
          <div class="scrub-fill js-vol-fill" style="width:78%"></div>
        </div>
        <span class="mono dim js-vol-lbl" style="min-width:24px;text-align:right">78</span>
      </div>
    </footer>

    <!-- MOBILE BOTTOM DRAWER BAR -->
    <nav class="mob-bar" aria-label="Điều hướng di động">
      <button class="word mono" type="button" data-mob-drawer="left">Danh sách</button>
      <button class="word mono js-vmode-cycle" type="button">Khối đốm hạt</button>
      <button class="word mono" type="button" data-mob-drawer="right">Thị giác 3D</button>
      <button class="word mono js-open-install" type="button">Tải App</button>
    </nav>
  </div>

  <!-- MODAL 1: SPOTIFY OAUTH PKCE CONNECTION -->
  <div id="spotify-modal" class="modal-backdrop" hidden>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="sp-modal-title">
      <div class="modal-hdr">
        <h2 id="sp-modal-title" class="modal-title">Liên kết tài khoản Spotify</h2>
        <button class="word mono js-close-spotify" type="button">Đóng</button>
      </div>

      <p class="dim" style="font-size:13.5px;line-height:1.55">
        VANG sử dụng chuẩn bảo mật <strong>OAuth 2.0 PKCE</strong> trực tiếp từ trình duyệt (không cần máy chủ trung gian lưu mật khẩu). Để kết nối tài khoản Spotify cá nhân trên điện thoại và laptop:
      </p>

      <div style="display:flex;flex-direction:column;gap:8px;font-size:13px" class="dim">
        <div>1. Truy cập <strong>developer.spotify.com/dashboard</strong> và tạo một ứng dụng (Create App).</div>
        <div>2. Thêm địa chỉ Redirect URI dưới đây vào phần cài đặt ứng dụng Spotify:</div>
        <div id="sp-redirect-uri" class="mono acc" style="padding:8px 10px;background:var(--ink);border:1px solid var(--line);user-select:all"></div>
        <div>3. Dán <strong>Spotify Client ID</strong> của bạn vào ô bên dưới:</div>
      </div>

      <div>
        <label class="mono dim" for="sp-client-id" style="display:block;margin-bottom:6px">Spotify Client ID</label>
        <input
          id="sp-client-id"
          class="field-input"
          type="text"
          placeholder="Ví dụ: 8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d"
          autocomplete="off"
        />
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
        <button id="btn-save-client-id" class="btn-outline" type="button">Lưu Client ID</button>
        <button id="btn-connect-spotify" class="btn-solid" type="button">Đăng nhập Spotify</button>
      </div>
    </div>
  </div>

  <!-- MODAL 2: SPOTIFY CONNECT DEVICE SWITCHER (PHONE <-> LAPTOP) -->
  <div id="device-modal" class="modal-backdrop" hidden>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dev-modal-title">
      <div class="modal-hdr">
        <h2 id="dev-modal-title" class="modal-title">Thiết bị phát (Điện thoại &amp; Laptop)</h2>
        <button class="word mono js-close-devices" type="button">Đóng</button>
      </div>

      <p class="dim" style="font-size:13.5px;line-height:1.5">
        Chọn thiết bị đầu ra âm thanh. Bạn có thể dùng điện thoại làm điều khiển từ xa để phát nhạc trên Laptop hoặc ngược lại qua Spotify Connect.
      </p>

      <div id="device-list" style="display:flex;flex-direction:column;gap:10px"></div>
    </div>
  </div>

  <!-- MODAL 3: STANDALONE APP DOWNLOAD & 1-CLICK PWA INSTALL -->
  <div id="install-modal" class="modal-backdrop" hidden>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="inst-modal-title">
      <div class="modal-hdr">
        <h2 id="inst-modal-title" class="modal-title">Tải &amp; Cài đặt ứng dụng VANG</h2>
        <button class="word mono js-close-install" type="button">Đóng</button>
      </div>

      <p class="dim" style="font-size:13.5px;line-height:1.5">
        Không cần dùng bất kỳ câu lệnh nào. Bạn có thể cài đặt trực tiếp hoặc tải tệp chạy độc lập về máy:
      </p>

      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="device-item" style="cursor:default">
          <div style="padding-right:12px">
            <div style="font-size:14.5px;color:var(--paper);font-weight:500">1. Ứng dụng Windows độc lập (VANG.exe)</div>
            <div class="dim" style="font-size:12.5px;margin-top:3px">
              Tệp thực thi duy nhất (~100 KB), nhấp đúp chuột là mở cửa sổ ứng dụng riêng biệt trên PC/Laptop.
            </div>
          </div>
          <a href="./VANG.exe" download="VANG.exe" class="btn-solid" style="text-decoration:none;white-space:nowrap">Tải VANG.exe</a>
        </div>

        <div class="device-item" style="cursor:default">
          <div style="padding-right:12px">
            <div style="font-size:14.5px;color:var(--paper);font-weight:500">2. Cài đặt 1 chạm trên Điện thoại &amp; Web (PWA)</div>
            <div class="dim" style="font-size:12.5px;margin-top:3px">
              Thêm biểu tượng VANG vào màn hình chính iOS, Android, macOS hoặc Windows.
            </div>
          </div>
          <button id="btn-pwa-install" class="btn-outline" type="button" style="white-space:nowrap">Cài đặt ngay</button>
        </div>

        <div class="device-item" style="cursor:default">
          <div style="padding-right:12px">
            <div style="font-size:14.5px;color:var(--paper);font-weight:500">3. Bản Offline chạy mọi thiết bị (.html)</div>
            <div class="dim" style="font-size:12.5px;margin-top:3px">
              Tải 1 tệp duy nhất tích hợp sẵn toàn bộ đồ họa 3D và bộ phát âm thanh để mở mọi lúc.
            </div>
          </div>
          <a href="./index.html" download="VANG-Player.html" class="btn-outline" style="text-decoration:none;white-space:nowrap">Tải bản Offline</a>
        </div>
      </div>
    </div>
  </div>

  <!-- TOAST -->
  <div id="toast" role="status" aria-live="polite"></div>

  <script>
{audio_js}

{visualizer_js}

{spotify_js}

{app_js}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {{
  window.addEventListener('load', () => {{
    navigator.serviceWorker.register('./sw.js').catch(() => {{}});
  }});
}}
  </script>
</body>
</html>
"""

out_index = ROOT / "index.html"
out_index.write_text(HTML_TEMPLATE, encoding="utf-8")
print(f"Wrote {out_index} ({out_index.stat().st_size} bytes)")

preview_artifact = Path(r"C:\Users\nguye\.gemini\antigravity\brain\dcbc4ce6-22e7-46ac-8c3e-a9dd1e7ad9d4\vang_preview.html")
if preview_artifact.parent.exists():
    preview_artifact.write_text(HTML_TEMPLATE, encoding="utf-8")
    print(f"Updated artifact {preview_artifact}")

# Compile standalone Windows executable (VANG.exe) with embedded web assets
csc_path = Path(r"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe")
launcher_cs = SRC / "Launcher.cs"
exe_out = ROOT / "VANG.exe"

if csc_path.exists() and launcher_cs.exists():
    cmd = [
        str(csc_path),
        "/nologo",
        "/optimize+",
        "/target:winexe",
        f"/out:{exe_out}",
        f"/resource:{out_index},index.html",
        f"/resource:{ROOT / 'manifest.webmanifest'},manifest.webmanifest",
        f"/resource:{ROOT / 'sw.js'},sw.js",
        f"/resource:{ROOT / 'icon.svg'},icon.svg",
        str(launcher_cs),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Compiled standalone desktop app: {exe_out} ({exe_out.stat().st_size} bytes)")
    else:
        print("CSC error:", res.stdout, res.stderr)
