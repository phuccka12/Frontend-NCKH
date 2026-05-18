# ✈️ Aircraft Marshalling AI Training System (Hệ thống Đào tạo Điều hành Máy bay bằng AI)

Chào mừng bạn đến với mã nguồn Frontend của dự án **Nghiên cứu Khoa học (NCKH) / Khóa luận Tốt nghiệp**: **"Hệ thống Đào tạo Điều hành Máy bay thời gian thực sử dụng Trí tuệ Nhân tạo (Real-time AI Aircraft Marshalling Training System)"**.

Ứng dụng được thiết kế và xây dựng trên nền tảng **Next.js (App Router)** và **TypeScript**, tối ưu hóa giao diện người dùng (UI/UX) với phong cách **Aviation Cyber-Dark** hiện đại, kết hợp hiệu ứng glassmorphism, đèn neon và các chuyển động mượt mà. Layout được căn giữa tinh tế, kích thước cân đối lý tưởng cho các buổi thuyết trình và báo cáo.

---

## 📸 Giao diện Hệ thống & Demo

Giao diện hệ thống được chia thành 3 phân vùng chính trực quan:
1. **Bên trái (Scenario Panel)**: Danh sách 6 kịch bản huấn luyện bay được phân loại theo độ khó (Cơ bản, Trung bình, Nâng cao), kèm theo thanh đo tiến độ tổng quan.
2. **Giữa (Main Visualizer)**: Màn hình trung tâm hỗ trợ 2 chế độ hiển thị:
   - **Mô phỏng 2D (Radar Grid Simulator)**: Hiển thị tọa độ X/Y, vận tốc bay VX/VY và mô hình máy bay di chuyển hướng về vạch đỗ Gate 12 theo cử chỉ nhận diện.
   - **Camera AI (Real-time Video & Skeleton)**: Mô phỏng camera nhận diện với khung xương AI màu xanh neon (AI Body Landmarks) hoạt động khớp động với cử chỉ điều khiển.
3. **Bên phải (Telemetry HUD & Analytics)**: HUD nhận diện cử chỉ hiện hành cỡ lớn phát sáng, lưới 4 thẻ thông số thời gian thực (Độ chính xác, Tốc độ cử chỉ, Thời gian học, Độ tin cậy AI), thanh đo hiệu suất và nút chuyển đổi góc nhìn.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Framework chính**: Next.js 15+ (App Router) & React 19
* **Ngôn ngữ**: TypeScript (Type-safe hoàn toàn)
* **Styling**: Vanilla CSS Modules (Tối ưu hóa hiệu năng, kiểm soát layout tuyệt đối, không phụ thuộc TailwindCSS bên thứ ba)
* **Icons**: `lucide-react`
* **Biểu đồ thống kê**: `recharts` (Biểu đồ cột hiệu suất, biểu đồ tròn phân bổ độ khó kịch bản)
* **Real-time Engine**: `socket.io-client` (Đã cấu hình sẵn kết nối tới cổng WebSocket AI)

---

## ⚡ Hướng dẫn cài đặt & Chạy cục bộ (Quick Start)

### 1. Cài đặt các thư viện phụ thuộc
Đứng tại thư mục gốc dự án `Frontend-NCKH` và chạy lệnh:
```bash
npm install
```

### 2. Chạy ứng dụng ở chế độ Phát triển (Dev Mode)
Chạy lệnh khởi động máy chủ cục bộ:
```bash
npm run dev
```
Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

### 3. Biên dịch dự án thành phẩm (Production Build)
Lệnh kiểm tra TypeScript và tối ưu hóa tài nguyên:
```bash
npm run build
```

---

## 🔌 Cấu trúc kết nối Real-time Socket (AI Backend Integration)

Mã nguồn Frontend đã được tích hợp sẵn một React Hook tùy chỉnh cực kỳ mạnh mẽ mang tên [useSocket.ts](file:///d:/MINI%20PROJECT/Frontend-NCKH/src/hooks/useSocket.ts) nằm tại thư mục `src/hooks`.

### 1. Cơ chế hoạt động kép (Dual-Mode Engine)
* **Chế độ Ngoại tuyến (Local Fallback)**: Khi không có Server AI chạy song song, hệ thống sẽ tự động kích hoạt **Bộ giả lập chuyển động nội bộ (setInterval Tick)**. Mô hình máy bay và khung xương AI sẽ tự động di chuyển sống động và cập nhật chỉ số chính xác như một AI Server thực thụ để phục vụ mục đích demo nhanh không cần cài đặt phức tạp.
* **Chế độ Trực tuyến (Real-time Socket)**: Ngay khi phát hiện AI Server hoạt động tại cổng cấu hình (mặc định `http://localhost:5000`), Socket sẽ tự động kết nối và truyền dữ liệu thời gian thực mà không làm gián đoạn giao diện.

### 2. Định dạng dữ liệu truyền tải (Protocol Structure)
Server AI của bạn (Python Flask/FastAPI) chỉ cần lắng nghe và phát các sự kiện sau:

#### Client gửi lên Server:
* Sự kiện `start_session`: Bắt đầu phiên huấn luyện (`{ scenarioId: string }`).
* Sự kiện `video_frame`: Gửi khung hình camera ở dạng base64 (`{ frame: string }`) để phân tích cử chỉ.
* Sự kiện `pause_session` & `reset_session`: Tạm dừng và làm mới phiên học.
* Sự kiện `update_settings`: Cấu hình độ nhạy AI (`{ sensitivity: number }`).

#### Server trả về Client:
Server định kỳ phát ra sự kiện `telemetry_update` với cấu trúc JSON:
```json
{
  "x": 50,          // Tọa độ X máy bay trên canvas (0 đến 100)
  "y": 45,          // Tọa độ Y máy bay trên canvas (0 đến 100)
  "vx": 0.2,        // Vận tốc trục X
  "vy": 0.5,        // Vận tốc trục Y
  "gesture": "DI CHUYỂN THẲNG", // Tên cử chỉ nhận diện được
  "confidence": 0.88, // Độ tin cậy của AI (0.0 đến 1.0)
  "accuracy": 0.92,   // Độ chính xác tổng quan (0.0 đến 1.0)
  "speed": 15,        // Tốc độ vẩy cử chỉ (cử chỉ/phút)
  "elapsedTime": 32   // Thời gian thực hành (giây)
}
```

---

## 🐍 Mã nguồn tham khảo cho Server AI Python (Flask-SocketIO)

Dưới đây là đoạn mã Python cực kỳ tinh gọn giúp bạn dựng nhanh một Server AI Real-time kết nối thẳng với giao diện Next.js này:

```python
import time
from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

active_sessions = {}

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")

@socketio.on('start_session')
def handle_start(data):
    scenario_id = data.get('scenarioId', '1')
    print(f"Bắt đầu huấn luyện kịch bản: {scenario_id} cho client {request.sid}")
    active_sessions[request.sid] = {
        "x": 50.0, "y": 15.0, 
        "start_time": time.time(),
        "scenario": scenario_id
    }

@socketio.on('video_frame')
def handle_frame(data):
    frame_base64 = data.get('frame')
    session = active_sessions.get(request.sid)
    if not session:
        return
        
    # --- ĐÂY LÀ NƠI BẠN CHÈN MODEL AI CỦA BẠN (MediaPipe/YOLO Pose) ---
    # Ví dụ mock kết quả sau khi Model xử lý khung hình:
    detected_gesture = "DI CHUYỂN THẲNG" 
    ai_confidence = 0.91
    
    # Cập nhật vị trí máy bay dựa trên cử chỉ nhận diện được
    session["y"] = min(80.0, session["y"] + 0.5)
    
    # Gửi lại telemetry cập nhật cho Frontend
    emit('telemetry_update', {
        "x": session["x"],
        "y": session["y"],
        "vx": 0.0,
        "vy": 0.5,
        "gesture": detected_gesture,
        "confidence": ai_confidence,
        "accuracy": 0.88,
        "speed": 14,
        "elapsedTime": int(time.time() - session["start_time"])
    })

@socketio.on('reset_session')
def handle_reset():
    if request.sid in active_sessions:
        active_sessions[request.sid]["x"] = 50.0
        active_sessions[request.sid]["y"] = 15.0
        active_sessions[request.sid]["start_time"] = time.time()
        print("Đã đặt lại kịch bản thành công.")

if __name__ == '__main__':
    # Chạy server Socket IO tại cổng 5000
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

Chúc bạn hoàn thành xuất sắc dự án Nghiên cứu Khoa học và đạt kết quả cao nhất trong buổi bảo vệ! 🚀✈️
#   F r o n t e n d - N C K H  
 