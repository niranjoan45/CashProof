import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier

MODEL_PATH = 'model.pkl'

def train_and_save_mock_model():
    """
    Trains a simple Random Forest model to mock accident detection.
    Features: [acc_x, acc_y, acc_z, gyro_rot, sound_intensity, impact_duration]
    Outputs: 0 (Normal), 1 (Minor Accident), 2 (Severe Accident)
    """
    print("Training mock ML model...")
    # Generate mock training data
    # [accel (0-30), gyro (0-500), sound (0-120), duration (0-5)]
    
    # 0: Normal driving (low accel, low gyro, mod sound, no impact duration)
    X_normal = np.random.rand(100, 6) * [3, 3, 3, 50, 60, 0]
    y_normal = np.zeros(100)
    
    # 1: Minor Accident (mod accel, mod gyro, high sound, short duration)
    X_minor = np.random.rand(50, 6) * [8, 8, 8, 200, 90, 1] + [5, 5, 5, 50, 60, 0.2]
    y_minor = np.ones(50)
    
    # 2: Severe Accident (high accel spike, high gyro, max sound, mod duration)
    X_severe = np.random.rand(50, 6) * [20, 20, 20, 400, 30, 2] + [10, 10, 10, 100, 90, 0.5]
    y_severe = np.full(50, 2)
    
    X = np.concatenate([X_normal, X_minor, X_severe])
    y = np.concatenate([y_normal, y_minor, y_severe])
    
    # Train model
    clf = RandomForestClassifier(n_estimators=10, max_depth=5, random_state=42)
    clf.fit(X, y)
    
    # Save model
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(clf, f)
    
    print(f"Model saved to {MODEL_PATH}")

def load_model():
    """Loads the trained model."""
    if not os.path.exists(MODEL_PATH):
        train_and_save_mock_model()
    
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)

def predict_accident_severity(features):
    """
    Predicts severity from features.
    features: list of 6 floats
    """
    model = load_model()
    # Reshape for single prediction
    X_pred = np.array(features).reshape(1, -1)
    prediction = model.predict(X_pred)[0]
    
    # Add a bit of heuristic override for the hackathon "Simulate" button to ensure it works
    # If acceleration is extremely high (e.g., > 20 on any axis), force severe classification
    if any(abs(x) > 20 for x in features[:3]):
        return 2

    return int(prediction)

if __name__ == '__main__':
    train_and_save_mock_model()
