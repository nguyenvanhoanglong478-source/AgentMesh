# OpenMusic — Không gian âm thanh 3D Đa Nguồn & Liên kết Spotify (Web Application)

**OpenMusic** là ứng dụng web phát nhạc không gian 3D tương tác thời gian thực (60fps), kết hợp sức mạnh của **Tài khoản Spotify cá nhân**, **Kho nhạc Web Mở toàn cầu (100M+ bài hát)** và **Bộ nhớ thiết bị ngoại tuyến** trực tiếp trên trình duyệt của mọi thiết bị (Máy tính, Điện thoại, Máy tính bảng).

---

## 🌐 Đường link Sử dụng Trực tiếp

Mở ngay trên trình duyệt mà **không cần tải về, không cần cài đặt, không cần câu lệnh**:

👉 **[https://nguyenvanhoanglong478-source.github.io/Vang-Player/](https://nguyenvanhoanglong478-source.github.io/Vang-Player/)**

*(Tương thích hoàn hảo với Chrome, Safari, Edge, Firefox trên cả máy tính lẫn điện thoại iOS/Android).*

---

## 🎶 Hệ sinh thái Âm nhạc Đa Nguồn (Multi-Source Audio Ecosystem)

OpenMusic mang lại trải nghiệm nghe nhạc không ranh giới với 5 nguồn phát linh hoạt:

1. **🟢 Spotify Thư viện Toàn diện (Spotify Unlimited & Discovery)**:
   - **Tải toàn bộ thư viện cá nhân**: Thuật toán phân trang nền thông minh tải tới **10.000+ bài hát** trong danh sách Yêu thích của bạn mà không bị nghẽn giao diện.
   - **Khám phá & Xu hướng**: Tích hợp danh mục Album mới phát hành (*New Releases*), Tuyển tập nổi bật (*Featured Playlists*) và toàn bộ Album đã lưu (*Saved Albums*).
   - **Spotify Connect & Web SDK**: Điều khiển và chuyển luồng phát linh hoạt giữa máy tính, điện thoại và loa thông minh.
   - **Âm thanh chuẩn 0-Echo**: Luồng phát chính thức qua Web Playback SDK / Connect, luồng phân tích sóng 3D chạy ngầm ở 0dB — loại bỏ 100% hiện tượng đè tiếng/tiếng vang.

2. **🌐 Kho nhạc Web Mở Toàn cầu (Open Web Catalog — 100M+ bài)**:
   - **Không cần đăng nhập, không cần tài khoản, hoàn toàn miễn phí**: Bất kỳ ai mở trang web cũng có thể tìm kiếm và thưởng thức âm nhạc ngay lập tức.
   - **Tìm kiếm 100M+ bài hát**: Tra cứu nghệ sĩ, bài hát, album quốc tế và Việt Nam (Sơn Tùng M-TP, Đen, Vũ, Taylor Swift, Billie Eilish, Adele, v.v.) với ảnh bìa độ phân giải cao 600x600.
   - **Tuyển tập thịnh hành có sẵn**: Tích hợp sẵn 4 danh mục tuyển chọn (*🔥 V-Pop Thịnh Hành, 🌍 Top Hits Toàn Cầu, ☕ Lofi & Acoustic Chill, ⚡ EDM & Remix Sôi Động*) sẵn sàng phát trong 0ms.
   - **Luồng âm thanh WebAudio trực tiếp**: Âm thanh phát mượt mà qua trình duyệt, tương tác trực tiếp với bộ phân tích 32-band FFT và cảm biến nhịp trống thời gian thực.

3. **📁 Nhạc Bộ Nhớ Máy (+ Nhạc máy / Offline)**:
   - Mở và phát trực tiếp các tệp âm thanh có sẵn trên điện thoại hoặc máy tính (`.mp3`, `.flac`, `.wav`, `.m4a`, `.ogg`).
   - 100% riêng tư: tệp âm thanh được đọc trực tiếp trong trình duyệt, không tải lên bất kỳ máy chủ nào.

4. **🎛️ Bộ Tổng Hợp Demo Điện Tử Live (Procedural Synth)**:
   - Tích hợp bộ tổng hợp âm sắc WebAudio 8-bar đa phân đoạn (Intro, Groove, Drop, Breakdown) với kick drum, snare claps, sub-bass và bộ lọc quét tần số, giúp trải nghiệm sân khấu 3D ngay cả khi không có mạng.

5. **🎙️ Thu Âm Ngoại Vi (Microphone & System Audio Loopback)**:
   - Chế độ bắt âm thanh hệ thống (*System / Tab Audio*) và Micro ngoài tắt hoàn toàn lọc ồn (AGC/Noise Suppression tắt) để visualizer bắt trọn từng xung lực âm thanh từ YouTube, game hoặc giọng hát trực tiếp.

---

## ✨ Tính năng Thị giác 3D & Giao diện

### 1. Diễn họa âm thanh 3D thời gian thực (Real-time Audio Reactive Stage)
- 🌐 **Khối đốm hạt (Cluster)**: Hơn 2.400 hạt 3D co giãn, xoay và dập nảy theo từng cú đánh Kick/Bass và tần số giọng hát.
- 🏔️ **Địa hình (Ridge)**: Thác sóng phổ FFT trải dài theo tiến trình thời gian bài hát.
- 🌪️ **Xoáy hạt (Vortex)**: Quỹ đạo hạt xoắn ốc chuyển động theo năng lượng bài nhạc.
- **Thanh trượt Độ nảy sóng 3D (0% – 200%)**: Tùy chỉnh độ nhạy nảy của sóng âm 3D theo sở thích cá nhân.
- **Tương tác cảm ứng & Chuột**: Chạm/vuốt xoay tự do không gian 3D trên cả điện thoại và máy tính.

### 2. Giao diện Cân đối & Nút điều khiển Hình học (Responsive Design)
- **Chuẩn hóa điện thoại & PC**: Kích thước chữ và các nút điều khiển được chuẩn hóa, phân bổ đều đặn, không tràn viền trên cả màn hình điện thoại dọc và màn hình máy tính rộng.
- **Thanh chuyển nguồn tìm kiếm**: Bộ lọc tìm kiếm nhanh chuyển đổi giữa `[ 🌐 Web Mở ]` và `[ 🟢 Spotify ]` chỉ với 1 chạm.
- **Icon hình học nhỏ gọn**: Toàn bộ nút chức năng được tối giản thành các biểu tượng SVG vuông vắn, cố định kích thước, không biến dạng.
- **Hẹn giờ tắt nhạc (Sleep Timer)**: Tự động dừng phát nhạc sau 15, 30 hoặc 60 phút.

---

## 🔒 Cam kết Bảo mật & Quyền riêng tư (Zero User Data Retention)

- **100% Không lưu trữ dữ liệu người dùng (Zero-Retention)**: OpenMusic hoạt động hoàn toàn trên trình duyệt người dùng (Client-Side), không có máy chủ trung gian, không có cơ sở dữ liệu và không sử dụng cookie theo dõi.
- **Bảo mật phiên đăng nhập trong RAM**: Mã truy cập Spotify (`access_token`) chỉ tồn tại duy nhất trong bộ nhớ tạm RAM khi tab trình duyệt đang mở. Khi bạn đóng tab hoặc bấm *Ngắt kết nối / Xóa phiên*, 100% dữ liệu bị xóa sạch hoàn toàn khỏi thiết bị.
- **Chuẩn xác thực bảo mật cao OAuth 2.0 PKCE**: Đăng nhập trực tiếp qua cổng ủy quyền chính thức của Spotify với cơ chế mã hóa chống giả mạo (Anti-CSRF), tuyệt đối không bao giờ yêu cầu hay lưu mật khẩu của người dùng.
- **Chống tấn công XSS**: Toàn bộ chuỗi dữ liệu đầu vào và thông tin bài hát từ các nguồn đều được khử khuẩn qua bộ lọc `escHtml` và `escUrl` nghiêm ngặt trước khi hiển thị.
