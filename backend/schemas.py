from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    full_name: str = Field(..., min_length=1)
    email: str = Field(default="", max_length=100)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    username: str
    full_name: str
    email: str
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ScenarioResponse(BaseModel):
    id: str
    name: str
    description: str
    difficulty: str
    difficulty_text: str
    duration: str
    expected_gestures: List[str]

class TrainingHistoryCreate(BaseModel):
    scenario_id: str
    score: int
    elapsed_time: int
    completed: bool = True

class TrainingHistoryResponse(BaseModel):
    id: str
    user_id: str
    scenario_id: str
    score: int
    elapsed_time: int
    completed: bool
    created_at: datetime

class UserSettingsUpdate(BaseModel):
    sensitivity: Optional[int] = None
    selected_model: Optional[str] = None
    enable_skeleton: Optional[bool] = None
    socket_url: Optional[str] = None

class UserSettingsResponse(BaseModel):
    user_id: str
    sensitivity: int
    selected_model: str
    enable_skeleton: bool
    socket_url: str

class DetailEvaluationCreate(BaseModel):
    gesture_name: str
    sequence_index: int
    score: int
    elapsed_time: int
    completed: bool = True

class DetailEvaluationResponse(BaseModel):
    id: str
    history_id: str
    user_id: str
    scenario_id: str
    gesture_name: str
    sequence_index: int
    score: int
    elapsed_time: int
    completed: bool
    created_at: datetime
