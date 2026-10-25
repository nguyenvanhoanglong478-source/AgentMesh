# AgentMesh // AI Agents Swarm Visualizer

Trình trực quan hóa và mô phỏng tương tác đa tác nhân AI (Multi-Agent Swarm Simulation) với phong cách thiết kế công nghiệp tối giản (Industrial Brutalism), 100% góc vuông (`border-radius: 0px`), telemetry độ chính xác cao và hỗ trợ cổng kiểm duyệt của con người (Human-in-the-Loop Gate).

---

## Tính Năng Cốt Lõi

### 1. Canvas Sân Khấu Mạng Lưới Tác Nhân (Agent Network Canvas)
- **Mô phỏng trực quan**: Thể hiện các Agent dưới dạng các nút hình vuông công nghiệp với màu sắc vai trò đặc trưng (Orchestrator, Worker, Critic, Tool Sandbox).
- **Trạng thái sống động**: Nhịp xung phát sáng (Thinking Halo) khi Agent đang tư duy/gọi LLM, vòng sáng công cụ khi gọi API, và trạng thái hoàn thành.
- **Dòng thông điệp hạt (Particle Flow)**: Các hạt dữ liệu di chuyển dọc theo các đường cong kết nối hướng, trực quan hóa luồng trao đổi thông điệp và lời gọi subagent.
- **Tương tác**: Hỗ trợ kéo thả nút (Node Dragging), thu phóng (Zoom), lia bản đồ (Pan), và click để chọn Agent soi chiếu.

### 2. Dòng Sự Kiện Thời Gian Thực (Live Execution Event Stream)
- Khung bên trái hiển thị toàn bộ luồng sự kiện: `AGENT_SPAWN`, `LLM_PROMPT`, `THINKING_STREAM`, `TOOL_CALL`, `TOOL_RESPONSE`, `SUBAGENT_MESSAGE`, `APPROVAL`.
- Hỗ trợ thanh kéo resizer tùy biến độ rộng (double-click để reset về mặc định 380px).
- Hỗ trợ lọc tìm kiếm nhanh theo Agent, Tool, hoặc nội dung log.

### 3. Khung Soi Chiếu Chuyên Sâu (Agent Inspector & Telemetry)
- Thông tin chi tiết: Tên, Vai trò, Mô hình LLM (`Gemini 2.5 Pro`, `Claude 3.7 Sonnet`, `DeepSeek R1`, `GPT-4o`).
- **Thước đo Context Window Gauge**: Trực quan hóa số token đầu vào (Prompt Tokens) và đầu ra (Completion Tokens) so với giới hạn ngữ cảnh 128k.
- **Danh bạ Công cụ (Tool Registry)**: Danh sách các công cụ Agent được cấp quyền sử dụng.
- **Bộ nhớ làm việc (Scratchpad)** và **Chuỗi suy nghĩ gần nhất (Chain of Thought)**.

### 4. Bốn Kịch Bản Mô Phỏng Thực Tế (Simulation Scenarios)
1. **Phần mềm Đa tác nhân (Hierarchical Swarm)**: Lead Orchestrator phân rã bài toán -> Codebase Explorer rà soát AST -> Feature Architect viết code -> Unit Test Subagent chạy test -> Security QA Gate kiểm duyệt.
2. **Nghiên cứu & Đối chiếu Đa nguồn (Deep Research)**: Research Director định hướng -> 3 Agent phân tán cào arXiv, Web, GitHub -> Fact-Check Synthesizer phản biện và tổng hợp.
3. **Ứng phó Sự cố Tự động (DevOps Triage)**: Báo động 503 -> Điều tra log -> Phân tích nguyên nhân gốc -> Tạo bản vá nóng -> Kích hoạt Cổng duyệt con người trước khi deploy.
4. **Hộp Cát Tùy Biến (Custom Sandbox)**: Tự do nạp nhiệm vụ mới cho swarm hoặc kích hoạt các cổng can thiệp.

### 5. Cổng Kiểm Duyệt An Toàn (Human-in-the-Loop Approval Gate)
- Cho phép mô phỏng tạm dừng tự động khi tác nhân yêu cầu lệnh can thiệp nhạy cảm (như deploy production, xóa file hệ thống).
- Người quản trị có quyền **Chấp thuận (Approve)** hoặc **Từ chối (Reject)** trước khi swarm tiếp tục.

---

## Kiến Trúc Công Nghệ

- **Zero-Dependency**: 100% thuần HTML5, Canvas 2D, Modern CSS3 và ES6 Modules. Không cần Node.js, không cần bundling/transpilation.
- **PWA Ready**: Hỗ trợ Service Worker Cache (`sw.js`) và `manifest.webmanifest` để chạy offline và cài đặt dạng ứng dụng máy tính/điện thoại.
- **Tương thích toàn diện**: Chạy mượt mà trên Desktop và Responsive Mobile Drawer.

---

## Hướng Dẫn Sử Dụng

1. Mở trực tiếp file `index.html` trên trình duyệt bất kỳ (Chrome, Edge, Firefox, Safari).
2. Bấm nút **Phát** ở thanh điều khiển đáy để khởi chạy mô phỏng.
3. Bấm vào bất kỳ Agent nào trên Canvas để mở Telemetry Inspector.
4. Chọn kịch bản từ thanh Topbar để trải nghiệm các mô hình phân rã nhiệm vụ khác nhau.
5. Bấm **+ Nạp nhiệm vụ** để gửi lệnh mới cho bầy tác nhân.

---

## Kiểm Thử Tự Động

Chạy bộ kiểm thử tự động toàn diện qua Playwright:
```bash
python tests/test_agent_visualizer.py
```
*(Kết quả: 10/10 danh mục kiểm thử đạt chuẩn 100% với 0 lỗi console)*.
