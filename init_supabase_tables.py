from app.db import supabase

def create_users_table():
    """
    在Supabase中创建用户表
    """
    try:
        # 检查表是否已存在
        try:
            response = supabase.table('users').select('*').limit(1).execute()
            print("✅ 用户表已存在")
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
                "password": "test_password"
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


def create_budget_records_table():
    """
    在Supabase中创建预算记录表
    """
    try:
        # 检查表是否已存在
        try:
            response = supabase.table('budget_records').select('*').limit(1).execute()
            print("✅ 预算记录表已存在")
            return True
        except Exception:
            # 表不存在，继续创建
            pass
        
        print("正在创建预算记录表...")
        
        # 创建一个临时记录来触发表的创建，包含description字段
        temp_record = {
            "username": "temp_user",
            "plan_id": "temp_plan",
            "category": "餐饮",
            "amount": 100.0,
            "description": "测试描述信息",
            "created_at": "2023-01-01T00:00:00Z"
        }
        # 插入临时记录以创建表结构
        result = supabase.table('budget_records').insert(temp_record).execute()
        
        # 删除临时记录
        if result.data:
            supabase.table('budget_records').delete().eq('username', 'temp_user').execute()
        
        print("✅ 预算记录表创建成功!")
        return True
        
    except Exception as e:
        print(f"创建预算记录表时出错: {e}")
        return False


def create_plans_table():
    """
    在Supabase中创建行程表
    """
    try:
        # 检查表是否已存在
        try:
            response = supabase.table('plans').select('*').limit(1).execute()
            print("✅ 行程表已存在")
            return True
        except Exception:
            # 表不存在，继续创建
            pass
        
        print("正在创建行程表...")
        
        # 创建一个临时记录来触发表的创建
        temp_plan = {
            "username": "temp_user",
            "title": "测试行程",
            "destination": "测试地点",
            "days": 3,
            "summary": "测试行程摘要",
            "plan": "{}",
            "daily_budget": "[]",
            "budget": "{}",
            "personalized_tips": "[]"
        }
        # 插入临时记录以创建表结构
        result = supabase.table('plans').insert(temp_plan).execute()
        
        # 删除临时记录
        if result.data:
            supabase.table('plans').delete().eq('user_name', 'temp_user').execute()
        
        print("✅ 行程表创建成功!")
        return True
        
    except Exception as e:
        print(f"创建行程表时出错: {e}")
        return False


def create_expenses_table():
    """
    在Supabase中创建费用表（已废弃，使用budget_records表替代）
    """
    print("⚠️  费用表已废弃，请使用budget_records表")
    return True


def main():
    if not supabase:
        print("❌ Supabase客户端未正确初始化")
        return False
        
    print("初始化Supabase数据库表...")
    success1 = create_users_table()
    success2 = create_budget_records_table()
    success3 = create_plans_table()
    # 不再创建expenses表，使用budget_records表替代
    success4 = True  # create_expenses_table() 已废弃
    
    if success1 and success2 and success3 and success4:
        print("✅ 初始化完成!")
        return True
    else:
        print("❌ 初始化失败!")
        return False

if __name__ == "__main__":
    main()