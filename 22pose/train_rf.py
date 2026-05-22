
import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

DATA_DIR = "processed_npy_data"
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

X_train = np.load(os.path.join(DATA_DIR, 'X_train.npy'))
X_test = np.load(os.path.join(DATA_DIR, 'X_test.npy'))
y_train = np.load(os.path.join(DATA_DIR, 'y_train.npy'))
y_test = np.load(os.path.join(DATA_DIR, 'y_test.npy'))
classes = np.load(os.path.join(DATA_DIR, 'classes.npy'), allow_pickle=True)

print("🚀 Huấn luyện Random Forest vững chắc (24 đặc trưng đầu vào)...")
# Cấu hình class_weight='balanced' xử lý triệt để hiện tượng dữ liệu lệch số dòng giữa các file CSV
rf_model = RandomForestClassifier(n_estimators=250, class_weight='balanced', random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)
print(f"\n🎯 [RANDOM FOREST ACCURACY]: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(classification_report(y_test, y_pred, target_names=classes))

joblib.dump(rf_model, os.path.join(MODEL_DIR, 'random_forest_model.pkl'))
print("💾 Đã đóng gói thành công file mô hình: models/random_forest_model.pkl")