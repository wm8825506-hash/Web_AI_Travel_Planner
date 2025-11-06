from fastapi import APIRouter, Query

router = APIRouter(prefix="/map", tags=["Map"])

@router.get("/")
async def map_root():
    return {"message": "Map router is working"}

@router.get("/search")
async def search_location(keyword: str = Query(..., description="Location keyword")):
    # 这里可以接入真实地图API（如Google Maps或高德API）
    return {"keyword": keyword, "results": [f"Mock result for {keyword}"]}
