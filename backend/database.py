import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    # Cấu hình dự phòng cục bộ
    MONGODB_URI = "mongodb://localhost:27017"

# Khởi tạo motor client phi đồng bộ
client = AsyncIOMotorClient(MONGODB_URI)
db = client.marshaller_db

async def ping_database():
    try:
        # Gửi ping kiểm tra kết nối tới MongoDB Cloud Atlas
        await client.admin.command('ping')
        print("Connected successfully to MongoDB Cloud (Atlas)!")
        return True
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return False
