from database import db
from models import UserDocument, ScenarioDocument, TrainingHistoryDocument, UserSettingsDocument, DetailEvaluationDocument, PyObjectId
import bcrypt
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

# --- USER CRUD ---
async def get_user_by_id(user_id: str) -> Optional[dict]:
    if not ObjectId.is_valid(user_id):
        return None
    return await db.users.find_one({"_id": ObjectId(user_id)})

async def get_user_by_username(username: str) -> Optional[dict]:
    return await db.users.find_one({"username": username.strip().lower()})

async def create_user(username: str, password_in: str, full_name: str, email: str = "") -> dict:
    username_clean = username.strip().lower()
    hashed = hash_password(password_in)
    
    user_doc = {
        "username": username_clean,
        "hashed_password": hashed,
        "full_name": full_name,
        "email": email,
        "role": "student",
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    # Khởi tạo luôn UserSettings mặc định cho học viên mới
    await db.user_settings.insert_one({
        "user_id": result.inserted_id,
        "sensitivity": 70,
        "selected_model": "dnn",
        "enable_skeleton": True,
        "socket_url": "http://localhost:8000"
    })
    
    return user_doc

# --- SCENARIO CRUD ---
async def get_scenarios() -> List[dict]:
    cursor = db.scenarios.find()
    return await cursor.to_list(length=100)

async def create_scenario(scenario_data: dict) -> dict:
    # scenario_data['id'] sẽ được dùng trực tiếp làm _id (ví dụ: '1', '2'...)
    scenario_doc = {
        "_id": scenario_data["id"],
        "name": scenario_data["name"],
        "description": scenario_data["description"],
        "difficulty": scenario_data["difficulty"],
        "difficulty_text": scenario_data["difficulty_text"],
        "duration": scenario_data["duration"],
        "expected_gestures": scenario_data["expected_gestures"]
    }
    await db.scenarios.replace_one({"_id": scenario_doc["_id"]}, scenario_doc, upsert=True)
    return scenario_doc

# --- TRAINING HISTORY CRUD ---
async def save_history(user_id: str, scenario_id: str, score: int, elapsed_time: int, completed: bool = True) -> dict:
    history_doc = {
        "user_id": ObjectId(user_id),
        "scenario_id": str(scenario_id),
        "score": score,
        "elapsed_time": elapsed_time,
        "completed": completed,
        "created_at": datetime.utcnow()
    }
    result = await db.training_history.insert_one(history_doc)
    history_doc["_id"] = result.inserted_id
    return history_doc

async def get_user_history(user_id: str) -> List[dict]:
    if not ObjectId.is_valid(user_id):
        return []
    cursor = db.training_history.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    return await cursor.to_list(length=200)

# --- USER SETTINGS CRUD ---
async def get_user_settings(user_id: str) -> Optional[dict]:
    if not ObjectId.is_valid(user_id):
        return None
    settings = await db.user_settings.find_one({"user_id": ObjectId(user_id)})
    if not settings:
        # Nếu chưa có, tự tạo mặc định
        settings = {
            "user_id": ObjectId(user_id),
            "sensitivity": 70,
            "selected_model": "dnn",
            "enable_skeleton": True,
            "socket_url": "http://localhost:8000"
        }
        result = await db.user_settings.insert_one(settings)
        settings["_id"] = result.inserted_id
    return settings

async def update_user_settings(user_id: str, update_data: dict) -> Optional[dict]:
    if not ObjectId.is_valid(user_id):
        return None
    
    # Lọc bỏ các giá trị None
    clean_update = {k: v for k, v in update_data.items() if v is not None}
    if not clean_update:
        return await get_user_settings(user_id)
        
    await db.user_settings.update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": clean_update},
        upsert=True
    )
    return await get_user_settings(user_id)

# --- DETAIL EVALUATIONS CRUD ---
async def save_detail_evaluation(
    history_id: str,
    user_id: str,
    scenario_id: str,
    gesture_name: str,
    sequence_index: int,
    score: int,
    elapsed_time: int,
    completed: bool = True
) -> dict:
    detail_doc = {
        "history_id": ObjectId(history_id),
        "user_id": ObjectId(user_id),
        "scenario_id": str(scenario_id),
        "gesture_name": str(gesture_name),
        "sequence_index": int(sequence_index),
        "score": int(score),
        "elapsed_time": int(elapsed_time),
        "completed": completed,
        "created_at": datetime.utcnow()
    }
    result = await db.detail_evaluations.insert_one(detail_doc)
    detail_doc["_id"] = result.inserted_id
    return detail_doc

async def get_detail_evaluations_by_history(history_id: str) -> List[dict]:
    if not ObjectId.is_valid(history_id):
        return []
    cursor = db.detail_evaluations.find({"history_id": ObjectId(history_id)}).sort("sequence_index", 1)
    return await cursor.to_list(length=100)

async def get_user_detail_evaluations(user_id: str) -> List[dict]:
    if not ObjectId.is_valid(user_id):
        return []
    cursor = db.detail_evaluations.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    return await cursor.to_list(length=1000)
