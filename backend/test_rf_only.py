import numpy as np
import joblib

print("Loading RF model...")
try:
    rf_model = joblib.load('models/marshaller_model_rf.pkl')
    print("RF classes:", rf_model.classes_)
    
    # Load dataset
    X = np.load('X_data.npy')
    y = np.load('y_labels.npy')
    
    print("Dataset shape:", X.shape)
    
    # Test predict first 10 items
    preds = rf_model.predict(X[:10])
    probs = rf_model.predict_proba(X[:10])
    
    for i in range(10):
        idx = preds[i]
        prob = probs[i][idx]
        print(f"Sample {i} - Actual: {y[i]} | Predicted class: {idx} with prob: {prob:.4f}")
        
except Exception as e:
    print("Error:", e)
