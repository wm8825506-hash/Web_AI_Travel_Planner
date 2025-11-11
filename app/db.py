from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# 初始化Supabase客户端
def get_supabase_client():
    """
    获取Supabase客户端实例
    """
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return client
    except Exception as e:
        print(f"⚠️  Supabase客户端初始化失败: {e}")
        return None

# 使用Supabase客户端
engine = None
SessionLocal = None
Base = None
sqlalchemy_available = False

# 使用Supabase客户端进行数据库操作
def init_db():
    print("ℹ️  使用Supabase客户端进行数据库操作")
    # 实际的表创建在 init_supabase_tables.py 中通过Supabase客户端完成

# 全局Supabase客户端实例
supabase = get_supabase_client()

