from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from models.database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_vip = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")
    saved_bets = relationship("SavedBet", back_populates="user", cascade="all, delete-orphan")

class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, index=True)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="activities")

class SavedBet(Base):
    __tablename__ = "saved_bets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    match_id = Column(Integer, ForeignKey("matches.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="saved_bets")
    match = relationship("Match")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    home_team = Column(String, index=True)
    away_team = Column(String, index=True)
    match_date = Column(DateTime, index=True)
    league = Column(String, index=True)
    home_odds = Column(Float)
    draw_odds = Column(Float)
    away_odds = Column(Float)
    status = Column(String, default="upcoming")  # upcoming, live, finished
    venue = Column(String, nullable=True, default="Main Arena")
    weather_temp = Column(String, nullable=True, default="18°C")
    weather_desc = Column(String, nullable=True, default="Clear Sky")
    home_form = Column(String, nullable=True, default="W,W,D,W,L")
    away_form = Column(String, nullable=True, default="D,W,L,W,D")
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)

    predictions = relationship("Prediction", back_populates="match", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    ai_home_win_prob = Column(Float)
    ai_draw_prob = Column(Float)
    ai_away_win_prob = Column(Float)
    ai_over_2_5_prob = Column(Float)
    ai_btts_prob = Column(Float)
    confidence_score = Column(Float)
    risk_level = Column(String) # low, medium, high
    ai_explanation = Column(String)
    ai_suggested_score = Column(String) # e.g. "2-1"
    ht_ft_pred = Column(String, nullable=True, default="1/1")
    home_xg = Column(Float, nullable=True, default=1.5)
    away_xg = Column(Float, nullable=True, default=1.1)
    value_bet = Column(String, nullable=True, default="No Value Edge")
    top_scores = Column(String, nullable=True)
    h2h_data = Column(String, nullable=True)
    trends = Column(String, nullable=True)

    match = relationship("Match", back_populates="predictions")
