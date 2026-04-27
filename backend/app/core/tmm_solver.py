import numpy as np
import tmm


def _safe_n(eps: complex, mu: complex) -> complex:
    """Compute refractive index with correct branch for passive media.
    
    tmm library uses e^{+ikx} convention, so Im(n) must be >= 0 for lossy media.
    """
    n = np.sqrt(eps * mu)
    # Ensure Im(n) >= 0 (passive, absorbing medium)
    if np.imag(n) < 0:
        n = -n
    return complex(n)


def run_tmm(req) -> dict:
    freqs_ghz = np.linspace(req.freq_start, req.freq_stop, req.freq_points)
    freqs_hz = freqs_ghz * 1e9

    # Build n_list and d_list: first/last entries are semi-infinite air
    n_list = [1.0]
    d_list = [np.inf]

    for layer in req.layers:
        # Use +j convention (tmm library uses e^{+ikx}): losses → positive Im part
        eps = complex(layer.eps_real, +abs(layer.eps_imag))
        mu  = complex(layer.mu_real,  +abs(layer.mu_imag))
        n_list.append(_safe_n(eps, mu))
        d_list.append(layer.thickness_mm * 1e-3)

    n_list.append(1.0)
    d_list.append(np.inf)

    pol_tmm   = "s" if req.polarization.upper() == "TE" else "p"
    angle_rad = float(np.deg2rad(req.angle_deg or 0.0))

    R_list, T_list, A_list = [], [], []

    for freq in freqs_hz:
        wavelength = float(3e8 / freq)
        res = tmm.coh_tmm(pol_tmm, n_list, d_list, angle_rad, wavelength)

        R = float(np.real(res["R"]))
        T = float(np.real(res["T"]))

        # Clamp small numerical noise
        R = max(0.0, min(1.0, R))
        T = max(0.0, min(1.0, T))
        A = max(0.0, min(1.0, 1.0 - R - T))

        R_list.append(R)
        T_list.append(T)
        A_list.append(A)

    return {
        "frequencies": freqs_ghz.tolist(),
        "R": R_list,
        "T": T_list,
        "A": A_list,
    }