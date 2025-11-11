# app/routers/budget.py
from fastapi import APIRouter, HTTPException
from app.services.supabase_client import add_expense, list_expenses, update_expense, delete_expense
import traceback

router = APIRouter(tags=["Budget"])

@router.get("/summary/{plan_id}")
def get_budget_summary(plan_id: str):
    try:
        expenses = list_expenses(plan_id)
        total_amount = sum(expense["amount"] for expense in expenses)
        return {
            "success": True,
            "plan_id": plan_id,
            "total": total_amount,
            "items": expenses,
            "summary": {}  # 为了保持与前端兼容
        }
    except Exception as e:
        print(f"Error getting budget summary: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add")
def add_budget_record(record: dict):
    """
    record: { user, plan_id, category, amount, description? }
    """
    try:
        print(f"Received record data: {record}")
        
        # 检查必需字段
        if "plan_id" not in record or not record["plan_id"]:
            raise ValueError("Missing required field: plan_id")
        if "category" not in record or not record["category"]:
            raise ValueError("Missing required field: category")
        if "amount" not in record or not record["amount"]:
            raise ValueError("Missing required field: amount")
            
        add_expense(
            user_name=record.get("user"),  # 改为使用user字段并映射到user_name参数
            plan_id=record["plan_id"],
            category=record["category"],
            amount=float(record["amount"]),
            note=record.get("description"),  # 改为使用description字段
        )
        return {"success": True}
    except Exception as e:
        print(f"Error adding budget record: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/update")
def update_budget_record(record: dict):
    """
    record: { id, user, plan_id, category, amount, description? }
    """
    try:
        print(f"Received update record data: {record}")
        
        # 检查必需字段
        if "id" not in record or not record["id"]:
            raise ValueError("Missing required field: id")
        if "plan_id" not in record or not record["plan_id"]:
            raise ValueError("Missing required field: plan_id")
        if "category" not in record or not record["category"]:
            raise ValueError("Missing required field: category")
        if "amount" not in record or not record["amount"]:
            raise ValueError("Missing required field: amount")
            
        update_expense(
            expense_id=record["id"],
            user_name=record.get("user"),
            plan_id=record["plan_id"],
            category=record["category"],
            amount=float(record["amount"]),
            note=record.get("description"),
        )
        return {"success": True}
    except Exception as e:
        print(f"Error updating budget record: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/delete/{expense_id}")
def delete_budget_record(expense_id: str):
    """
    删除指定ID的支出记录
    """
    try:
        print(f"Deleting expense record with id: {expense_id}")
        delete_expense(expense_id)
        return {"success": True}
    except Exception as e:
        print(f"Error deleting budget record: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))