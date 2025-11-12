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

# 初始化数据库
init_db()

# 注册路由
app.include_router(home.router, prefix="")
app.include_router(auth.router, prefix="/auth")
app.include_router(plan.router, prefix="/plan")
app.include_router(speech.router, prefix="/speech")
app.include_router(budget.router, prefix="/budget")
app.include_router(expense.router, prefix="/expense")

# 检查是否在 Docker 环境中运行
def is_running_in_docker():
    return os.path.exists('/.dockerenv') or os.path.exists('/app/static/.docker')

# 只在 Docker 环境中且 static 目录存在时才挂载静态文件
# 在开发环境中不挂载，避免干扰
if is_running_in_docker() and os.path.isdir("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

# 健康检查端点
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}