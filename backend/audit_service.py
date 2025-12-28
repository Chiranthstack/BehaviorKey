import hashlib
import datetime
import uuid
import json

class AuditLogger:
    def __init__(self):
        # In-memory storage (Deque-like behavior)
        self.logs = []
        self.max_logs = 1000

    def _hash_user(self, user_id):
        # Privacy-preserving hash (SHA-256)
        return hashlib.sha256(user_id.encode()).hexdigest()[:16]

    def log_event(self, user_id, action, score, metadata=None):
        """
        Logs a security event with masked user ID.
        """
        entry = {
            "log_id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.now().isoformat(),
            "user_hash": self._hash_user(user_id),
            "action": action, # "AUTH_SUCCESS", "AUTH_FAIL", "LOCKDOWN"
            "trust_score": round(score, 4),
            "metadata": metadata or {}
        }
        
        self.logs.insert(0, entry)
        if len(self.logs) > self.max_logs:
            self.logs.pop()
            
        return entry

    def get_logs(self, limit=50):
        return self.logs[:limit]

    def get_dashboard_stats(self):
        """
        Aggregates stats for the admin dashboard.
        """
        if not self.logs:
            return {"active_sessions": 0, "threat_level": "LOW", "avg_trust": 1.0}
            
        avg_trust = sum(l['trust_score'] for l in self.logs[:100]) / min(len(self.logs), 100)
        
        # Determine threat level
        threat_level = "LOW"
        if avg_trust < 0.8: threat_level = "ELEVATED"
        if avg_trust < 0.5: threat_level = "CRITICAL"
        
        # Count unique active hashes in last 5 mins (mock)
        active_hashes = set(l['user_hash'] for l in self.logs[:50])
        
        return {
            "active_sessions": len(active_hashes),
            "threat_level": threat_level,
            "avg_trust": avg_trust
        }
