from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.routers import home, auth, plan, speech

app = FastAPI(title="AI Travel Planner", version="0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化数据库
init_db()

# 注册路由
app.include_router(home.router, prefix="")
app.include_router(auth.router, prefix="")
app.include_router(plan.router, prefix="")
app.include_router(speech.router, prefix="")