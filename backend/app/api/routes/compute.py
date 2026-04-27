import copy
import numpy as np
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.tmm_solver import run_tmm
from app.core.waveguide import run_waveguide
from app.api.deps import get_current_user

router = APIRouter()


class Layer(BaseModel):
    thickness_mm: float
    eps_real: float
    eps_imag: float
    mu_real: float
    mu_imag: float


class ForwardRequest(BaseModel):
    layers: list[Layer]
    freq_start: float
    freq_stop: float
    freq_points: int
    mode: str
    angle_deg: Optional[float] = 0.0
    polarization: Optional[str] = "TE"
    waveguide_a_mm: Optional[float] = 22.86


class SweepRequest(ForwardRequest):
    sweep_layer_index: int = 0
    sweep_param: str = "thickness_mm"
    sweep_start: float = 1.0
    sweep_stop: float = 5.0
    sweep_step: float = 1.0


@router.post("/forward")
def forward_problem(req: ForwardRequest, user=Depends(get_current_user)):
    if req.mode == "waveguide":
        return run_waveguide(req)
    return run_tmm(req)


@router.post("/sweep")
def sweep(req: SweepRequest, user=Depends(get_current_user)):
    values = np.arange(req.sweep_start, req.sweep_stop + req.sweep_step * 0.5, req.sweep_step)
    results = []

    for val in values:
        modified = copy.deepcopy(req)
        layer = modified.layers[req.sweep_layer_index]
        setattr(layer, req.sweep_param, float(val))

        data = run_waveguide(modified) if modified.mode == "waveguide" else run_tmm(modified)
        results.append({"value": round(float(val), 4), **data})

    return {"sweep_param": req.sweep_param, "results": results}