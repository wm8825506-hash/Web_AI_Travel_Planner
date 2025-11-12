
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


# 健康检查端点
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


# 检查是否在Docker环境中运行
def is_running_in_docker():
    return os.path.exists('/.dockerenv') or os.path.exists('/app/static/.docker')


# 挂载静态文件到 /static 路径
if is_running_in_docker() or os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static", html=True), name="static")


# 提供前端入口文件
@app.get("/")
async def serve_index():
    return FileResponse("static/index.html")


# SPA 回退路由 - 处理前端路由
@app.get("/{catch_all:path}")
async def serve_spa(catch_all: str):
    # 检查请求的路径是否以 API 开头，如果是则返回 404
    if catch_all.startswith(('api/', 'auth/', 'plan/', 'speech/', 'budget/', 'expense/')):
        raise HTTPException(status_code=404, detail="API route not found")

    # 检查请求的文件是否存在
    file_path = os.path.join("static", catch_all)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    # 对于前端路由，返回 index.html
    return FileResponse("static/index.html")