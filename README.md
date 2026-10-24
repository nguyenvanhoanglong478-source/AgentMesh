# VANG — Không gian âm thanh 3D liên kết Spotify (Android `.APK`, Windows `.EXE` & Web)

**VANG (v1.2.0)** là ứng dụng phát nhạc đa nền tảng liên kết tài khoản Spotify trên Điện thoại và Máy tính/Laptop, kết hợp giao diện tối giản với hoạt ảnh 3D **Khối đốm hạt**, **Địa hình phổ FFT** và **Xoáy hạt** phản hồi âm thanh thời gian thực (60fps).

---

## Đường link Sử dụng & Tải về trực tiếp

1. **Dùng thẳng trên Website (Điện thoại & Máy tính)**:
   - 👉 **[https://nguyenvanhoanglong478-source.github.io/Vang-Player/](https://nguyenvanhoanglong478-source.github.io/Vang-Player/)**
2. **Tải Ứng dụng Android độc lập (`VANG.apk`)**:
   - 👉 **[Tải trực tiếp VANG.apk (Android)](https://github.com/nguyenvanhoanglong478-source/Vang-Player/releases/latest/download/VANG.apk)**
   - Hỗ trợ điều khiển nhạc trên màn hình khóa & thanh thông báo Android, tai nghe Bluetooth, phát nhạc nội bộ từ bộ nhớ máy (`.mp3`, `.flac`, `.wav`, `.m4a`), hẹn giờ tắt nhạc, giữ sáng màn hình và tự động báo khi có bản cập nhật mới trên GitHub.
3. **Tải Ứng dụng Windows độc lập (`VANG.exe`)**:
   - 👉 **[Tải trực tiếp VANG.exe (Windows Portable)](https://github.com/nguyenvanhoanglong478-source/Vang-Player/releases/latest/download/VANG.exe)**
   - Tệp thực thi duy nhất (~160 KB), nhấp đúp chuột là mở cửa sổ ứng dụng riêng biệt mà không cần cài đặt hay dùng câu lệnh.
4. **Trang phát hành chính thức (GitHub Releases)**:
   - 👉 **[https://github.com/nguyenvanhoanglong478-source/Vang-Player/releases/latest](https://github.com/nguyenvanhoanglong478-source/Vang-Player/releases/latest)**

---

## Cam kết Bảo mật & Quyền riêng tư (Zero User Data Retention)

- **Không lưu trữ dữ liệu người dùng (Zero-Retention)**: VANG không có máy chủ trung gian, không dùng cơ sở dữ liệu, không dùng cookie hay công cụ theo dõi. Mã phiên đăng nhập Spotify (`access_token`) chỉ tồn tại duy nhất trong **bộ nhớ tạm RAM (`memoryToken`)** khi ứng dụng đang mở và tự động xóa sạch 100% ngay khi đóng ứng dụng hoặc bấm *Ngắt kết nối*.
- **Nguyên tắc quyền tối thiểu (Least Privilege)**: Không yêu cầu quyền đọc email cá nhân (`user-read-email`).
- **Chống tấn công XSS / CSRF**: Áp dụng chuẩn **OAuth 2.0 PKCE (SHA-256)** kèm khóa xác thực trạng thái `state` chống giả mạo yêu cầu (Anti-CSRF), chính sách `Content-Security-Policy (CSP)` nghiêm ngặt, `Referrer-Policy: no-referrer` và lọc ký tự an toàn (`escHtml`/`escUrl`) trên toàn bộ dữ liệu hiển thị.
