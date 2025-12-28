import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.svm import OneClassSVM
import pickle
import os
import torch
import torch.nn as nn
import torch.optim as optim

# Autoencoder Definition
class Autoencoder(nn.Module):
    def __init__(self, input_dim=9):
        super(Autoencoder, self).__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 4), # Latent
            nn.ReLU()
        )
        self.decoder = nn.Sequential(
            nn.Linear(4, 8),
            nn.ReLU(),
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, input_dim)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

class BehavioralModel:
    def __init__(self, user_id, model_type='if'):
        self.user_id = user_id
        self.model_type = model_type
        
        # Initialize selected model container
        self.model = None
        self.scaler_params = {'mean': 0, 'std': 1} # Simple scaling
        
        if model_type == 'if':
            self.model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        elif model_type == 'svm':
            self.model = OneClassSVM(kernel='rbf', nu=0.1, gamma='scale')
        elif model_type == 'rf':
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        elif model_type == 'autoencoder':
            self.model = Autoencoder(input_dim=9)
            self.optimizer = optim.Adam(self.model.parameters(), lr=0.01)
            self.criterion = nn.MSELoss()
            self.threshold = 0.0 # Anomaly threshold
        else:
            raise ValueError(f"Unknown model type: {model_type}")
            
        self.is_trained = False
        
        # Continuous Trust State
        self.trust_score = 0.5 # Neutral start
        self.alpha = 0.3 # Smoothing factor

    # ... extract_features ...

    def predict(self, data_batch):
        if not self.is_trained:
            return 0.0, 0.5 # score, trust
            
        X = self.extract_features(data_batch)
        if len(X) == 0:
            return 0.0, self.trust_score
        
        instant_score = 0.0
        
        if self.model_type == 'rf':
            probs = self.model.predict_proba(X)
            instant_score = np.mean(probs[:, 1])
            
        elif self.model_type == 'autoencoder':
            X_scaled = (X - self.scaler_params['mean']) / self.scaler_params['std']
            tensor_x = torch.Tensor(X_scaled)
            self.model.eval()
            with torch.no_grad():
                recons = self.model(tensor_x)
                errors = torch.mean((tensor_x - recons)**2, dim=1).numpy()
            
            confs = []
            for err in errors:
                if err <= self.threshold:
                    c = 1.0 - 0.5 * (err / self.threshold)
                else:
                    ratio = err / self.threshold
                    c = max(0.0, 0.5 - 0.1 * (ratio - 1))
                confs.append(c)
            instant_score = np.mean(confs)
            
        else:
            # IF / SVM
            preds = self.model.predict(X)
            instant_score = np.mean(preds == 1)
            
        # Update Trust Score (EMA)
        self.trust_score = (self.alpha * instant_score) + ((1 - self.alpha) * self.trust_score)
        
        return instant_score, self.trust_score
    def extract_features(self, typing_data):
        """
        Extracts advanced behavioral features (9 dims).
        """
        # Sort by timestamp
        sorted_events = sorted(typing_data, key=lambda x: x['timestamp'])
        
        pending_presses = {}
        
        # Intermediate arrays
        # [H, F1, F2, PressTS]
        raw_metrics = [] 
        
        last_release_ts = None
        last_press_ts = None
        
        # For Trigraphs history
        press_history = [] 
        
        for event in sorted_events:
            key = event['key']
            ts = event['timestamp']
            etype = event['type']
            
            if etype == 'keydown':
                pending_presses[key] = ts
            elif etype == 'keyup':
                if key in pending_presses:
                    press_ts = pending_presses.pop(key)
                    
                    # 1. Hold Time
                    h = ts - press_ts
                    
                    # 2. Flight Time RP
                    f1 = 0.0
                    if last_release_ts is not None:
                        f1 = press_ts - last_release_ts
                        
                    # 3. Flight Time PP
                    f2 = 0.0
                    if last_press_ts is not None:
                        f2 = press_ts - last_press_ts
                    
                    # Update History
                    last_release_ts = ts
                    last_press_ts = press_ts
                    press_history.append(press_ts)
                    
                    raw_metrics.append([h, f1, f2, press_ts])

        if not raw_metrics:
            return np.array([])

        raw_metrics = np.array(raw_metrics)
        n = len(raw_metrics)
        
        if n < 5:
            # Need at least 5 for windowing
            # Padding not implemented for simplicity, returning empty for safety
            # Enforce minimum drill length
            return np.array([])

        final_features = []
        W = 5
        
        for i in range(n):
            row = raw_metrics[i]
            h, f1, f2, current_press_ts = row
            
            # 4. Trigraph
            trigraph = 0.0
            if i >= 2:
                trigraph = current_press_ts - press_history[i-2]
            
            # Window Stats
            start_idx = max(0, i - W + 1)
            window_h = raw_metrics[start_idx : i+1, 0]
            window_f2 = raw_metrics[start_idx : i+1, 2]
            
            roll_mean_h = np.mean(window_h)
            roll_std_h = np.std(window_h) if len(window_h) > 1 else 0.0
            roll_mean_f = np.mean(window_f2)
            roll_std_f = np.std(window_f2) if len(window_f2) > 1 else 0.0
            
            # Entropy
            entropy = 0.0
            if len(window_f2) > 1 and np.sum(window_f2) > 0:
                probs = window_f2 / np.sum(window_f2)
                probs = probs[probs > 0]
                if len(probs) > 0:
                    entropy = -np.sum(probs * np.log2(probs + 1e-9))
            
            feat_vector = [h, f1, f2, trigraph, roll_mean_h, roll_std_h, roll_mean_f, roll_std_f, entropy]
            final_features.append(feat_vector)
            
        return np.array(final_features)

    def train(self, training_data_batches):
        X = []
        for batch in training_data_batches:
            feats = self.extract_features(batch)
            if len(feats) > 0:
                X.extend(feats)
        
        X = np.array(X)
        if len(X) < 10:
            return False # Not enough data
            
        # Scaling (Simple MinMax or Standard)
        self.scaler_params['mean'] = X.mean(axis=0)
        self.scaler_params['std'] = X.std(axis=0) + 1e-9
        
        # Dispatch Training
        if self.model_type == 'rf':
            self._train_rf(X)
        elif self.model_type == 'autoencoder':
            self._train_autoencoder(X)
        else:
            # IF and SVM
            self.model.fit(X)
            
        self.is_trained = True
        return True

    def _train_rf(self, X_pos):
        # Generate Negative Samples (Synthetic)
        n_samples, n_features = X_pos.shape
        # Simple uniform noise in reasonable range (e.g. 0-500ms for times)
        # But features have different scales.
        # Use simple global range based on X_pos
        X_neg = np.random.uniform(
            low=X_pos.min(axis=0) - 50, 
            high=X_pos.max(axis=0) + 50, 
            size=(n_samples, n_features)
        )
        
        X = np.vstack([X_pos, X_neg])
        y = np.hstack([np.ones(n_samples), np.zeros(n_samples)])
        
        self.model.fit(X, y)

    def _train_autoencoder(self, X):
        # Normalize
        X_scaled = (X - self.scaler_params['mean']) / self.scaler_params['std']
        tensor_x = torch.Tensor(X_scaled)
        
        self.model.train()
        epochs = 100
        for epoch in range(epochs):
            self.optimizer.zero_grad()
            outputs = self.model(tensor_x)
            loss = self.criterion(outputs, tensor_x)
            loss.backward()
            self.optimizer.step()
            
        # Set threshold based on reconstruction error of training data
        with torch.no_grad():
            recons = self.model(tensor_x)
            # MSE per sample
            errors = torch.mean((tensor_x - recons)**2, dim=1).numpy()
            # Threshold = Mean + 2*Std (95%)
            self.threshold = errors.mean() + 2 * errors.std()

    def predict(self, data_batch):
        if not self.is_trained:
            return 0.0
            
        X = self.extract_features(data_batch)
        if len(X) == 0:
            return 0.0
            
        if self.model_type == 'rf':
            # Proba of class 1
            probs = self.model.predict_proba(X)
            return np.mean(probs[:, 1]) # confidence
            
        elif self.model_type == 'autoencoder':
            # Reconstruction Error
            X_scaled = (X - self.scaler_params['mean']) / self.scaler_params['std']
            tensor_x = torch.Tensor(X_scaled)
            self.model.eval()
            with torch.no_grad():
                recons = self.model(tensor_x)
                errors = torch.mean((tensor_x - recons)**2, dim=1).numpy()
            
            # Convert error to confidence (inverse)
            # If error < threshold, high confidence.
            # Sigmoid-like scaling?
            # Simple linear: 1 - (error / (2*threshold)) clipped
            confs = []
            for err in errors:
                if err <= self.threshold:
                    # Map [0, threshold] -> [0.5, 1.0]
                    # Lower err is better.
                    c = 1.0 - 0.5 * (err / self.threshold)
                else:
                    # Map [threshold, inf] -> [0.5, 0.0]
                    ratio = err / self.threshold
                    c = max(0.0, 0.5 - 0.1 * (ratio - 1)) # decay
                confs.append(c)
            return np.mean(confs)
            
        else:
            # IF / SVM
            preds = self.model.predict(X)
            return np.mean(preds == 1)

    def save(self, path):
        # Pickle cannot handle Torch model objects sometimes (require structure).
        # We'll trust pickle for now (wrapper handles it).
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    def get_latent_vector(self, data_batch):
        """
        Extracts the latent vector (compressed representation) for the batch.
        Only supported for Autoencoder model. Returns mean latent vector.
        """
        if self.model_type != 'autoencoder' or not self.is_trained:
            return None
            
        X = self.extract_features(data_batch)
        if len(X) == 0:
            return None
            
        # Standardize using stored params
        X_scaled = (X - self.scaler_params['mean']) / self.scaler_params['std']
        tensor_x = torch.Tensor(X_scaled)
        
        self.model.eval()
        with torch.no_grad():
            # Encoder only
            latent = self.model.encoder(tensor_x).numpy()
            
        # Return mean vector (centroid of the session)
        return np.mean(latent, axis=0)

