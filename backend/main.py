import cv2
import mediapipe as mp
import numpy as np
import joblib
import socketio
import uvicorn
import base64
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, Request, HTTPException, Depends
from tensorflow.keras.models import load_model
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

# --- CẤU HÌNH BẢO MẬT ---
AI_SECRET_KEY = os.getenv("AI_SECRET_KEY")

# --- LOAD MODELS ---
LABELS = ['AHEAD', 'RIGHT', 'LEFT', 'STOP', 'NONE']
dnn_model = load_model('models/marshaller_model_dnn.h5')
rf_model = joblib.load('models/marshaller_model_rf.pkl')

# Khởi tạo MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.7)

# Khởi tạo ThreadPool để xử lý các tác vụ nặng (CPU-bound) như AI và decode ảnh
executor = ThreadPoolExecutor(max_workers=4) 

# --- KHỞI TẠO SERVER ---
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
socket_app = socketio.ASGIApp(sio)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LOGIC XỬ LÝ AI (Hàm đồng bộ thuần túy) ---
def process_ai_sync(frame, model_type="dnn"):
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = pose.process(img_rgb)
    
    points = None
    if res.pose_landmarks:
        lms = [[lm.x, lm.y, lm.z, lm.visibility] for lm in res.pose_landmarks.landmark]
        features = np.array(lms).flatten().reshape(1, -1)
        
        if model_type == "dnn":
            pred = dnn_model.predict(features, verbose=0)
            idx = np.argmax(pred)
            conf = float(pred[0][idx])
        else:
            idx = int(rf_model.predict(features)[0])
            conf = float(np.max(rf_model.predict_proba(features)))
            
        # Tính toán tọa độ các khớp xương cho Frontend hiển thị khung xương (400x300 canvas)
        # Giao diện camera trên web bị lật ngược (scaleX(-1)), nên ta tính toán: cx = (1 - lm.x) * 400 để khớp tự nhiên
        def get_pt(lm_idx):
            lm = res.pose_landmarks.landmark[lm_idx]
            return {"cx": int((1 - lm.x) * 400), "cy": int(lm.y * 300)}
            
        try:
            head = get_pt(0)    # Nose
            l_sh = get_pt(11)   # Left Shoulder
            r_sh = get_pt(12)   # Right Shoulder
            l_el = get_pt(13)   # Left Elbow
            r_el = get_pt(14)   # Right Elbow
            l_wr = get_pt(15)   # Left Wrist
            r_wr = get_pt(16)   # Right Wrist
            l_hp = get_pt(23)   # Left Hip
            r_hp = get_pt(24)   # Right Hip
            
            neck = {"cx": (l_sh["cx"] + r_sh["cx"]) // 2, "cy": (l_sh["cy"] + r_sh["cy"]) // 2}
            pelvis = {"cx": (l_hp["cx"] + r_hp["cx"]) // 2, "cy": (l_hp["cy"] + r_hp["cy"]) // 2}
            
            points = {
                "head": head,
                "neck": neck,
                "pelvis": pelvis,
                "lShoulder": l_sh,
                "rShoulder": r_sh,
                "lElbow": l_el,
                "rElbow": r_el,
                "lWrist": l_wr,
                "rWrist": r_wr
            }
        except Exception:
            pass
            
        return {"label": LABELS[idx], "confidence": conf, "points": points}
    return {"label": "NONE", "confidence": 0.0, "points": None}


# --- HÀM BỔ TRỢ GIẢI MÃ ẢNH (Tránh block thread chính) ---
def decode_base64_image(base64_string):
    try:
        encoded_data = base64_string.split(",")[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception:
        return None

# --- MIDDLEWARE XÁC THỰC ---
def verify_secret_key(request: Request):
    key = request.headers.get("x-api-key")
    if key != AI_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid Key")

# --- ROUTES HTTP (Cho Axios) ---
@app.post("/predict-image")
async def predict_image(data: dict, _=Depends(verify_secret_key)):
    loop = asyncio.get_running_loop()
    
    # Chạy decode ảnh và predict trong ThreadPool để không nghẽn Event Loop
    frame = await loop.run_in_executor(executor, decode_base64_image, data.get("image"))
    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image data")
        
    result = await loop.run_in_executor(executor, process_ai_sync, frame, data.get("model", "dnn"))
    return result

import time

# --- QUẢN LÝ PHIÊN LÀM VIỆC (Dành cho Next.js Game Simulation) ---
sessions = {}

# --- ROUTES SOCKET.IO (Cho Realtime) ---
@sio.event
async def connect(sid, environ, auth):
    token = auth.get("token") if auth else None
    
    if not token:
        import urllib.parse
        query_string = environ.get('QUERY_STRING', '')
        params = urllib.parse.parse_qs(query_string)
        token = params.get('token', [None])[0]

    # Cho phép kết nối không cần token khi chạy cục bộ ở môi trường phát triển (hoặc AI_SECRET_KEY là None/Rỗng)
    if not AI_SECRET_KEY or token == AI_SECRET_KEY or not token:
        print(f"Authorized sid: {sid} (Token: {token})")
        # Khởi tạo session mặc định cho client
        sessions[sid] = {
            "scenario_id": "1",
            "is_running": False,
            "airplane_x": 50.0,
            "airplane_y": 15.0,
            "vx": 0.0,
            "vy": 0.0,
            "elapsed_time": 0,
            "start_time": time.time(),
            "sensitivity": 70
        }
        return True
    else:
        print(f"Connection refused for sid: {sid}")
        return False

@sio.event
async def disconnect(sid):
    if sid in sessions:
        del sessions[sid]
        print(f"Cleaned up session for disconnected sid: {sid}")

@sio.on("start_session")
async def start_session(sid, data):
    scenario_id = data.get("scenarioId", "1")
    sessions[sid] = {
        "scenario_id": scenario_id,
        "is_running": True,
        "airplane_x": 50.0,
        "airplane_y": 15.0,
        "vx": 0.0,
        "vy": 0.0,
        "elapsed_time": 0,
        "start_time": time.time(),
        "sensitivity": sessions.get(sid, {}).get("sensitivity", 70)
    }
    print(f"Started simulation session for sid: {sid}, Scenario: {scenario_id}")

@sio.on("pause_session")
async def pause_session(sid):
    if sid in sessions and sessions[sid]["is_running"]:
        sessions[sid]["is_running"] = False
        sessions[sid]["elapsed_time"] += int(time.time() - sessions[sid]["start_time"])
        print(f"Paused simulation session for sid: {sid}")

@sio.on("reset_session")
async def reset_session(sid):
    if sid in sessions:
        sessions[sid].update({
            "is_running": False,
            "airplane_x": 50.0,
            "airplane_y": 15.0,
            "vx": 0.0,
            "vy": 0.0,
            "elapsed_time": 0,
            "start_time": time.time()
        })
        print(f"Reset simulation session for sid: {sid}")

@sio.on("update_settings")
async def update_settings(sid, data):
    if sid in sessions:
        sensitivity = data.get("sensitivity", 70)
        sessions[sid]["sensitivity"] = sensitivity
        print(f"Updated AI sensitivity to {sensitivity}% for sid: {sid}")

@sio.on("video_frame")
async def handle_video_frame(sid, data):
    """
    Nhận frame video (Base64) từ Next.js Frontend, chạy dự đoán AI,
    tính toán độ trôi tọa độ của máy bay dựa trên hành động và gửi lại telemetry.
    """
    try:
        loop = asyncio.get_running_loop()
        
        # 1. Giải mã ảnh phi đồng bộ
        frame = await loop.run_in_executor(executor, decode_base64_image, data.get("frame"))
        if frame is None:
            return

        # 2. Xử lý AI phi đồng bộ (Chạy ngầm trong ThreadPool)
        model_type = data.get("model", "dnn")
        result = await loop.run_in_executor(executor, process_ai_sync, frame, model_type)
        
        # Lấy session của client
        if sid not in sessions:
            sessions[sid] = {
                "scenario_id": "1",
                "is_running": False,
                "airplane_x": 50.0,
                "airplane_y": 15.0,
                "vx": 0.0,
                "vy": 0.0,
                "elapsed_time": 0,
                "start_time": time.time(),
                "sensitivity": 70
            }
        session = sessions[sid]
        
        # 3. Bản đồ hóa nhãn dự đoán sang Tiếng Việt cho Frontend hiển thị trên HUD
        label_en = result["label"]  # 'AHEAD', 'RIGHT', 'LEFT', 'STOP', 'NONE'
        confidence = result["confidence"]
        
        gesture_map = {
            "AHEAD": "DI CHUYỂN THẲNG",
            "RIGHT": "RẼ PHẢI",
            "LEFT": "RẼ TRÁI",
            "STOP": "DỪNG LẠI",
            "NONE": "Chưa phát hiện"
        }
        gesture_vi = gesture_map.get(label_en, "Chưa phát hiện")
        
        # 4. Tính toán vật lý độ trôi máy bay (Airplane Coordinate Drift Physics)
        vx, vy = 0.0, 0.0
        if session["is_running"]:
            if label_en == "AHEAD":
                vy = 1.2
                vx = 0.0
                session["airplane_y"] += vy
            elif label_en == "LEFT":
                vy = 1.2
                vx = -0.7
                session["airplane_x"] = max(25.0, session["airplane_x"] - 0.7)
                session["airplane_y"] += vy
            elif label_en == "RIGHT":
                vy = 1.2
                vx = 0.7
                session["airplane_x"] = min(75.0, session["airplane_x"] + 0.7)
                session["airplane_y"] += vy
            elif label_en == "STOP":
                vy = 0.0
                vx = 0.0
            else:  # NONE
                vy = 0.5  # Trôi chậm về phía trước
                vx = 0.0
                session["airplane_y"] += vy
                
            session["vx"] = vx
            session["vy"] = vy

        # Tính toán thời gian tích lũy
        elapsed = session["elapsed_time"]
        if session["is_running"]:
            elapsed += int(time.time() - session["start_time"])
            
        # Tính toán các chỉ số HUD
        accuracy = confidence * 0.98 if label_en != "NONE" else 0.0
        speed_val = int(vy * 15)  # Quy đổi vận tốc sang đơn vị hiển thị

        # 5. Phát telemetry_update về cho game simulator của Frontend
        telemetry = {
            "x": session["airplane_x"],
            "y": session["airplane_y"],
            "vx": session["vx"],
            "vy": session["vy"],
            "gesture": gesture_vi,
            "confidence": confidence,
            "accuracy": accuracy,
            "speed": speed_val,
            "elapsedTime": elapsed,
            "points": result.get("points")
        }
        
        await sio.emit("telemetry_update", telemetry, to=sid)
        
        # Đồng thời phát sự kiện gốc để đảm bảo tương thích ngược
        await sio.emit("ai_result", result, to=sid)
        
    except Exception as e:
        print(f"Error in video_frame handling: {e}")

@sio.on("predict_image_static")
async def predict_image_static(sid, data):
    """
    Nhận ảnh tĩnh từ người dùng tải lên, chạy dự đoán AI (không ảnh hưởng giả lập máy bay)
    và trả về nhãn nhận diện, độ tin cậy và khung xương skeleton.
    """
    try:
        loop = asyncio.get_running_loop()
        frame = await loop.run_in_executor(executor, decode_base64_image, data.get("image"))
        if frame is None:
            return
            
        model_type = data.get("model", "dnn")
        result = await loop.run_in_executor(executor, process_ai_sync, frame, model_type)
        
        # Trả về kết quả trực tiếp cho client
        await sio.emit("predict_image_static_response", result, to=sid)
        print(f"Static image predicted: {result['label']} ({result['confidence']:.2f}) using {model_type} for sid: {sid}")
    except Exception as e:
        print(f"Error in predict_image_static handling: {e}")

@sio.on("stream_frame")
async def handle_stream(sid, data):
    """
    Tương thích ngược: Nhận frame từ webcam dạng phi tập trung qua ThreadPoolExecutor
    """
    try:
        loop = asyncio.get_running_loop()
        frame = await loop.run_in_executor(executor, decode_base64_image, data["image"])
        if frame is None:
            return
        result = await loop.run_in_executor(executor, process_ai_sync, frame, data.get("model", "dnn"))
        await sio.emit("ai_result", result, to=sid)
    except Exception as e:
        print(f"Error in stream handling: {e}")

app.mount("/", socket_app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)