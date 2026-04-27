import numpy as np
from scipy.optimize import differential_evolution
from app.core.tmm_solver import run_tmm


class _LayerProxy:
    """Lightweight layer object passed to run_tmm during optimization."""
    __slots__ = ('thickness_mm', 'eps_real', 'eps_imag', 'mu_real', 'mu_imag')

    def __init__(self, thickness_mm, eps_real, eps_imag, mu_real, mu_imag):
        self.thickness_mm = thickness_mm
        self.eps_real = eps_real
        self.eps_imag = eps_imag
        self.mu_real = mu_real
        self.mu_imag = mu_imag


class _ReqProxy:
    """Lightweight request object passed to run_tmm during optimization."""
    __slots__ = ('layers', 'freq_start', 'freq_stop', 'freq_points',
                 'mode', 'polarization', 'angle_deg', 'waveguide_a_mm')

    def __init__(self, req):
        self.freq_start = req.freq_start
        self.freq_stop = req.freq_stop
        self.freq_points = req.freq_points
        self.mode = req.mode
        self.polarization = req.polarization
        self.angle_deg = req.angle_deg
        self.waveguide_a_mm = req.waveguide_a_mm
        self.layers = []


def _cost_function(thicknesses: np.ndarray, layer_defs: list, req_proxy: _ReqProxy, targets: list) -> float:
    """Compute cost between simulated R/T/A and target specification."""
    thickness_idx = 0
    layers = []
    for layer in layer_defs:
        t = float(thicknesses[thickness_idx]) if layer['optimize'] else layer['thickness_mm']
        if layer['optimize']:
            thickness_idx += 1
        layers.append(_LayerProxy(
            thickness_mm=t,
            eps_real=layer['eps_real'],
            eps_imag=layer['eps_imag'],
            mu_real=layer['mu_real'],
            mu_imag=layer['mu_imag'],
        ))

    req_proxy.layers = layers
    result = run_tmm(req_proxy)

    freqs = np.array(result['frequencies'])
    cost = 0.0

    for spec in targets:
        mask = (freqs >= spec.freq_start) & (freqs <= spec.freq_stop)
        if not mask.any():
            continue
        values = np.clip(np.array(result[spec.param])[mask], 1e-9, 1.0)
        values_db = 10.0 * np.log10(values)
        # Penalty: sum of squared excess above target_db
        excess = values_db - spec.target_db
        cost += float(np.mean(np.maximum(excess, 0.0) ** 2))

    return cost


def run_optimization(req) -> dict:
    """Run differential evolution to find optimal layer thicknesses."""
    # Build serializable layer definitions (avoid Pydantic object mutation)
    layer_defs = [
        {
            'optimize': layer.optimize_thickness,
            'thickness_mm': layer.thickness_mm,
            'thickness_min_mm': layer.thickness_min_mm,
            'thickness_max_mm': layer.thickness_max_mm,
            'eps_real': layer.eps_real,
            'eps_imag': layer.eps_imag,
            'mu_real': layer.mu_real,
            'mu_imag': layer.mu_imag,
            'label': getattr(layer, 'label', 'Layer'),
        }
        for layer in req.layers
    ]

    bounds = [
        (ld['thickness_min_mm'], ld['thickness_max_mm'])
        for ld in layer_defs if ld['optimize']
    ]

    if not bounds:
        return {"error": "No layers marked for optimization"}

    req_proxy = _ReqProxy(req)

    result = differential_evolution(
        _cost_function,
        bounds=bounds,
        args=(layer_defs, req_proxy, req.targets),
        maxiter=req.max_iterations or 200,
        tol=1e-6,
        seed=42,
        popsize=12,
        mutation=(0.5, 1.5),
        recombination=0.7,
        # workers=1 removed — conflicts with FastAPI threadpool
    )

    opt_thicknesses = result.x.tolist()
    opt_idx = 0
    optimized_layers = []
    for ld in layer_defs:
        t = round(opt_thicknesses[opt_idx], 3) if ld['optimize'] else ld['thickness_mm']
        if ld['optimize']:
            opt_idx += 1
        optimized_layers.append({
            'thickness_mm': t,
            'eps_real': ld['eps_real'],
            'eps_imag': ld['eps_imag'],
            'mu_real': ld['mu_real'],
            'mu_imag': ld['mu_imag'],
            'label': ld['label'],
        })

    return {
        'success': bool(result.success),
        'cost': float(result.fun),
        'iterations': int(result.nit),
        'optimized_layers': optimized_layers,
    }