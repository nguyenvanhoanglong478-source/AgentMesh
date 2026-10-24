# VANG — Không gian âm thanh 3D liên kết Spotify (Web Application)

**VANG** là ứng dụng web phát nhạc không gian 3D tương tác thời gian thực (60fps), kết nối trực tiếp với tài khoản Spotify và phát nhạc nội bộ trên trình duyệt của mọi thiết bị (Máy tính, Điện thoại, Máy tính bảng).

---

## 🌐 Đường link Sử dụng Trực tiếp

Mở ngay trên trình duyệt mà **không cần tải về, không cần cài đặt, không cần câu lệnh**:

👉 **[https://nguyenvanhoanglong478-source.github.io/Vang-Player/](https://nguyenvanhoanglong478-source.github.io/Vang-Player/)**

*(Tương thích hoàn hảo với Chrome, Safari, Edge, Firefox trên cả máy tính lẫn điện thoại iOS/Android).*

---

## ✨ Tính năng Nổi bật

### 1. Diễn họa âm thanh 3D thời gian thực (Real-time Audio Reactive Stage)
- 🌐 **Khối đốm hạt (Cluster)**: Hơn 2.400 hạt 3D co giãn, xoay và dập nảy theo từng cú đánh Kick/Bass và tần số giọng hát.
- 🏔️ **Địa hình (Ridge)**: Thác sóng phổ FFT trải dài theo tiến trình thời gian bài hát.
- 🌪️ **Xoáy hạt (Vortex)**: Quỹ đạo hạt xoắn ốc chuyển động theo năng lượng bài nhạc.
- **Thanh trượt Độ nảy sóng 3D (0% – 200%)**: Dễ dàng tùy chỉnh độ nhạy nảy của sóng âm 3D theo sở thích cá nhân.
- **Tương tác cảm ứng & Chuột**: Chạm/vuốt hoặc kéo chuột để xoay tự do mọi góc nhìn 3D trong không gian.

### 2. Trình phát nhạc chuẩn mực & Quản lý Thư viện thông minh
- **Âm thanh chuẩn xác**: Luồng âm thanh từ Spotify phát ra loa là luồng chính thức duy nhất, trong khi luồng phân tích sóng FFT chạy ngầm với âm lượng 0dB để nuôi diễn họa 3D — hoàn toàn không có hiện tượng đè tiếng.
- **Mở Album & Playlist tức thì 0ms**: Tự động gom nhóm toàn bộ Album từ danh sách bài hát trong thư viện của bạn; bấm vào bất kỳ Album hay Tuyển tập nào là mở danh sách bài và phát ngay lập tức.
- **Phát nhạc nội bộ (+ Nhạc máy)**: Hỗ trợ mở và diễn họa các tệp nhạc có sẵn trên máy tính hoặc điện thoại (`.mp3`, `.flac`, `.wav`, `.m4a`) mà không cần kết nối internet.
- **Chuyển đổi thiết bị phát (Spotify Connect)**: Dễ dàng chuyển luồng phát sang điện thoại, loa thông minh hoặc máy tính khác chỉ với 1 cú nhấp.
- **Hẹn giờ tắt nhạc (Sleep Timer)**: Tự động dừng phát nhạc sau 15, 30 hoặc 60 phút.

### 3. Giao diện Tinh gọn & Cân đối (Responsive Design)
- **Tối ưu di động & PC**: Kích thước chữ và các nút điều khiển được chuẩn hóa, phân bổ đều đặn, không tràn viền trên cả màn hình điện thoại dọc và màn hình máy tính rộng.
- **Icon hình học nhỏ gọn**: Toàn bộ nút chức năng được tối giản thành các biểu tượng SVG vuông vắn, cố định kích thước, không biến dạng.
- **Không gian tối giản**: Lược bỏ toàn bộ các thông số HUD rườm rà, tập trung 100% vào vẻ đẹp của sân khấu âm thanh 3D.

---

## 🔒 Cam kết Bảo mật & Quyền riêng tư (Zero User Data Retention)

- **100% Không lưu trữ dữ liệu người dùng (Zero-Retention)**: VANG hoạt động hoàn toàn trên trình duyệt người dùng (Client-Side), không có máy chủ trung gian, không có cơ sở dữ liệu và không sử dụng cookie theo dõi.
- **Bảo mật phiên đăng nhập trong RAM**: Mã truy cập Spotify (`access_token`) chỉ tồn tại duy nhất trong bộ nhớ tạm RAM khi tab trình duyệt đang mở. Khi bạn đóng tab hoặc bấm *Ngắt kết nối / Xóa phiên*, 100% dữ liệu bị xóa sạch hoàn toàn.
- **Chuẩn xác thực bảo mật cao OAuth 2.0 PKCE**: Đăng nhập trực tiếp qua cổng ủy quyền chính thức của Spotify với cơ chế mã hóa chống giả mạo (Anti-CSRF), tuyệt đối không bao giờ yêu cầu hay lưu mật khẩu của người dùng.
- **Chống tấn công XSS**: Toàn bộ chuỗi dữ liệu đầu vào và thông tin bài hát đều được khử khuẩn qua bộ lọc `escHtml` và `escUrl` nghiêm ngặt trước khi hiển thị.
