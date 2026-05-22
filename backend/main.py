import cv2
import mediapipe as mp
import numpy as np
import joblib
import socketio
import uvicorn
import base64
import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, Request, HTTPException, Depends
from tensorflow.keras.models import load_model
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

# --- CẤU HÌNH BẢO MẬT ---
AI_SECRET_KEY = os.getenv("AI_SECRET_KEY", "sk_ai_7Xq9Lm2PzR8vNc4KbY1DfH6TwS3JuE5")

# --- LOAD MODELS ---
CLASSES_PATH = os.path.join('models', 'classes.npy')
if os.path.exists(CLASSES_PATH):
    LABELS = np.load(CLASSES_PATH, allow_pickle=True).tolist()
else:
    LABELS = ['AHEAD', 'RIGHT', 'LEFT', 'STOP', 'NONE']

# Load new models (24-feature input)
try:
    dnn_model = load_model('models/dnn_pose_model.keras')
except Exception as exc:
    print(f"Failed to load DNN model: {exc}")
    dnn_model = None

try:
    rf_model = joblib.load('models/random_forest_model.pkl')
except Exception as exc:
    print(f"Failed to load RF model: {exc}")
    rf_model = None

# Khởi tạo MediaPipe Pose ở chế độ ảnh tĩnh (static_image_mode=True) để tránh lỗi xung đột luồng và timestamp mismatch khi xử lý đa luồng
mp_pose = mp.solutions.pose
pose_stream = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.7)
pose_image = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.7)

pose_stream_lock = threading.Lock()
pose_image_lock = threading.Lock()

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
def normalize_upper_body_features(features_2d: np.ndarray) -> np.ndarray:
    norm_features = features_2d.copy()
    for i in range(len(norm_features)):
        row = norm_features[i]
        neck_x, neck_y = row[22], row[23]
        if neck_x == 0 and neck_y == 0:
            continue
        ls_x, ls_y = row[10], row[11]
        rs_x, rs_y = row[12], row[13]
        shoulder_dist = np.sqrt((ls_x - rs_x) ** 2 + (ls_y - rs_y) ** 2)
        if shoulder_dist == 0:
            shoulder_dist = 1.0
        for j in range(0, 24):
            if j % 2 == 0:
                row[j] = (row[j] - neck_x) / shoulder_dist
            else:
                row[j] = (row[j] - neck_y) / shoulder_dist
        norm_features[i] = row
    return norm_features

def extract_upper_body_features(landmarks) -> np.ndarray:
    row_data = [0.0] * 24
    # Nose
    row_data[0] = landmarks[mp_pose.PoseLandmark.NOSE].x
    row_data[1] = landmarks[mp_pose.PoseLandmark.NOSE].y
    # Left / Right eye
    row_data[2] = landmarks[mp_pose.PoseLandmark.LEFT_EYE].x
    row_data[3] = landmarks[mp_pose.PoseLandmark.LEFT_EYE].y
    row_data[4] = landmarks[mp_pose.PoseLandmark.RIGHT_EYE].x
    row_data[5] = landmarks[mp_pose.PoseLandmark.RIGHT_EYE].y
    # Left / Right ear
    row_data[6] = landmarks[mp_pose.PoseLandmark.LEFT_EAR].x
    row_data[7] = landmarks[mp_pose.PoseLandmark.LEFT_EAR].y
    row_data[8] = landmarks[mp_pose.PoseLandmark.RIGHT_EAR].x
    row_data[9] = landmarks[mp_pose.PoseLandmark.RIGHT_EAR].y
    # Left / Right shoulder
    row_data[10] = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x
    row_data[11] = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y
    row_data[12] = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x
    row_data[13] = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y
    # Left / Right elbow
    row_data[14] = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].x
    row_data[15] = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].y
    row_data[16] = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].x
    row_data[17] = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW].y
    # Left / Right wrist
    row_data[18] = landmarks[mp_pose.PoseLandmark.LEFT_WRIST].x
    row_data[19] = landmarks[mp_pose.PoseLandmark.LEFT_WRIST].y
    row_data[20] = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].x
    row_data[21] = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y
    # Neck (mid-shoulder)
    row_data[22] = (row_data[10] + row_data[12]) / 2
    row_data[23] = (row_data[11] + row_data[13]) / 2

    features_2d = np.array([row_data], dtype=np.float32)
    return normalize_upper_body_features(features_2d)

def process_ai_sync(frame, model_type="dnn", pose_instance=None, flip_frame=True):
    # Flip only for live stream (mirror view). Images should keep original orientation.
    if flip_frame:
        frame = cv2.flip(frame, 1)
    
    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    active_pose = pose_instance or pose_stream
    
    # Bảo vệ việc gọi process bằng lock tương ứng để tránh xung đột luồng của MediaPipe (không thread-safe)
    if active_pose is pose_stream:
        with pose_stream_lock:
            res = active_pose.process(img_rgb)
    elif active_pose is pose_image:
        with pose_image_lock:
            res = active_pose.process(img_rgb)
    else:
        res = active_pose.process(img_rgb)
    
    points = None
    if res.pose_landmarks:
        features = extract_upper_body_features(res.pose_landmarks.landmark)
        
        model_type_clean = str(model_type).strip().lower()
        if model_type_clean == "dnn" and dnn_model is None:
            model_type_clean = "rf"

        if model_type_clean == "dnn" and dnn_model is not None:
            pred = dnn_model.predict(features, verbose=0)
            idx = np.argmax(pred)
            conf = float(pred[0][idx])
            probs = pred[0]
        elif model_type_clean == "rf" and rf_model is not None:
            probs = rf_model.predict_proba(features)[0]
            idx = int(np.argmax(probs))
            conf = float(probs[idx])
        else:
            return {"label": "NONE", "confidence": 0.0, "points": None, "allPoints": None}
            
        # Map coordinates to 400x300 canvas. Use mirrored x only when frame is flipped.
        x_ratio = (lambda v: 1 - v) if flip_frame else (lambda v: v)
        def get_pt(lm_idx):
            lm = res.pose_landmarks.landmark[lm_idx]
            return {"cx": int(x_ratio(lm.x) * 400), "cy": int(lm.y * 300)}
            
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
            
        all_points = [{"cx": int(x_ratio(lm.x) * 400), "cy": int(lm.y * 300)} for lm in res.pose_landmarks.landmark]
        
        # MediaPipe tự động swap LEFT/RIGHT khi nhận frame đã lật, không cần swap thêm
        label = LABELS[idx]
        if label == "LEFT":
            label = "RIGHT"
        elif label == "RIGHT":
            label = "LEFT"
        
        return {
            "label": label, 
            "confidence": conf, 
            "points": points, 
            "allPoints": all_points,
            "probs": probs.tolist()
        }
    return {"label": "NONE", "confidence": 0.0, "points": None, "allPoints": None}


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
        
    model_type = data.get("model", "dnn")
    frame_id = data.get("frameId")
    result = await loop.run_in_executor(executor, process_ai_sync, frame, model_type, pose_image, False)
    if frame_id is not None:
        result["frameId"] = frame_id
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
        frame_id = data.get("frameId")
        result = await loop.run_in_executor(executor, process_ai_sync, frame, model_type, pose_stream, True)
        
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
                "sensitivity": 70,
                "history": []
            }
        session = sessions[sid]
        if "history" not in session:
            session["history"] = []
            
        # 3. Lọc mượt thời gian (Temporal Smoothing / Soft Voting)
        raw_probs = result.get("probs")
        if raw_probs:
            session["history"].append(raw_probs)
            if len(session["history"]) > 5:
                session["history"].pop(0)
            
            # Trung bình cộng xác suất qua cửa sổ trượt 5 frames
            avg_probs = np.mean(session["history"], axis=0)
            idx = int(np.argmax(avg_probs))
            confidence = float(avg_probs[idx])
            label_en = LABELS[idx]
        else:
            label_en = result["label"]
            confidence = result["confidence"]

        # Đảo nhãn LEFT/RIGHT để đồng bộ với hướng trực quan của người dùng (tay trái -> LEFT, tay phải -> RIGHT)
        if label_en == "LEFT":
            label_en = "RIGHT"
        elif label_en == "RIGHT":
            label_en = "LEFT"

        # 4. Áp dụng Sensitivity thực tế làm ngưỡng lọc tin cậy (Confidence Threshold Filter)
        sensitivity = session.get("sensitivity", 70)
        confidence_threshold = 0.95 - (sensitivity / 100.0) * 0.6
        
        if confidence < confidence_threshold:
            label_en = "NONE"
            confidence = 0.0

        # Đồng bộ lại kết quả trả về
        result["label"] = label_en
        result["confidence"] = confidence
        
        gesture_map = {
            "AHEAD": "DI CHUYỂN THẲNG",
            "RIGHT": "RẼ PHẢI",
            "LEFT": "RẼ TRÁI",
            "STOP": "DỪNG LẠI",
            "NONE": "Chưa phát hiện"
        }
        gesture_vi = gesture_map.get(label_en, "Chưa phát hiện")
        
        # 5. Tính toán vật lý độ trôi máy bay (Airplane Coordinate Drift Physics)
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

        # 6. Phát telemetry_update về cho game simulator của Frontend
        telemetry = {
            "x": session["airplane_x"],
            "y": session["airplane_y"],
            "vx": session["vx"],
            "vy": session["vy"],
            "gesture": label_en,
            "confidence": confidence,
            "accuracy": accuracy,
            "speed": speed_val,
            "elapsedTime": elapsed,
            "points": result.get("points"),
            "allPoints": result.get("allPoints"),
            "frameId": frame_id
        }
        
        await sio.emit("telemetry_update", telemetry, to=sid)
        
        # Đồng thời phát sự kiện gốc để đảm bảo tương thích ngược
        if frame_id is not None:
            result["frameId"] = frame_id
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
        frame_id = data.get("frameId")
        result = await loop.run_in_executor(executor, process_ai_sync, frame, model_type, pose_image, False)
        if frame_id is not None:
            result["frameId"] = frame_id
        
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
        frame_id = data.get("frameId")
        result = await loop.run_in_executor(executor, process_ai_sync, frame, data.get("model", "dnn"), pose_stream, True)
        if frame_id is not None:
            result["frameId"] = frame_id
        await sio.emit("ai_result", result, to=sid)
    except Exception as e:
        print(f"Error in stream handling: {e}")

app.mount("/", socket_app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)