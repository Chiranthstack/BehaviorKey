import time
import numpy as np
from ml_service import BehavioralModel
from sklearn.metrics import accuracy_score

def generate_synthetic_data(pattern_type='A', n_samples=100):
    """
    Generate synthetic keystroke events.
    Pattern A: Mean Hold=100, F1=50, F2=30
    Pattern B: Mean Hold=80, F1=80, F2=60 (Impostor)
    """
    data = []
    keys = list("securelogin")
    
    if pattern_type == 'A':
        base_h, base_f1, base_f2 = 100, 50, 30
        var = 5
    else:
        base_h, base_f1, base_f2 = 80, 80, 60
        var = 15 # Impostor is more erratic?
        
    current_time = 1000.0
    
    for _ in range(n_samples):
        chunk = []
        for k in keys:
            # Key Down
            # Press time depends on F2 (Press-to-Press) from previous
            current_time += np.random.normal(base_f2, var)
            chunk.append({"key": k, "type": "keydown", "timestamp": current_time})
            
            # Key Up
            release_time = current_time + np.random.normal(base_h, var)
            chunk.append({"key": k, "type": "keyup", "timestamp": release_time})
            
        data.append(chunk)
    return data

def evaluate_model(model_type, train_data, test_legit, test_impostor):
    print(f"\n--- Evaluating {model_type.upper()} ---")
    
    # 1. Train
    start = time.time()
    model = BehavioralModel("user_test", model_type=model_type)
    success = model.train(train_data)
    train_time = (time.time() - start) * 1000
    
    if not success:
        print("Training Failed (insufficient data)")
        return
    
    print(f"Training Time: {train_time:.2f} ms")
    
    # 2. Test Legitimate (FRR)
    false_rejects = 0
    latencies = []
    
    for sample in test_legit:
        t0 = time.time()
        score = model.predict(sample) # CORRECTED: Passed sample directly
        latencies.append((time.time()-t0)*1000)
        
        # Threshold Logic
        # For IF/SVM/RF: Score is prob or class (1.0 = good)
        # For AE: Score is confidence (1.0 = good)
        if score < 0.6:
            false_rejects += 1
            
    frr = false_rejects / len(test_legit)
    avg_lat = np.mean(latencies)
    
    # 3. Test Impostor (FAR)
    false_accepts = 0
    for sample in test_impostor:
        score = model.predict(sample) # CORRECTED
        if score >= 0.6:
            false_accepts += 1
            
    far = false_accepts / len(test_impostor)
    
    print(f"FRR: {frr*100:.2f}% | FAR: {far*100:.2f}%")
    print(f"Avg Inference Latency: {avg_lat:.2f} ms")
    
    # 4. Overall Accuracy (Balanced)
    # Acc = (TrueAuth + TrueReject) / Total
    # TrueAuth = (1-FRR)*N_legit
    # TrueReject = (1-FAR)*N_imp
    acc = ((1-frr) + (1-far)) / 2
    print(f"Balanced Accuracy: {acc*100:.2f}%")
    
    return {
        "model": model_type,
        "acc": acc,
        "far": far,
        "frr": frr,
        "latency": avg_lat,
        "train_time": train_time
    }

def run_comparison():
    print("Generating Synthetic Benchmark Data...")
    train_data = generate_synthetic_data('A', 50) # 50 samples for training
    test_legit = generate_synthetic_data('A', 100)
    test_impostor = generate_synthetic_data('B', 100)
    
    models = ['if', 'svm', 'rf', 'autoencoder']
    results = []
    
    for m in models:
        try:
            res = evaluate_model(m, train_data, test_legit, test_impostor)
            if res:
                results.append(res)
        except Exception as e:
            print(f"Error evaluating {m}: {e}")
            import traceback
            traceback.print_exc()

    print("\n\n=== FINAL COMPARISON RANKING ===")
    # Sort by Accuracy desc, then Latency asc
    results.sort(key=lambda x: (-x['acc'], x['latency']))
    
    print(f"{'Model':<12} | {'Accuracy':<10} | {'FAR':<8} | {'FRR':<8} | {'Latency (ms)':<12}")
    print("-" * 65)
    for r in results:
        print(f"{r['model'].upper():<12} | {r['acc']*100:.1f}%     | {r['far']*100:.1f}%   | {r['frr']*100:.1f}%   | {r['latency']:.2f}")

    print("\nRecommendation:")
    best = results[0]
    print(f"The {best['model'].upper()} model performed best with {best['acc']*100:.1f}% accuracy.")
    if best['model'] == 'rf':
        print("Random Forest provides robust classification but requires synthetic negative sampling.")
    elif best['model'] == 'autoencoder':
        print("Autoencoders are excellent for anomaly detection but have higher latency.")
    elif best['model'] == 'svm':
        print("One-Class SVM is a strong, fast baseline for outlier detection.")

if __name__ == "__main__":
    run_comparison()
