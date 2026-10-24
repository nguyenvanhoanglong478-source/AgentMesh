# VANG — Không gian âm thanh 3D liên kết Spotify (Android `.APK`, Windows `.EXE` & Web)

**VANG (v1.2.0)** là ứng dụng phát nhạc 3D đa nền tảng kết hợp hoạt ảnh diễn họa hình thái học thời gian thực (60fps) với tài khoản Spotify và kho nhạc nội bộ trên điện thoại & máy tính.

---

## 🚀 Đường link Sử dụng & Tải về trực tiếp

1. **Dùng trực tiếp trên Website (Điện thoại & Máy tính)**:
   - 👉 **[https://nguyenvanhoanglong478-source.github.io/Vang-Player/](https://nguyenvanhoanglong478-source.github.io/Vang-Player/)**
   *(Chạy trên mọi trình duyệt Chrome, Edge, Safari, Firefox. Hỗ trợ thêm vào màn hình chính PWA).*

2. **Tải Ứng dụng Android độc lập (`VANG.apk`)**:
   - 👉 **[Tải trực tiếp VANG.apk (Android)](https://github.com/nguyenvanhoanglong478-source/Vang-Player/releases/latest/download/VANG.apk)**
   - Đã tích hợp chữ ký số xác thực tên miền (*Digital Asset Links*), chạy toàn màn hình (full-screen) không có thanh địa chỉ trình duyệt.
   - Hỗ trợ đầy đủ tính năng của một ứng dụng nghe nhạc Android: điều khiển trên màn hình khóa & thanh thông báo (`MediaSession`), hẹn giờ tắt nhạc (Sleep Timer), giữ sáng màn hình khi diễn họa 3D, đọc nhạc từ bộ nhớ máy (`+ Nhạc máy`), và tự động thông báo khi có bản cập nhật mới trên GitHub.

3. **Tải Ứng dụng Windows độc lập (`VANG.exe`)**:
   - 👉 **[Tải trực tiếp VANG.exe (Windows Portable)](https://github.com/nguyenvanhoanglong478-source/Vang-Player/releases/latest/download/VANG.exe)**
   - Tệp thực thi duy nhất (~180 KB), nhấp đúp là mở cửa sổ ứng dụng riêng biệt, không cần cài đặt.

4. **Trang phát hành chính thức (GitHub Releases)**:
   - 👉 **[https://github.com/nguyenvanhoanglong478-source/Vang-Player/releases/latest](https://github.com/nguyenvanhoanglong478-source/Vang-Player/releases/latest)**

---

## ✨ Điểm nổi bật & Cập nhật mới nhất (v1.2.0)

### 1. Âm thanh chuẩn mực — Đã xử lý dứt điểm lỗi đè tiếng
- Loại bỏ hoàn toàn hiện tượng 1 bài hát phát 2 lần đè lên nhau: Luồng âm thanh từ Spotify phát ra loa là luồng chính thức duy nhất, trong khi luồng phân tích sóng FFT chạy ngầm với âm lượng 0dB để nuôi diễn họa 3D.
- Hỗ trợ phát nhạc offline từ bộ nhớ thiết bị (`.mp3`, `.flac`, `.wav`, `.m4a`) qua nút **+ Nhạc máy**.

### 2. Không gian diễn họa 3D phản hồi nhịp điệu thời gian thực
- **3 Hình thái 3D**:
  - 🌐 **Khối đốm hạt (Cluster)**: Hơn 2.400 hạt 3D co giãn, xoay và dập nảy theo từng cú đánh Kick/Bass và tần số giọng hát.
  - 🏔️ **Địa hình (Ridge)**: Thác sóng phổ âm thanh trải dài theo thời gian bài hát.
  - 🌪️ **Xoáy hạt (Vortex)**: Quỹ đạo hạt xoắn ốc chuyển động theo năng lượng bài nhạc.
- **Thanh trượt Độ nảy sóng 3D (0% – 200%)**: Dễ dàng tùy chỉnh mức độ phản hồi âm thanh mạnh hay nhẹ theo sở thích.
- **Thao tác cảm ứng**: Chạm/vuốt xoay góc nhìn 3D mượt mà trên màn hình cảm ứng điện thoại lẫn chuột máy tính.

### 3. Tối ưu giao diện Di động & Máy tính
- **Icon hình học nhỏ gọn**: Chuyển đổi các nút chế độ 3D và nguồn sóng âm thành các biểu tượng SVG tối giản, cố định kích thước, không bị méo lệch.
- **Cân đối chữ & Bố cục**: Kích thước chữ được chuẩn hóa, phân bổ đều đặn, không tràn viền trên cả màn hình điện thoại dọc và màn hình máy tính rộng.
- **Mở Tuyển tập & Album tức thì 0ms**: Tự động gom nhóm toàn bộ Album từ danh sách bài hát trong thư viện của bạn; bấm vào bất kỳ Album hay Tuyển tập nào là mở danh sách bài và phát ngay lập tức.
- **Lược bỏ thông tin rườm rà**: Giữ không gian sân khấu 3D sạch sẽ, thoáng đãng, chỉ hiển thị thông tin bài hát và hình thái âm thanh.

---

## 🔒 Cam kết Bảo mật & Quyền riêng tư (Zero-Retention)

- **Không lưu thông tin cá nhân**: VANG không có máy chủ trung gian (Zero-Backend), không có cơ sở dữ liệu và không dùng cookie theo dõi.
- **Bộ nhớ tạm RAM**: Phiên đăng nhập Spotify (`access_token`) chỉ lưu trong bộ nhớ tạm khi ứng dụng đang mở. Khi bạn đóng ứng dụng hoặc bấm *Ngắt kết nối*, 100% dữ liệu phiên được xóa sạch khỏi thiết bị.
- **Chuẩn xác thực OAuth 2.0 PKCE**: Đăng nhập trực tiếp với Spotify qua cơ chế xác thực mã hóa an toàn, không yêu cầu người dùng cung cấp mật khẩu tài khoản cho ứng dụng.
- **Chống mã độc & XSS**: Lọc mã HTML/URL an toàn (`escHtml`, `escUrl`), không chèn mã ngoài độc hại.

---

## 🛠️ Dành cho lập trình viên: Biên dịch ứng dụng Android Native thuần

Mã nguồn ứng dụng Android Native hoàn chỉnh đã được tạo sẵn trong thư mục [`android/`](android/):
- `android/app/src/main/java/com/vang/player/MainActivity.java`: Activity độc lập nạp trực tiếp tài nguyên offline `file:///android_asset/index.html`.
- `android/app/src/main/assets/`: Chứa toàn bộ giao diện, âm thanh và mã nguồn đóng gói sẵn.
- `android/app/src/main/AndroidManifest.xml`: Khai báo quyền hệ điều hành Android.

**Cách xuất file APK Native bằng Android Studio**:
1. Mở **Android Studio**.
2. Chọn **Open** -> Trỏ tới thư mục `android/` của dự án.
3. Chọn menu **Build > Build Bundle(s) / APK(s) > Build APK(s)** để xuất file `.apk` native.
