# app/services/supabase_client.py
from supabase import create_client, Client
from app.config import settings
from typing import Union, Optional
import traceback

_supabase: Optional[Client] = None

def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        # 使用服务角色密钥以获得完整访问权限
        if settings.SUPABASE_SERVICE_ROLE_KEY:
            _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        else:
            # 如果没有服务角色密钥，则使用普通密钥
            _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase

def save_plan(user_name: str, data: dict) -> str:
    """
    data 需包含: destination, days, summary, plan, daily_budget, budget, personalized_tips
    """
    supabase = get_supabase()
    payload = {
        "username": user_name,
        "destination": data.get("destination"),
        "days": data.get("days"),
        "summary": data.get("summary"),
        "plan": data.get("plan"),
        "daily_budget": data.get("daily_budget"),
        "budget": data.get("budget"),
        "personalized_tips": data.get("personalized_tips"),
    }
    res = supabase.table("plans").insert(payload).execute()
    return res.data[0]["id"]

def list_plans(user_name: str) -> list[dict]:
    supabase = get_supabase()
    res = supabase.table("plans").select("*").eq("username", user_name).order("created_at", desc=True).execute()
    return res.data or []

def get_plan(plan_id: str) -> Optional[dict]:
    supabase = get_supabase()
    res = supabase.table("plans").select("*").eq("id", plan_id).limit(1).single().execute()
    return res.data

def add_expense(user_name: str, plan_id: str, category: str, amount: float, note: Optional[str] = None):
    supabase = get_supabase()
    payload = {
        "username": user_name,
        "plan_id": plan_id,
        "category": category,
        "amount": amount,
        "description": note,
    }
    supabase.table("budget_records").insert(payload).execute()

def update_expense(expense_id: str, user_name: str, plan_id: str, category: str, amount: float, note: Optional[str] = None):
    supabase = get_supabase()
    payload = {
        "username": user_name,
        "plan_id": plan_id,
        "category": category,
        "amount": amount,
        "description": note,
    }
    supabase.table("budget_records").update(payload).eq("id", expense_id).execute()

def delete_expense(expense_id: str):
    supabase = get_supabase()
    supabase.table("budget_records").delete().eq("id", expense_id).execute()

def list_expenses(plan_id: str) -> list[dict]:
    supabase = get_supabase()
    res = supabase.table("budget_records").select("*").eq("plan_id", plan_id).order("created_at").execute()
    return res.data or []
