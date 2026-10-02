import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Read DATABASE_URL from environment (e.g. Supabase Postgres)
raw_db_url = os.getenv("DATABASE_URL", "")

if raw_db_url:
    # Fix legacy 'postgres://' scheme for SQLAlchemy 1.4+
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = raw_db_url
else:
    # Local fallback for development if DATABASE_URL is not set
    SQLALCHEMY_DATABASE_URL = "sqlite:///./betvision.db"

is_sqlite = "sqlite" in SQLALCHEMY_DATABASE_URL

connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,      # Automatically reconnects dropped Supabase pooler connections
    pool_recycle=300,        # Recycles connections every 5 mins
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
