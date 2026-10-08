from fastapi import APIRouter
from app.services.routing import get_route

router = APIRouter(prefix="/api/routes", tags=["routes"])

@router.get("")
def calculate_route(from_lat: float, from_lng: float, to_lat: float, to_lng: float):
    return get_route(from_lat, from_lng, to_lat, to_lng)
