from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from models import schemas, models, database
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

async def sync_real_world_data(db: Session):
    db.query(models.Prediction).delete()
    db.query(models.Match).delete()
    
    real_matches = await fetch_real_world_matches()
    for fixture in real_matches:
        try:
            match_date = datetime.datetime.fromisoformat(fixture["match_date"].replace("Z", "+00:00"))
        except Exception:
            match_date = datetime.datetime.utcnow() + datetime.timedelta(hours=4)
        
        match = models.Match(
            home_team=fixture["home_team"],
            away_team=fixture["away_team"],
            match_date=match_date,
            league=fixture["league"],
            home_odds=fixture["home_odds"],
            draw_odds=fixture["draw_odds"],
            away_odds=fixture["away_odds"],
            status=fixture["status"],
            venue=fixture.get("venue", "Main Stadium"),
            weather_temp=fixture.get("weather_temp", "18°C"),
            weather_desc=fixture.get("weather_desc", "Clear Sky"),
            home_form=fixture.get("home_form", "W,W,D,L,W"),
            away_form=fixture.get("away_form", "D,W,W,L,D"),
            home_score=fixture.get("home_score"),
            away_score=fixture.get("away_score"),
        )
        db.add(match)
        db.flush()
        
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

@router.get("/", response_model=List[schemas.MatchResponse])
async def read_matches(
    timeframe: Optional[str] = Query("all", description="all, today, tomorrow, yesterday, upcoming, live"),
    league: Optional[str] = Query(None, description="Filter by league name"),
    search: Optional[str] = Query(None, description="Search team name"),
    market: Optional[str] = Query(None, description="Market filter (e.g. 1x2, value_bets, live, over_under, btts)"),
    skip: int = 0, 
    limit: int = 200, 
    db: Session = Depends(get_db)
):
    matches = db.query(models.Match).all()
    if not matches:
        await sync_real_world_data(db)
        matches = db.query(models.Match).all()

    now = datetime.datetime.utcnow()
    # Flexible timezone padded date ranges
    today_start = datetime.datetime(now.year, now.month, now.day, 0, 0, 0) - datetime.timedelta(hours=3)
    today_end = today_start + datetime.timedelta(days=1, hours=6)
    tomorrow_end = today_start + datetime.timedelta(days=2, hours=6)
    yesterday_start = today_start - datetime.timedelta(days=1)

    filtered = []
    for m in matches:
        m_date = m.match_date.replace(tzinfo=None) if m.match_date.tzinfo else m.match_date
        
        # Timeframe filter
        if timeframe == "today":
            if not (today_start <= m_date < today_end) and m.status != "live":
                continue
        elif timeframe == "tomorrow":
            if not (today_end <= m_date < tomorrow_end):
                continue
        elif timeframe == "yesterday":
            if not (yesterday_start <= m_date < today_start):
                continue
        elif timeframe == "upcoming":
            if m_date < today_end:
                continue
        elif timeframe == "live":
            if m.status != "live":
                continue

        # League filter (ignore if league=='All')
        if league and league != "All" and league.lower() not in m.league.lower():
            continue

        # Search query filter
        if search:
            q = search.lower()
            if q not in m.home_team.lower() and q not in m.away_team.lower() and q not in m.league.lower():
                continue

        # Market filter
        if market == "value_bets":
            pred = m.predictions[0] if m.predictions else None
            if not pred or not pred.value_bet or pred.value_bet == "No Value Edge":
                continue
        elif market == "live":
            if m.status != "live":
                continue

        filtered.append(m)

    # Auto-resync fallback if filtering by today returns empty
    if timeframe == "today" and not filtered and not search and (not league or league == "All"):
        await sync_real_world_data(db)
        matches = db.query(models.Match).all()
        filtered = [m for m in matches if today_start <= (m.match_date.replace(tzinfo=None) if m.match_date.tzinfo else m.match_date) < today_end or m.status == "live"]

    return (filtered if filtered else matches)[skip : skip + limit]

@router.post("/sync", response_model=List[schemas.MatchResponse])
async def sync_matches(db: Session = Depends(get_db)):
    await sync_real_world_data(db)
    matches = db.query(models.Match).all()
    return matches

@router.get("/{match_id}", response_model=schemas.MatchResponse)
def read_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return match
