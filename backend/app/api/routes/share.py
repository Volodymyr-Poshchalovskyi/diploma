# backend/app/api/routes/share.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from app.api.deps import get_current_user, get_supabase_client

router = APIRouter()

class ShareRequest(BaseModel):
    project_name: str = ""
    layers: list[Any]
    settings: dict
    result: dict

@router.post("")
def create_share(req: ShareRequest, user=Depends(get_current_user)):
    supabase = get_supabase_client()
    response = supabase.table("shared_results").insert({
        "user_id":      user["id"],
        "project_name": req.project_name,
        "layers":       req.layers,
        "settings":     req.settings,
        "result":       req.result,
    }).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create share")

    return {"share_id": response.data[0]["share_id"]}

@router.get("/{share_id}")
def get_share(share_id: str):
    supabase = get_supabase_client()
    response = supabase.table("shared_results") \
        .select("*") \
        .eq("share_id", share_id) \
        .single() \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Shared project not found")

    return response.data