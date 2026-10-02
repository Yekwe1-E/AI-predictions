import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

from models import database, models, schemas
from core import security
from sqlalchemy.orm import Session

def test_signup():
    db = database.SessionLocal()
    try:
        email = "diag_user@test.com"
        password = "password123"
        
        print(f"Testing signup for {email}...")
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            print("User already exists, deleting...")
            db.delete(user)
            db.commit()
        
        # Hash password
        print("Hashing password...")
        hashed_password = security.get_password_hash(password)
        print(f"Hashed: {hashed_password[:10]}...")
        
        # Create user
        print("Creating user object...")
        db_user = models.User(
            email=email,
            hashed_password=hashed_password,
        )
        
        print("Adding to DB...")
        db.add(db_user)
        print("Commiting...")
        db.commit()
        print("Refreshing...")
        db.refresh(db_user)
        
        print(f"SUCCESS: User created with ID {db_user.id}")
        
    except Exception as e:
        print(f"FAILURE: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_signup()
