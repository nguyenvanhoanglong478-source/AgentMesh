# VANG — Không gian âm thanh 3D liên kết Spotify (Web, Mobile PWA & Windows App)

**VANG** là ứng dụng phát nhạc đa nền tảng liên kết tài khoản Spotify trên Điện thoại và Máy tính/Laptop, kết hợp giao diện biên tập tối giản với hoạt ảnh 3D **Khối đốm hạt** phản hồi âm thanh thời gian thực (60fps).

---

## Truy cập & Tải về trực tiếp (Không cần dùng câu lệnh)

1. **Dùng thẳng trên Website (Điện thoại & Máy tính)**:
   - Mở trực tiếp: **[https://nguyenvanhoanglong478-source.github.io/Vang-Player/](https://nguyenvanhoanglong478-source.github.io/Vang-Player/)**
   - Trên Điện thoại (iOS/Android) hoặc PC: bấm nút **Tải ứng dụng → Cài đặt ngay** ngay trên giao diện web để thêm biểu tượng VANG ra màn hình chính như một ứng dụng độc lập.
2. **Tải Ứng dụng độc lập cho Windows (`VANG.exe`)**:
   - Tải trực tiếp: **[Tải VANG.exe (100 KB — Portable)](https://github.com/nguyenvanhoanglong478-source/Vang-Player/raw/main/VANG.exe)**
   - Chỉ cần tải về và **nhấp đúp chuột vào `VANG.exe`** để mở ngay cửa sổ ứng dụng riêng biệt (không cần cài đặt Python/Node, không cần gõ lệnh).
3. **Tải bản Offline 1 tệp duy nhất (`index.html`)**:
   - Tải trực tiếp: **[Tải VANG-Offline (index.html)](https://github.com/nguyenvanhoanglong478-source/Vang-Player/raw/main/index.html)**

---

## Điểm nhấn thiết kế & Tính năng

- **Hoạt ảnh 3D phản hồi âm thanh thời gian thực (60fps)**:
  - **Khối đốm hạt (`cluster`)**: 2.400 hạt điểm 3D phân bố trên các lớp cầu Fibonacci, biến dạng bề mặt theo dải tần số Bass / Mid / High (FFT), có hiệu ứng chiều sâu trường ảnh (Bokeh) và cho phép xoay 360° bằng chuột hoặc cảm ứng.
  - **Địa hình (`ridge`)**: 34 đường đồng mức địa hình âm thanh dịch chuyển theo lịch sử phổ tần số.
  - **Xoáy hạt (`vortex`)**: Quỹ đạo hạt xoắn ốc 3D tăng tốc theo nhịp độ và năng lượng bài hát.
- **Nút tác vụ hình học cổ điển & Điều hướng chữ biên tập**:
  - Các nút điều khiển phát nhạc giữ biểu tượng hình học trực quan: **Phát** (tam giác), **Tạm dừng** (hai vạch song song), **Chuyển bài trước/sau**, **Trộn bài (Shuffle)**, **Lặp bài (Repeat)** và **Âm lượng/Tắt tiếng**.
  - Màu nhấn `--acc` tự động trích xuất và chuyển màu mượt theo ảnh bìa từng bài hát.
- **Liên kết Spotify trên Điện thoại & Laptop**:
  - Xác thực trực tiếp trên trình duyệt qua **Spotify OAuth 2.0 PKCE**.
  - Phát nhạc trực tiếp qua **Spotify Web Playback SDK** và chuyển tiếp âm thanh qua lại giữa **Điện thoại** và **Laptop** qua **Spotify Connect API**.
  - Tích hợp sẵn **Bộ tổng hợp âm thanh WebAudio (Demo Mode)** và chế độ **Thu âm trực tiếp (Micro/Loopback)** để hoạt ảnh 3D hoạt động ngay lập tức kể cả khi chưa đăng nhập.

---

## Cách liên kết tài khoản Spotify cá nhân

1. Mở ứng dụng VANG (trên Website hoặc qua `VANG.exe`), bấm **Kết nối Spotify** ở góc trên bên phải.
2. Sao chép địa chỉ **Redirect URI** hiển thị sẵn trong hộp thoại, thêm vào ứng dụng của bạn trên [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
3. Dán **Spotify Client ID** vào ô nhập và bấm **Đăng nhập Spotify**.
