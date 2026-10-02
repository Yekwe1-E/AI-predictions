from fastapi import APIRouter
from api.endpoints import matches, predictions, seed, auth, user

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(matches.router, prefix="/matches", tags=["matches"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(user.router, prefix="/user", tags=["user"])
api_router.include_router(seed.router, prefix="/seed", tags=["seed"])
