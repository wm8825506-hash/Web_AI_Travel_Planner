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

# 尝试创建SQLAlchemy引擎（可能因为防火墙原因无法连接）
try:
    # 使用Supabase PostgreSQL数据库
    SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={
            "sslmode": "require",
            "connect_timeout": 5,  # 减少超时时间
        }
    )

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    sqlalchemy_available = True
except Exception as e:
    print(f"⚠️  SQLAlchemy连接初始化失败: {e}")
    print("将使用Supabase客户端进行数据库操作")
    engine = None
    SessionLocal = None
    Base = None
    sqlalchemy_available = False

# 创建所有表
def init_db():
    from app.models import user  # 导入模型
    if sqlalchemy_available and engine:
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ 数据库表创建成功!")
        except Exception as e:
            print(f"⚠️  数据库表创建失败: {e}")
            print("将使用Supabase客户端进行数据库操作")
    else:
        print("ℹ️  使用Supabase客户端进行数据库操作")

# 全局Supabase客户端实例
supabase = get_supabase_client()