from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import schemas, models, database
from ai_engine import predict

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/analyze/{match_id}", response_model=schemas.PredictionResponse)
def analyze_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    # Call AI Engine
    ai_results = predict.mock_predict_match(match.home_team, match.away_team)

    # Save to db
    prediction = models.Prediction(
        match_id=match_id,
        **ai_results
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    
    return prediction
