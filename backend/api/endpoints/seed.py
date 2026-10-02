from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import models, database
from ai_engine.predict import predict_match
from services.football_api import fetch_real_world_matches
import datetime

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
async def seed_data(db: Session = Depends(get_db)):
    # Clear existing matches and predictions
    db.query(models.Prediction).delete()
    db.query(models.Match).delete()
    
    real_matches = await fetch_real_world_matches()
    
    for fixture in real_matches:
        match_date = datetime.datetime.fromisoformat(fixture["match_date"].replace("Z", "+00:00"))
        
        match = models.Match(
            home_team=fixture["home_team"],
            away_team=fixture["away_team"],
            match_date=match_date,
            league=fixture["league"],
            home_odds=fixture["home_odds"],
            draw_odds=fixture["draw_odds"],
            away_odds=fixture["away_odds"],
            status=fixture["status"]
        )
        db.add(match)
        db.flush()  # Obtain match.id
        
        # Calculate real mathematical Dixon-Coles Poisson prediction
        pred_vals = predict_match(
            home_team=fixture["home_team"],
            away_team=fixture["away_team"],
            home_odds=fixture["home_odds"],
            draw_odds=fixture["draw_odds"],
            away_odds=fixture["away_odds"]
        )
        
        prediction = models.Prediction(
            match_id=match.id,
            **pred_vals
        )
        db.add(prediction)
    
    db.commit()
    return {"message": f"Database successfully seeded with {len(real_matches)} real-world matches and Dixon-Coles AI predictions."}
