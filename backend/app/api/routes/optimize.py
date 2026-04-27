from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from app.core.optimizer import run_optimization
from app.core.tmm_solver import run_tmm

router = APIRouter()


class LayerTemplate(BaseModel):
    thickness_mm: float = 3.0
    eps_real: float = 1.0
    eps_imag: float = 0.0
    mu_real: float = 1.0
    mu_imag: float = 0.0
    label: str = "Layer"
    optimize_thickness: bool = False
    thickness_min_mm: float = 0.1
    thickness_max_mm: float = 10.0


class OptimizationTarget(BaseModel):
    param: str = Field(..., description="'R', 'T', or 'A'")
    freq_start: float
    freq_stop: float
    target_db: float = Field(..., description="Target value in dB, e.g. -15 means < -15 dB")


class OptimizeRequest(BaseModel):
    layers: List[LayerTemplate]
    targets: List[OptimizationTarget]
    freq_start: float = 1.0
    freq_stop: float = 18.0
    freq_points: int = 100
    mode: str = "freespace"
    polarization: str = "TE"
    angle_deg: float = 0.0
    waveguide_a_mm: float = 22.86
    max_iterations: int = 200


@router.post("/")
def optimize(req: OptimizeRequest):
    return run_optimization(req)