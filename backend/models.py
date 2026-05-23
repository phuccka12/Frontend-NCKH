from pydantic import BaseModel, Field, GetCoreSchemaHandler, ConfigDict
from pydantic_core import core_schema
from bson import ObjectId
from typing import List, Optional, Any
from datetime import datetime

# Helper class để map MongoDB '_id' (ObjectId) sang chuỗi Pydantic và ngược lại trong Pydantic V2
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(lambda x: ObjectId(x)),
                ]),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

class UserDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    username: str
    hashed_password: str
    full_name: str
    email: str = ""
    role: str = "student"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScenarioDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )
    
    id: str = Field(..., alias="_id") # Giữ nguyên ID dạng chuỗi '1', '2', '3' như hệ thống cũ
    name: str
    description: str
    difficulty: str
    difficulty_text: str
    duration: str
    expected_gestures: List[str]

class TrainingHistoryDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    scenario_id: str
    score: int
    elapsed_time: int
    completed: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserSettingsDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: PyObjectId
    sensitivity: int = 70
    selected_model: str = "dnn"
    enable_skeleton: bool = True
    socket_url: str = "http://localhost:8000"

class DetailEvaluationDocument(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    history_id: PyObjectId
    user_id: PyObjectId
    scenario_id: str
    gesture_name: str
    sequence_index: int
    score: int
    elapsed_time: int
    completed: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
