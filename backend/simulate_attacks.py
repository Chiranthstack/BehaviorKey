import numpy as np
import time
from ml_service import BehavioralModel

def generate_user_data(mean_hold, mean_flight, n_samples=50, variance=5):
    """
    Generates synthetic typing data with specific rhythm.
    """
    data = []
    keys = list("securelogin")
    current_time = 1000.0
    
    for _ in range(n_samples):
        chunk = []
        for k in keys:
            # Flight (Press-to-Press)
            current_time += np.random.normal(mean_flight, variance)
            chunk.append({"key": k, "type": "keydown", "timestamp": current_time})
            
            # Hold
            release_time = current_time + np.random.normal(mean_hold, variance)
            chunk.append({"key": k, "type": "keyup", "timestamp": release_time})
        data.append(chunk)
    return data

def simulate_impostor(model):
    print("\n[1] TEST: Impostor Attack (Zero-Effort)")
    # User A: Hold=100, Flight=50
    # Impostor (User B): Hold=80, Flight=80 (Different rhythm)
    impostor_data = generate_user_data(mean_hold=80, mean_flight=80, n_samples=100)
    
    false_accepts = 0
    for sample in impostor_data:
        score = model.predict(sample)
        if score >= 0.5: # Confidence threshold
            false_accepts += 1
            
    far = false_accepts / len(impostor_data)
    print(f"    -> Impostor Samples: {len(impostor_data)}")
    print(f"    -> False Accepts: {false_accepts}")
    print(f"    -> FAR: {far*100:.2f}%")
    print(f"    -> Verdict: {'PASSED' if far < 0.01 else 'FAILED'} (Target < 1%)")

def simulate_mimicry(model):
    print("\n[2] TEST: Mimicry Attack (High-Effort)")
    # Attacker tries to match User A (100/50)
    # But has higher variance (jitter) due to cognitive load of mimicking
    mimic_data = generate_user_data(mean_hold=100, mean_flight=50, n_samples=100, variance=25) 
    
    detections = 0
    for sample in mimic_data:
        score = model.predict(sample)
        if score < 0.5: # Should reject
            detections += 1
            
    mdr = detections / len(mimic_data)
    print(f"    -> Mimicry Samples: {len(mimic_data)}")
    print(f"    -> Detections: {detections}")
    print(f"    -> MDR (Mimicry Detection Rate): {mdr*100:.2f}%")
    print(f"    -> Verdict: {'PASSED' if mdr > 0.9 else 'FAILED'} (Target > 90%)")

def simulate_replay():
    print("\n[3] TEST: Replay Attack (Technical)")
    # 1. Valid Packet
    now = time.time()
    valid_packet_ts = now
    
    # 2. Replay Packet (Old)
    old_packet_ts = now - 60 # 60 seconds ago
    
    # Backend Logic Simulation
    def validate_timestamp(ts):
        server_time = time.time()
        drift = abs(server_time - ts)
        return drift <= 30
    
    print(f"    -> Send Valid Packet (Delta 0s): {'ACCEPTED' if validate_timestamp(valid_packet_ts) else 'BLOCKED'}")
    
    result = validate_timestamp(old_packet_ts)
    print(f"    -> Send Replay Packet (Delta 60s): {'ACCEPTED' if result else 'BLOCKED'}")
    print(f"    -> Verdict: {'PASSED' if not result else 'FAILED'}")

def simulate_hijacking(model):
    print("\n[4] TEST: Session Hijacking (Continuous Auth)")
    # Stream of events: 10 Legitimate -> 10 Impostor
    print("    -> Simulating continuous stream...")
    
    legit = generate_user_data(100, 50, 10, variance=5)
    impostor = generate_user_data(80, 80, 10, variance=5)
    stream = legit + impostor
    
    locked = False
    lock_index = -1
    
    for i, sample in enumerate(stream):
        score = model.predict(sample)
        is_legit = (i < 10)
        user_label = "User A" if is_legit else "IMPOSTOR"
        status = "OK" if score >= 0.5 else "LOCK"
        
        # print(f"       Step {i+1}: {user_label} -> Score {score:.2f} -> {status}")
        
        if not is_legit and score < 0.5 and not locked:
            locked = True
            lock_index = i
            print(f"    -> SYSTEM LOCKED at Step {i+1} (Impostor Step {i-9})")
            
    if locked:
        steps_to_lock = (lock_index - 9)
        print(f"    -> Time-to-Lock: {steps_to_lock} samples")
        print(f"    -> Verdict: {'PASSED' if steps_to_lock <= 3 else 'FAILED'} (Target <= 3 samples)")
    else:
        print("    -> Verdict: FAILED (System never locked)")

def run_simulation():
    print("=== BEHAVIORAL THREAT SIMULATION SUITE ===")
    
    # Train Model (User A)
    print("Training Target Model (Random Forest)...")
    train_data = generate_user_data(mean_hold=100, mean_flight=50, n_samples=50, variance=5)
    
    # Use RF as it was the best performer
    model = BehavioralModel("user_a", model_type='rf')
    model.train(train_data)
    
    simulate_impostor(model)
    simulate_mimicry(model)
    simulate_replay()
    simulate_hijacking(model)
    print("\n=== END SIMULATION ===")

if __name__ == "__main__":
    run_simulation()
