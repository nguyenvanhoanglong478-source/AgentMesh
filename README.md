# OpenMusic — Trình Phát Nhạc Web Mở Hi-Fi & Visualizer 3D Quỹ Đạo Sóng Âm

[![Version](https://img.shields.io/badge/version-2.0.0-emerald.svg)](https://github.com/nguyenvanhoanglong478-source/OpenMusic)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-success.svg)](#)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API%20Hi--Fi-purple.svg)](#)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready%20Offline-orange.svg)](#)
[![Design](https://img.shields.io/badge/Design-100%25%20Square%20Hi--Fi-lightgrey.svg)](#)

**OpenMusic** là ứng dụng web phát nhạc tương tác thời gian thực thế hệ mới, kết hợp giữa **Kho nhạc Web Mở toàn cầu (100M+ bài hát)**, **Trình phát tệp âm thanh nội bộ Hi-Fi** và **Visualizer 3D Lăng kính Quỹ đạo (Kinetic Orbital Prism)** siêu nhẹ. Ứng dụng mang phong cách công nghiệp tối giản (Industrial Hi-Fi), giao diện nút vuông 100%, hỗ trợ cả chế độ Sáng & Tối và tương thích mượt mà trên cả máy tính lẫn điện thoại di động.

---

## 🌐 Trải Nghiệm Trực Tiếp (Live Demo)

Mở ngay trên trình duyệt mà **không cần cài đặt, không cần tài khoản, hoàn toàn miễn phí**:

👉 **[https://nguyenvanhoanglong478-source.github.io/OpenMusic/](https://nguyenvanhoanglong478-source.github.io/OpenMusic/)**

*(Tương thích chuẩn mực với Chrome, Safari, Edge, Firefox trên Windows, macOS, Linux, iOS và Android).*

---

## 🚀 Điểm Nhấn Kiến Trúc (v2.0)

Khác với các ứng dụng nghe nhạc truyền thống hoặc các bản thử nghiệm phụ thuộc vào bên thứ ba:
- **Thuần Web Mở & Tự do**: Loại bỏ hoàn toàn Spotify SDK cồng kềnh, không yêu cầu đăng nhập hay xác thực OAuth phức tạp.
- **Tốc độ phản hồi tức thì (0ms latency)**: Toàn bộ thao tác tìm kiếm và nạp nhạc diễn ra trực tiếp qua luồng dữ liệu mở tiêu chuẩn CORS.
- **Siêu tiết kiệm tài nguyên**: Visualizer 3D duy nhất được thiết kế để chỉ tiêu thụ `<0.25ms CPU/frame`, duy trì tốc độ khung hình 120–144 FPS mượt mà ngay cả trên thiết bị di động tầm trung.

---

## 🎶 Tính Năng Trọng Tâm

### 1. 🌐 Kho Nhạc Web Mở Toàn Cầu (100M+ Catalog)
- **Truy cập không giới hạn**: Tìm kiếm tức thì hơn 100 triệu bài hát, nghệ sĩ, album quốc tế và Việt Nam (Sơn Tùng M-TP, Đen Vâu, Vũ, The Weeknd, Taylor Swift, Billie Eilish, v.v.).
- **Bìa Album độ nét cao**: Tự động trích xuất ảnh bìa HD (600x600) và phân tích bảng màu chủ đạo (Color Palette Extraction) trực tiếp bằng Canvas 2D.
- **Tuyển tập Tuyển chọn Sẵn (Curated Playlists)**:
  - 🔥 *V-Pop Thịnh Hành*
  - 🌟 *The Weeknd: Tuyển Tập Hit*
  - 🌍 *Top Hits Toàn Cầu*
  - ☕ *Lofi & Acoustic Chill*
  - ⚡ *Electronic & EDM Remix*

### 2. 📁 Trình Phát Tệp Âm Thanh Nội Bộ (Local Hi-Fi Engine)
- Kéo thả hoặc mở trực tiếp các tệp nhạc có sẵn từ điện thoại và máy tính: `.mp3`, `.flac`, `.wav`, `.m4a`, `.ogg`.
- **100% Client-side**: Toàn bộ tệp âm thanh được giải mã cục bộ qua `AudioContext` trong bộ nhớ RAM, tuyệt đối không gửi lên máy chủ bên ngoài.

### 3. 🌌 Unified 3D Kinetic Orbital Prism (Lăng Kính Quỹ Đạo Sóng Âm)
- **Hiệu ứng 3D duy nhất & đồng nhất**: Tối ưu hóa đặc biệt dùng chung cho cả Mobile và Desktop.
- **Cấu trúc thị giác đa tầng**:
  - Khung dây khối lập phương 3D xoay không gian đa chiều (Wireframe Hypercube).
  - Lõi hạt phát quang hạt nhân (Inner Radiant Core) co giãn theo xung lực âm lượng.
  - Vòng hào quang quỹ đạo kép (Dual Orbital Rings) dập nảy nhịp nhàng theo cao độ giai điệu.
- **Phản ứng âm thanh trực tiếp (Audio-Reactive)**: Tích hợp cảm biến nhịp trống thời gian thực (Kick/Sub-bass Transient Detection), tạo độ nảy chuyển động đồng bộ tuyệt đối với bài hát.
- **Điều khiển góc nhìn tự do**: Chạm vuốt xoay 360° trên màn hình cảm ứng hoặc kéo chuột trên máy tính.

### 4. 📊 Bộ Phân Tích Phổ 7 Dải Âm Học (7-Band Acoustic Analyzer)
Hệ thống phân tách năng lượng âm thanh qua 7 dải tần số chuyên nghiệp:
- 🔊 **Sub** (< 60 Hz): Năng lượng siêu trầm, kích hoạt nhịp nảy trung tâm.
- 🥁 **Bass** (60 – 250 Hz): Lực đánh của trống kick và âm bassline.
- 🎸 **Low-Mid** (250 – 500 Hz): Độ dày của bộ gõ và hợp âm thấp.
- 🎤 **Mid** (500 Hz – 2 kHz): Dải tần chính của giọng hát (Vocal) và nhạc cụ chính.
- 🎺 **High-Mid** (2k – 4 kHz): Độ trong trẻo và chi tiết giai điệu.
- 🔔 **Treble** (4k – 8 kHz): Tiếng chũm chọe (Hi-hats, Cymbals) và âm sắc cao.
- 💨 **Air** (> 8 kHz): Không gian và độ mở thoáng đãng của bản phối.

### 5. 💚 Quản Lý Playlist & Mục Yêu Thích Chuẩn Spotify
- **Tạo & Quản lý Playlist cá nhân**: Tạo danh sách phát tùy biến, thêm/xóa bài hát dễ dàng.
- **Mục "Bài Hát Yêu Thích" (Liked Songs)**: Giao diện Spotify Hero Header với hiệu ứng gradient đổi màu động theo bìa bài hát.
- **Bảng danh sách chuyên nghiệp**: Hiển thị số thứ tự (#), tên bài hát, nghệ sĩ, thời lượng, nút Thả tim tức thì và nút Thêm vào Playlist.

### 6. ⏹️ Triết Lý Thiết Kế 100% Nút Vuông (Industrial Hi-Fi Layout)
- **Hình học vuông vức (Border-radius: 0px)**: Tất cả nút bấm, thanh điều khiển, ảnh đại diện, danh mục đều tuân theo chuẩn hình khối sắc nét, mạnh mẽ, gợi nhớ đến những cỗ máy nghe nhạc Hi-Fi cổ điển.
- **Thanh âm lượng dưới đáy trực quan**: Bỏ thanh âm lượng lớn bên hông, đưa về thanh trượt ngang tinh gọn ở thanh điều khiển chân trang, đồng bộ trên mọi kích cỡ màn hình.

### 7. 🌓 Hai Chế Độ Giao Diện: Sáng & Tối (Dual Theme)
- **Tối (Dark Void Hi-Fi)**: Tông màu đen than chì `#0a0b0e` sâu thẳm, tối ưu hiển thị sân khấu 3D phát quang và tiết kiệm pin OLED.
- **Sáng (Light Porcelain Wabi-Sabi)**: Tông màu trắng sứ `#f8f9fa` phong cách giấy thủ công thanh lịch, độ tương phản cao, dịu mắt khi sử dụng ban ngày.
- **Typography thuần khiết**: Nút chuyển đổi nhanh bằng chữ `Sáng` / `Tối` tối giản, không gây rối mắt.

### 8. 💡 Dynamic Ambient Light (Ánh Sáng Môi Trường)
- Tự động lấy dải màu nổi bật từ ảnh bìa bài hát đang phát và tạo hiệu ứng hào quang lan tỏa dịu nhẹ phía sau sân khấu 3D, tạo chiều sâu thị giác đắm chìm.

---

## ⌨️ Phím Tắt Điều Khiển (Keyboard Shortcuts)

| Phím | Chức năng |
| :--- | :--- |
| `Space` | Phát / Tạm dừng (Play / Pause) |
| `J` | Lùi lại 5 giây |
| `L` | Tua tới 5 giây |
| `[` | Chuyển về bài hát trước |
| `]` | Chuyển sang bài hát tiếp theo |
| `M` | Bật / Tắt tiếng (Mute / Unmute) |
| `F` | Bật / Tắt toàn màn hình (Fullscreen Stage) |

---

## 🔒 Cam Kết Quyền Riêng Tư (Zero Data Retention)

- **Không Máy Chủ Trung Gian**: Ứng dụng chạy hoàn toàn phía Client (trên trình duyệt của người dùng).
- **Không Theo Dõi (Zero Tracking)**: Tuyệt đối không thu thập cookie, thông tin cá nhân hay hành vi nghe nhạc.
- **Lưu trữ Cục bộ**: Danh sách phát và bài hát yêu thích được lưu an toàn trong `localStorage` của trình duyệt trên chính thiết bị của bạn.
- **An toàn XSS**: Dữ liệu tìm kiếm và siêu dữ liệu âm nhạc đều được khử khuẩn nghiêm ngặt qua các bộ lọc mã hóa trước khi hiển thị trên DOM.

---

## 🛠️ Cài Đặt & Chạy Cục Bộ (Local Development)

OpenMusic được xây dựng bằng công nghệ thuần túy (Vanilla Web Technologies), không yêu cầu `npm install` hay quy trình build phức tạp:

### 1. Tải mã nguồn về máy:
```bash
git clone https://github.com/nguyenvanhoanglong478-source/OpenMusic.git
cd OpenMusic
```

### 2. Khởi chạy máy chủ nội bộ:
Sử dụng bất kỳ máy chủ HTTP đơn giản nào, ví dụ bằng Python:
```bash
python -m http.server 8000
```
Hoặc dùng tiện ích mở rộng **Live Server** trên VS Code.

### 3. Mở trình duyệt:
Truy cập: `http://localhost:8000`

---

## 📂 Cấu Trúc Thư Mục

```text
OpenMusic/
├── index.html              # Toàn bộ mã nguồn cốt lõi (Giao diện, Web Audio, 3D Canvas, Controller)
├── manifest.webmanifest    # Tệp cấu hình ứng dụng web tiến bộ (PWA)
├── sw.js                   # Service Worker hỗ trợ cài đặt và bộ nhớ đệm
├── icon.svg                # Biểu tượng vector logo OpenMusic
├── icon-192.png            # Icon PWA độ phân giải 192x192
├── icon-512.png            # Icon PWA độ phân giải 512x512
├── scripts/                # Các tập lệnh kiểm thử và tối ưu tự động
├── tests/                  # Bộ kiểm thử tự động (audit giao diện, audio engine, 7 dải tần, visualizer)
└── README.md               # Tài liệu giới thiệu và hướng dẫn sử dụng
```

---

## 📄 Giấy Phép & Tác Quyền (License)

Dự án được phân phối dưới giấy phép mã nguồn mở **MIT License**. Bạn được toàn quyền sử dụng, sửa đổi và phân phối theo quy định của giấy phép.

*Phát triển với sự tận tâm dành cho cộng đồng yêu âm nhạc và công nghệ web mở.*
