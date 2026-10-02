from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_vip: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- User Activity & Saved Bets ---
class UserActivityBase(BaseModel):
    action: str
    details: Optional[str] = None

class UserActivityResponse(UserActivityBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Prediction Schemas ---
class PredictionBase(BaseModel):
    ai_home_win_prob: float
    ai_draw_prob: float
    ai_away_win_prob: float
    ai_over_2_5_prob: float
    ai_btts_prob: float
    confidence_score: float
    risk_level: str
    ai_explanation: str
    ai_suggested_score: Optional[str] = None
    ht_ft_pred: Optional[str] = "1/1"
    home_xg: Optional[float] = 1.5
    away_xg: Optional[float] = 1.1
    value_bet: Optional[str] = "No Value Edge"
    top_scores: Optional[str] = None
    h2h_data: Optional[str] = None
    trends: Optional[str] = None

class PredictionResponse(PredictionBase):
    id: int
    match_id: int

    class Config:
        from_attributes = True

# --- Match Schemas ---
class MatchBase(BaseModel):
    home_team: str
    away_team: str
    match_date: datetime
    league: str
    home_odds: float
    draw_odds: float
    away_odds: float
    status: str
    venue: Optional[str] = "Main Arena"
    weather_temp: Optional[str] = "18°C"
    weather_desc: Optional[str] = "Clear Sky"
    home_form: Optional[str] = "W,W,D,W,L"
    away_form: Optional[str] = "D,W,L,W,D"
    home_score: Optional[int] = None
    away_score: Optional[int] = None

class MatchResponse(MatchBase):
    id: int
    predictions: List[PredictionResponse] = []

    class Config:
        from_attributes = True

class SavedBetResponse(BaseModel):
    id: int
    user_id: int
    match_id: int
    created_at: datetime
    match: Optional[MatchResponse] = None

    class Config:
        from_attributes = True
