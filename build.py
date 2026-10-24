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
  <meta name="referrer" content="no-referrer" />
  <meta name="theme-color" content="#0E0D0B" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="VANG" />
  <title>VANG — Không gian âm thanh 3D</title>
  <link rel="manifest" href="./manifest.webmanifest" />
  <link rel="icon" type="image/svg+xml" href="./icon.svg" />
  <link rel="apple-touch-icon" href="./icon.svg" />
  <style>
{css}
  </style>
</head>
<body>
  <div class="app-shell">
    <!-- TOP BAR (Single-row fixed Flexbox — never overflows) -->
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">
          <span class="status-dot"></span>
          <span>VANG</span>
        </div>
        <span class="mono dim truncate js-user-status">Chế độ thử nghiệm</span>
      </div>

      <div class="top-center">
        <span class="mono dim">Đầu ra:</span>
        <button class="word mono js-open-devices" type="button">
          <span class="truncate js-device-name" style="max-width:200px">Trình phát Web · Vang</span>
        </button>
      </div>

      <div class="top-right">
        <button class="word mono js-open-devices" type="button">Thiết bị</button>
        <button class="word mono on js-open-spotify" type="button">Spotify</button>
      </div>
    </header>

    <!-- LEFT PANE: LIBRARY & QUEUE -->
    <aside class="left-pane" aria-label="Thư viện và danh sách phát">
      <nav class="nav-tabs" aria-label="Phân mục thư viện">
        <button class="word on" type="button" data-tab="queue">Danh sách</button>
        <button class="word" type="button" data-tab="liked">Yêu thích</button>
        <button class="word" type="button" data-tab="top">Nghe nhiều</button>
        <button class="word" type="button" data-tab="playlists">Tuyển tập</button>
        <button class="word" type="button" data-tab="recent">Gần đây</button>
        <button class="word" type="button" data-tab="search">Tìm kiếm</button>
      </nav>

      <div class="sub-bar">
        <span class="mono dim js-track-count">6 bài</span>
        <div style="display:flex;gap:6px">
          <button id="btn-open-local-files" class="word mono" type="button" style="height:26px;padding:0 8px;font-size:10px" title="Phát nhạc từ bộ nhớ máy (.mp3, .flac, .wav)">+ Nhạc máy</button>
          <button class="word mono acc js-sync-library" type="button" style="height:26px;padding:0 8px;font-size:10px">Đồng bộ</button>
        </div>
        <input id="local-file-input" type="file" accept="audio/*" multiple hidden />
      </div>

      <div id="search-wrap" class="search-wrap">
        <input
          id="search-input"
          class="search-input"
          type="search"
          placeholder="Tìm bài hát, nghệ sĩ, album..."
          autocomplete="off"
        />
      </div>

      <div id="track-list" class="track-list" role="list"></div>
    </aside>

    <!-- CENTER STAGE: 3D PARTICLE CLUSTER & COMPACT METADATA (No clutter text) -->
    <main id="main-stage" class="stage" aria-label="Không gian mô phỏng âm thanh 3D">
      <div class="stage-vignette"></div>

      <div class="stage-meta">
        <div class="mono track-album js-album">Phố Không Ngủ · 2024</div>
        <h1 class="track-title js-title">Đèn Đường Lúc Ba Giờ</h1>
        <div class="track-artist js-artist">Nhóm Gác Mái</div>
      </div>
    </main>

    <!-- RIGHT PANE: COMPACT ICON SELECTORS, 3D BOUNCE SLIDER & SIGNAL METERS -->
    <aside class="right-pane" aria-label="Cấu hình thị giác 3D và âm thanh">
      <!-- 1. 3D Mode Compact Icons -->
      <div class="sec-block">
        <div class="sec-hdr">
          <span class="mono sec-label">Hình thái 3D</span>
          <span class="mono acc js-vmode-label" style="font-size:10.5px">Khối đốm hạt</span>
        </div>
        <div class="icon-grid-3">
          <button class="icon-btn js-vmode on" type="button" data-m="cluster" title="Khối đốm hạt" aria-label="Khối đốm hạt">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="10" r="2.2"/>
              <circle cx="10" cy="4" r="1.5"/>
              <circle cx="10" cy="16" r="1.5"/>
              <circle cx="4" cy="10" r="1.5"/>
              <circle cx="16" cy="10" r="1.5"/>
              <circle cx="5.8" cy="5.8" r="1.3"/>
              <circle cx="14.2" cy="5.8" r="1.3"/>
              <circle cx="5.8" cy="14.2" r="1.3"/>
              <circle cx="14.2" cy="14.2" r="1.3"/>
            </svg>
          </button>
          <button class="icon-btn js-vmode" type="button" data-m="ridge" title="Địa hình sóng" aria-label="Địa hình">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 7c2.5 0 3.5-3.5 6-3.5s3.5 3.5 6 3.5 2.5-1.5 4-1.5"/>
              <path d="M2 11.5c2.5 0 4-4 6.5-4s3.5 4 6 4 2-1.5 3.5-1.5"/>
              <path d="M2 16c3 0 4.5-3 7.5-3s4 3 8.5 3"/>
            </svg>
          </button>
          <button class="icon-btn js-vmode" type="button" data-m="vortex" title="Xoáy hạt quỹ đạo" aria-label="Xoáy hạt">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4">
              <ellipse cx="10" cy="10" rx="7.5" ry="3.5" transform="rotate(-22 10 10)"/>
              <ellipse cx="10" cy="10" rx="4.2" ry="1.8" transform="rotate(-22 10 10)"/>
              <circle cx="10" cy="10" r="1.4" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 2. 3D Bounce Intensity Slider -->
      <div class="sec-block">
        <div class="sec-hdr">
          <span class="mono sec-label">Độ nảy sóng 3D</span>
          <span class="mono acc js-bounce-val" style="font-size:10.5px">100%</span>
        </div>
        <input
          id="bounce-slider"
          class="range-slider"
          type="range"
          min="0"
          max="200"
          step="5"
          value="100"
          aria-label="Độ nảy sóng âm 3D"
        />
      </div>

      <!-- 3. Audio Signal Source Compact Icons -->
      <div class="sec-block">
        <div class="sec-hdr">
          <span class="mono sec-label">Nguồn sóng âm</span>
          <span class="mono acc js-src-label" style="font-size:10.5px">Tự động</span>
        </div>
        <div class="icon-grid-3">
          <button class="icon-btn js-src-mode on" type="button" data-src="auto" title="Tự động theo bài hát" aria-label="Tự động theo bài hát">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M3 10h2.5l2-5 3 10 2.5-7 1.5 2H17"/>
            </svg>
          </button>
          <button class="icon-btn js-src-mode" type="button" data-src="system" title="Bắt âm thanh máy tính / Tab" aria-label="Bắt âm thanh máy tính">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="14" height="9.5" rx="1.5"/>
              <path d="M7 16.5h6M10 13.5v3"/>
            </svg>
          </button>
          <button class="icon-btn js-src-mode" type="button" data-src="mic" title="Thu qua Micro" aria-label="Thu qua Micro">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="7.5" y="3" width="5" height="8.5" rx="2.5"/>
              <path d="M5 9.5a5 5 0 0 0 10 0M10 14.5v3M7.5 17.5h5"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 4. FFT Frequency Meters -->
      <div class="sec-block">
        <div class="mono sec-label">Phổ tần số</div>

        <div class="meter-row">
          <div class="meter-hdr mono">
            <span class="dim">Trầm</span>
            <span class="js-mb-val">0</span>
          </div>
          <div class="meter"><i class="acc-bar js-mb"></i></div>
        </div>

        <div class="meter-row">
          <div class="meter-hdr mono">
            <span class="dim">Trung</span>
            <span class="js-mm-val">0</span>
          </div>
          <div class="meter"><i class="js-mm"></i></div>
        </div>

        <div class="meter-row">
          <div class="meter-hdr mono">
            <span class="dim">Cao</span>
            <span class="js-mh-val">0</span>
          </div>
          <div class="meter"><i class="js-mh"></i></div>
        </div>
      </div>

      <!-- 5. Music Player Utilities (Sleep Timer & Update Check) -->
      <div class="sec-block" style="margin-top:auto">
        <div class="sec-hdr">
          <span class="mono sec-label">Hẹn giờ tắt</span>
          <button id="btn-sleep-timer" class="word mono" type="button" style="height:26px;padding:0 8px;font-size:10.5px">
            <span class="js-sleep-label">Tắt</span>
          </button>
        </div>
        <div class="sec-hdr" style="margin-top:4px">
          <span class="mono sec-label">Phiên bản v1.2.0</span>
          <button id="btn-check-update" class="word mono" type="button" style="height:26px;padding:0 8px;font-size:10.5px">Kiểm tra cập nhật</button>
        </div>
      </div>
    </aside>

    <!-- BOTTOM TRANSPORT BAR -->
    <footer class="transport" aria-label="Điều khiển phát nhạc">
      <div class="transport-left">
        <button class="ctl-btn js-shuffle" type="button" title="Trộn bài" aria-label="Trộn bài"></button>
        <button class="ctl-btn js-prev" type="button" title="Bài trước" aria-label="Bài trước"></button>
        <button class="ctl-btn play-btn js-play" type="button" title="Phát / Tạm dừng" aria-label="Phát" data-state="paused">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
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
        <span class="mono dim js-vol-lbl" style="min-width:22px;text-align:right">78</span>
      </div>
    </footer>

    <!-- MOBILE BOTTOM DRAWER BAR (Uniform 4-column grid) -->
    <nav class="mob-bar" aria-label="Điều hướng di động">
      <button class="word mono" type="button" data-mob-drawer="left">Thư viện</button>
      <button class="word mono js-vmode-cycle" type="button">Khối đốm hạt</button>
      <button class="word mono" type="button" data-mob-drawer="right">Tùy chỉnh 3D</button>
      <button class="word mono js-open-devices" type="button">Thiết bị</button>
    </nav>
  </div>

  <!-- IN-APP GITHUB UPDATE NOTIFICATION BANNER -->
  <div id="update-banner" class="update-banner" hidden>
    <div>
      <div id="update-ver-text" style="font-size:12.5px;font-weight:600;color:var(--acc)">Đã có bản cập nhật web mới!</div>
      <div class="dim" style="font-size:11px;margin-top:2px">Bấm nút Tải lại để nhận phiên bản mới nhất.</div>
    </div>
    <button onclick="location.reload(true)" class="btn-solid" style="height:30px;padding:0 10px">Tải lại trang</button>
    <button id="btn-close-update" class="word mono" type="button" style="height:30px;padding:0 8px">Đóng</button>
  </div>

  <!-- MODAL 1: SPOTIFY ZERO-RETENTION OAUTH PKCE CONNECTION -->
  <div id="spotify-modal" class="modal-backdrop" hidden>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="sp-modal-title">
      <div class="modal-hdr">
        <h2 id="sp-modal-title" class="modal-title">Kết nối tài khoản Spotify</h2>
        <button class="word mono js-close-spotify" type="button">Đóng</button>
      </div>

      <div style="padding:8px 10px;border:1px solid var(--line);border-radius:4px;font-size:11.5px;line-height:1.45" class="dim">
        <strong style="color:var(--paper)">Cam kết Bảo mật &amp; Quyền riêng tư:</strong> VANG kết nối trực tiếp với Spotify qua chuẩn <strong>OAuth 2.0 PKCE + Anti-CSRF</strong>, <strong>không lưu bất kỳ thông tin cá nhân, mật khẩu hay mã đăng nhập nào</strong> vào ổ cứng máy tính hay máy chủ. Khi bạn đóng ứng dụng hoặc bấm Ngắt kết nối, phiên làm việc trong bộ nhớ RAM được xóa sạch 100%.
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;font-size:12px" class="dim">
        <div>1. Mở <strong>developer.spotify.com/dashboard</strong> → chọn ứng dụng của bạn → mục <strong>Redirect URIs</strong> thêm địa chỉ:</div>
        <div id="sp-redirect-uri" class="mono acc" style="padding:7px 10px;background:var(--ink);border:1px solid var(--line);border-radius:4px;user-select:all;-webkit-user-select:all"></div>
        <div>2. Dán mã <strong>Spotify Client ID</strong> vào ô dưới đây và bấm <strong>Đăng nhập Spotify</strong>:</div>
      </div>

      <div>
        <label class="mono dim" for="sp-client-id" style="display:block;margin-bottom:5px">Spotify Client ID</label>
        <input
          id="sp-client-id"
          class="field-input"
          type="text"
          placeholder="Dán Spotify Client ID (32 ký tự)..."
          autocomplete="off"
        />
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between;align-items:center">
        <button id="btn-logout-spotify" class="btn-outline" type="button">Ngắt kết nối / Xóa phiên</button>
        <div style="display:flex;gap:8px">
          <button id="btn-save-client-id" class="btn-outline" type="button">Giữ tạm ID</button>
          <button id="btn-connect-spotify" class="btn-solid" type="button">Đăng nhập Spotify</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL 2: SPOTIFY CONNECT DEVICE SWITCHER -->
  <div id="device-modal" class="modal-backdrop" hidden>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dev-modal-title">
      <div class="modal-hdr">
        <h2 id="dev-modal-title" class="modal-title">Thiết bị phát (Điện thoại &amp; Laptop)</h2>
        <button class="word mono js-close-devices" type="button">Đóng</button>
      </div>

      <p class="dim" style="font-size:12px;line-height:1.45">
        Chọn thiết bị đầu ra âm thanh qua giao thức Spotify Connect.
      </p>

      <div id="device-list" style="display:flex;flex-direction:column;gap:8px"></div>
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
    navigator.serviceWorker.register('./sw.js').then(reg => {{
      try {{ reg.update(); }} catch (e) {{}}
    }}).catch(() => {{}});
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
