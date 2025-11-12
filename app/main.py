from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.routers import home, auth, plan, speech, budget, expense
import os

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
app.include_router(auth.router, prefix="/auth")
app.include_router(plan.router, prefix="/plan")
app.include_router(speech.router, prefix="/speech")
app.include_router(budget.router, prefix="/budget")
app.include_router(expense.router, prefix="/expense")

# 只有在static目录存在时才挂载静态文件服务
if os.path.isdir("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")