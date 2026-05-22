import numpy as np
import joblib
from tensorflow.keras.models import load_model

print("Loading models...")
try:
    dnn_model = load_model('models/marshaller_model_dnn.h5')
    print("DNN loaded successfully. Input shape:", dnn_model.input_shape, "Output shape:", dnn_model.output_shape)
except Exception as e:
    print("DNN load error:", e)

try:
    rf_model = joblib.load('models/marshaller_model_rf.pkl')
    print("RF loaded successfully. Classes:", rf_model.classes_)
    if hasattr(rf_model, "n_features_in_"):
        print("RF input features:", rf_model.n_features_in_)
except Exception as e:
    print("RF load error:", e)

try:
    y = np.load('y_labels.npy')
    print("y labels shape:", y.shape, "unique labels:", np.unique(y))
except Exception as e:
    print("y labels load error:", e)
