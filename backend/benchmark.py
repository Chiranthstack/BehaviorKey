import numpy as np
import time
from ml_service import BehavioralModel
from sklearn.metrics import accuracy_score

def generate_synthetic_keystrokes(base_dwell=100, base_flight=50, variance=10, n_samples=50):
    """
    Generates synthetic typing data.
    User A might have dwell=100, flight=50.
    User B might have dwell=80, flight=70.
    """
    data = []
    keys = list("behavioralbiometrics")
    
    current_time = 1000.0
    
    for _ in range(n_samples):
        chunk = []
        for k in keys:
            # Key Down
            press_time = current_time + np.random.normal(base_flight, variance)
            chunk.append({"key": k, "type": "keydown", "timestamp": press_time})
            
            # Key Up
            release_time = press_time + np.random.normal(base_dwell, variance)
            chunk.append({"key": k, "type": "keyup", "timestamp": release_time})
            
            current_time = release_time
        
        data.append(chunk)
        
    return data

def run_benchmark():
    print("=== Behavioral Biometrics Benchmark (Synthetic Data) ===")
    
    # 1. Create Data
    print("[*] Generating User A data (Legitimate)...")
    user_a_train = generate_synthetic_keystrokes(base_dwell=100, base_flight=50, variance=5, n_samples=20)
    user_a_test = generate_synthetic_keystrokes(base_dwell=100, base_flight=50, variance=5, n_samples=50)
    
    print("[*] Generating User B data (Impostor)...")
    user_b_test = generate_synthetic_keystrokes(base_dwell=80, base_flight=80, variance=10, n_samples=50) # Different rhythm
    
    # 2. Train Model for User A
    print("[*] Training Model for User A...")
    model = BehavioralModel("user_a")
    model.train(user_a_train)
    
    # 3. Test Legitimate (FRR Analysis)
    print("[*] Testing Legitimate Access (User A vs User A Model)...")
    false_rejections = 0
    scores_legit = []
    
    for sample in user_a_test:
        score = model.predict(sample)
        scores_legit.append(score)
        if score < 0.6: # Threshold
            false_rejections += 1
            
    frr = false_rejections / len(user_a_test)
    print(f"    -> Mean Trust Score: {np.mean(scores_legit):.4f}")
    print(f"    -> FRR (False Rejection Rate): {frr*100:.2f}%")

    # 4. Test Impostor (FAR Analysis)
    print("[*] Testing Impostor Access (User B vs User A Model)...")
    false_acceptances = 0
    scores_impostor = []
    
    for sample in user_b_test:
        score = model.predict(sample)
        scores_impostor.append(score)
        if score >= 0.6: # Threshold
            false_acceptances += 1
            
    far = false_acceptances / len(user_b_test)
    print(f"    -> Mean Trust Score: {np.mean(scores_impostor):.4f}")
    print(f"    -> FAR (False Acceptance Rate): {far*100:.2f}%")

    print("\n=== Summary ===")
    print(f"EER (Approx): {(far + frr) / 2 * 100:.2f}%")
    
if __name__ == "__main__":
    run_benchmark()
