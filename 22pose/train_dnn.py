import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping

DATA_DIR = "processed_npy_data"
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
classes = np.load(os.path.join(DATA_DIR, 'classes.npy'), allow_pickle=True)

# Khởi tạo kiến trúc mạng nơ-ron phẳng thu hẹp (24 đặc trưng), bổ sung tỉ lệ Dropout lớn để chống overfitting ảnh tĩnh
model = Sequential([
    Dense(128, activation='relu', input_shape=(24,)), 
    BatchNormalization(),
    Dropout(0.4),
    
    Dense(64, activation='relu'),
    BatchNormalization(),
    Dropout(0.3),
    
    Dense(32, activation='relu'),
    Dense(len(classes), activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
early_stop = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)

print("🚀 Huấn luyện mạng Deep Neural Network (24 đặc trưng đầu vào)...")
model.fit(X_train, y_train, epochs=150, batch_size=32, validation_data=(X_test, y_test), callbacks=[early_stop], verbose=1)

loss, acc = model.evaluate(X_test, y_test, verbose=0)
print(f"\n🎯 [DNN ACCURACY]: {acc * 100:.2f}%")

model.save(os.path.join(MODEL_DIR, 'dnn_pose_model.keras'))
print("💾 Đã lưu thành công file mô hình gốc: models/dnn_pose_model.keras")