# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.routers import home, auth, plan, speech, budget, expense

app = FastAPI(title="AI Travel Planner", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# ✅ 统一加上 /api 前缀
app.include_router(home.router,    prefix="/api")
app.include_router(auth.router,    prefix="/api/auth")
app.include_router(plan.router,    prefix="/api/plan")
app.include_router(speech.router,  prefix="/api/speech")
app.include_router(budget.router,  prefix="/api/budget")
app.include_router(expense.router, prefix="/api/expense")

def is_running_in_docker() -> bool:
    return os.path.exists("/.dockerenv") or os.path.exists("/app/static/.docker")

# 健康检查保持 /api 路径
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

# 静态资源仅挂在 /static，避免覆盖 /api/*
if is_running_in_docker() and os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static", html=False), name="static")
