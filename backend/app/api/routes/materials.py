from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.api.deps import get_supabase_client, get_current_user

router = APIRouter()

class MaterialIn(BaseModel):
    name: str
    eps_real: float
    eps_imag: float = 0.0
    mu_real: float = 1.0
    mu_imag: float = 0.0

@router.get("")
def get_materials(user=Depends(get_current_user)):
    supabase = get_supabase_client()
    # Public materials
    pub = supabase.table("materials").select("*").eq("is_custom", False).order("name").execute()
    # User's custom materials
    custom = supabase.table("materials").select("*").eq("is_custom", True).eq("user_id", user["id"]).order("name").execute()
    return (pub.data or []) + (custom.data or [])

@router.post("")
def create_material(body: MaterialIn, user=Depends(get_current_user)):
    supabase = get_supabase_client()
    res = supabase.table("materials").insert({
        "name":     body.name,
        "eps_real": body.eps_real,
        "eps_imag": body.eps_imag,
        "mu_real":  body.mu_real,
        "mu_imag":  body.mu_imag,
        "is_custom": True,
        "user_id":  user["id"],
    }).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create material")
    return res.data[0]

@router.put("/{material_id}")
def update_material(material_id: str, body: MaterialIn, user=Depends(get_current_user)):
    supabase = get_supabase_client()
    # Verify ownership
    check = supabase.table("materials").select("user_id").eq("id", material_id).single().execute()
    if not check.data or check.data["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your material")
    res = supabase.table("materials").update({
        "name":     body.name,
        "eps_real": body.eps_real,
        "eps_imag": body.eps_imag,
        "mu_real":  body.mu_real,
        "mu_imag":  body.mu_imag,
    }).eq("id", material_id).execute()
    return res.data[0]

@router.delete("/{material_id}")
def delete_material(material_id: str, user=Depends(get_current_user)):
    supabase = get_supabase_client()
    check = supabase.table("materials").select("user_id").eq("id", material_id).single().execute()
    if not check.data or check.data["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not your material")
    supabase.table("materials").delete().eq("id", material_id).execute()
    return {"ok": True}