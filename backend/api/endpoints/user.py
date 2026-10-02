from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from models import schemas, models, database
import datetime

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/activities", response_model=List[schemas.UserActivityResponse])
def get_user_activities(user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    activities = db.query(models.UserActivity).order_by(models.UserActivity.timestamp.desc()).limit(50).all()
    return activities

@router.post("/activities", response_model=schemas.UserActivityResponse)
def log_user_activity(activity: schemas.UserActivityBase, user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    act = models.UserActivity(
        user_id=user_id,
        action=activity.action,
        details=activity.details,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return act

@router.get("/favorites", response_model=List[schemas.SavedBetResponse])
def get_saved_bets(user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    bets = db.query(models.SavedBet).filter(models.SavedBet.user_id == user_id).order_by(models.SavedBet.created_at.desc()).all()
    return bets

@router.post("/favorites/{match_id}")
def save_favorite_bet(match_id: int, user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    existing = db.query(models.SavedBet).filter(models.SavedBet.user_id == user_id, models.SavedBet.match_id == match_id).first()
    if existing:
        return {"message": "Already saved in your favorites"}
    
    saved = models.SavedBet(user_id=user_id, match_id=match_id)
    db.add(saved)
    
    # Log activity
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    match_title = f"{match.home_team} vs {match.away_team}" if match else f"Match #{match_id}"
    log = models.UserActivity(user_id=user_id, action="SAVED_BET", details=f"Saved prediction for {match_title}")
    db.add(log)
    
    db.commit()
    return {"message": "Prediction saved successfully to your favorites"}

@router.delete("/favorites/{match_id}")
def remove_favorite_bet(match_id: int, user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    db.query(models.SavedBet).filter(models.SavedBet.user_id == user_id, models.SavedBet.match_id == match_id).delete()
    db.commit()
    return {"message": "Prediction removed from favorites"}
