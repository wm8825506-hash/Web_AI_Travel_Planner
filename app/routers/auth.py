from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserCreate, UserRead
from app.db import supabase
from passlib.context import CryptContext
from app.schemas.user import UserLogin
import hashlib

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 注册
@router.post("/register", response_model=UserRead)
def register(user: UserCreate):
    try:
        # 检查用户是否已存在
        # 修复Supabase查询语法
        username_check = supabase.table('users').select('*').eq('username', user.username).execute()
        email_check = supabase.table('users').select('*').eq('email', user.email).execute()
        
        if username_check.data or email_check.data:
            raise HTTPException(status_code=400, detail="Username or email already registered")
        
        # 对密码进行哈希处理
        hashed_password = pwd_context.hash(user.password[:72])  # 截断 72 字节
        
        # 插入新用户
        user_data = {
            "username": user.username,
            "email": user.email,
            "password": hashed_password
        }
        
        result = supabase.table('users').insert(user_data).execute()
        
        if result.data:
            new_user = result.data[0]
            return UserRead(
                id=new_user['id'],
                username=new_user['username'],
                email=new_user['email']
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
            
    except Exception as e:
        # 处理Supabase特定的错误
        if "Could not find the table" in str(e):
            raise HTTPException(status_code=500, detail="Database table not found. Please create the 'users' table in Supabase.")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
def login(user: UserLogin):
    try:
        # 查找用户
        response = supabase.table('users').select('*').eq('username', user.username).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Invalid username")
        
        db_user = response.data[0]
        
        # 验证密码
        if not pwd_context.verify(user.password[:72], db_user['password']):
            raise HTTPException(status_code=400, detail="Incorrect password")
        
        return {"message": f"User {db_user['username']} logged in successfully"}
        
    except Exception as e:
        # 处理Supabase特定的错误
        if "Could not find the table" in str(e):
            raise HTTPException(status_code=500, detail="Database table not found. Please create the 'users' table in Supabase.")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def auth_home():
    return {"message": "Auth route working!"}