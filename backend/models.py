from pydantic import BaseModel
from typing import List, Literal, Optional

class KeyEvent(BaseModel):
    key: str
    type: Literal['keydown', 'keyup']
    timestamp: float 

class EnrollmentRequest(BaseModel):
    user_id: str
    samples: List[List[KeyEvent]] # List of multiple attempts

class AuthRequest(BaseModel):
    user_id: str
    events: List[KeyEvent]
    request_ts: float = 0.0 # Timestamp of when the packet was sent 

class AuthResponse(BaseModel):
    authenticated: bool
    confidence: float # Instant check
    current_trust: float = 0.5 # EMA Smoothed Score
    key: Optional[str] = None
    message: str
