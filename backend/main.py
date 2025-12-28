from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from models import EnrollmentRequest, AuthRequest, AuthResponse
from ml_service import BehavioralModel
from crypto_service import CryptoManager
from audit_service import AuditLogger
import os
import pickle
import time
from typing import List

app = FastAPI(title="Behavioral Biometrics API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
user_models = {}
crypto_manager = CryptoManager()
audit_logger = AuditLogger()

@app.post("/enroll")
async def enroll(req: EnrollmentRequest):
    # Enforce Autoencoder for Crypto Features
    model = BehavioralModel(req.user_id, model_type='autoencoder')
    success = model.train( [ [e.model_dump() for e in sample] for sample in req.samples ] )
    
    if not success:
        raise HTTPException(status_code=400, detail="Insufficient training data quality")
    
    user_models[req.user_id] = model
    
    # Generate Key Binding
    # Need to extract latent from the training data itself (or average of it)
    raw_samples = [e.model_dump() for e in req.samples[0]]
    latent = model.get_latent_vector(raw_samples)
    
    if latent is None:
        key = b"LEGACY_KEY_NO_BINDING"
    else:
        key = crypto_manager.create_vault(req.user_id, latent)
    
    return {"status": "enrolled", "key": key.decode('utf-8')}

@app.post("/verify")
async def verify(req: AuthRequest):
    # Replay Protection
    current_time = time.time()
    # Handle if client sends ms (JS Date.now())
    if req.request_ts > 10000000000: # heuristic for ms
        req_ts = req.request_ts / 1000
    else:
        req_ts = req.request_ts

    if abs(current_time - req_ts) > 30:
        audit_logger.log_event(req.user_id, "REPLAY_ATTACK", 0.0, {"delta": abs(current_time - req_ts)})
        raise HTTPException(status_code=401, detail="Replay detected")

    if req.user_id not in user_models:
        raise HTTPException(status_code=404, detail="User not found")
        
    model = user_models[req.user_id]
    
    # 1. Behavioral Check
    raw_events = [e.model_dump() for e in req.events]
    instant_score, trust_score = model.predict(raw_events)
    
    # 2. Cryptographic Unlock
    key_str = None
    latent = model.get_latent_vector(raw_events)
    vault_success = False
    
    if latent is not None:
        unlocked_bytes = crypto_manager.unlock_vault(req.user_id, latent)
        if unlocked_bytes:
            key_str = unlocked_bytes.decode('utf-8')
            vault_success = True
    
    # Decision Logic
    AUTH_THRESHOLD = 0.6
    authenticated = False
    msg = ""
    reason = "NORMAL"

    if vault_success:
        msg = "Identity Verified (Vault Unlocked)"
        authenticated = True
        reason = "VAULT_UNLOCK"
        
    elif instant_score >= AUTH_THRESHOLD and not vault_success:
        # DRIFT
        if latent is not None:
            new_key = crypto_manager.create_vault(req.user_id, latent)
            key_str = new_key.decode('utf-8')
            msg = "Identity Verified (Vault Regenerated)"
            authenticated = True
            reason = "DRIFT_REGEN"
        else:
            msg = "Identity Verified (Legacy)"
            authenticated = True
            
    else:
        # FAIL
        msg = "Verification Failed"
        authenticated = False
        key_str = None
        reason = "BEHAVIOR_MISMATCH"
        
    # Log Event
    action = "AUTH_SUCCESS" if authenticated else "AUTH_FAIL"
    if trust_score < 0.5: action = "SYSTEM_LOCKDOWN"
    
    audit_logger.log_event(req.user_id, action, trust_score, {
        "reason": reason,
        "algo_score": instant_score,
        "vault_status": "OPEN" if vault_success else "LOCKED"
    })

    return AuthResponse(
        authenticated=authenticated,
        confidence=instant_score,
        current_trust=trust_score,
        key=key_str,
        message=msg
    )

@app.get("/admin/logs")
async def get_logs(limit: int = 20):
    return audit_logger.get_logs(limit)

@app.get("/admin/stats")
async def get_stats():
    return audit_logger.get_dashboard_stats()

@app.get("/status")
def status_check():
    return {"status": "active", "models_loaded": len(user_models)}
