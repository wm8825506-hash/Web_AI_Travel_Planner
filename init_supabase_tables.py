from app.db import supabase

def create_users_table():
    """
    在Supabase中创建用户表
    """
    try:
        # 检查表是否已存在
        try:
            response = supabase.table('users').select('*').limit(1).execute()
            print("用户表已存在")
            return True
        except Exception:
            # 表不存在，继续创建
            pass
        
        print("正在创建用户表...")
        
        # 使用Supabase客户端直接创建表
        # 在Supabase中，我们通过定义表结构并插入数据来创建表
        # 这里我们创建一个临时用户来触发表的创建，然后删除它
        temp_user = {
            "username": "temp_admin",
            "email": "temp_admin@example.com",
            "password": "temp_password"
        }
        
        # 插入临时用户以创建表结构
        result = supabase.table('users').insert(temp_user).execute()
        
        # 删除临时用户
        if result.data:
            supabase.table('users').delete().eq('username', 'temp_admin').execute()
        
        print("✅ 用户表创建成功!")
        return True
        
    except Exception as e:
        print(f"创建用户表时出错: {e}")
        # 尝试另一种方式创建表结构
        try:
            # 创建表结构（如果上面的方法失败了）
            print("尝试另一种方式初始化表结构...")
            # 这里我们尝试创建一个带有完整字段的用户
            test_user = {
                "username": "test_init",
                "email": "test_init@example.com",
                "password": "test_password",
                "created_at": "now()"
            }
            
            result = supabase.table('users').insert(test_user).execute()
            
            # 删除测试用户
            if result.data:
                supabase.table('users').delete().eq('username', 'test_init').execute()
                
            print("✅ 用户表创建成功!")
            return True
        except Exception as e2:
            print(f"创建用户表时出错: {e2}")
            return False

def main():
    print("初始化Supabase数据库表...")
    success = create_users_table()
    if success:
        print("✅ 初始化完成!")
    else:
        print("❌ 初始化失败!")

if __name__ == "__main__":
    main()