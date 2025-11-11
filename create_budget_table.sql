-- 创建 budget_records 表
CREATE TABLE IF NOT EXISTS budget_records (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_budget_records_username ON budget_records(username);
CREATE INDEX IF NOT EXISTS idx_budget_records_plan_id ON budget_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_budget_records_category ON budget_records(category);
CREATE INDEX IF NOT EXISTS idx_budget_records_created_at ON budget_records(created_at);