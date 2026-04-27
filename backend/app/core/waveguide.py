import numpy as np
import tmm


def _safe_n(eps: complex, mu: complex) -> complex:
    """Compute refractive index ensuring Im(n) >= 0 for passive media."""
    n = np.sqrt(eps * mu)
    if np.imag(n) < 0:
        n = -n
    return complex(n)


def run_waveguide(req) -> dict:
    freqs_ghz = np.linspace(req.freq_start, req.freq_stop, req.freq_points)
    freqs_hz  = freqs_ghz * 1e9
    a = (req.waveguide_a_mm or 22.86) * 1e-3

    n_list = [1.0]
    d_list = [np.inf]

    for layer in req.layers:
        # tmm uses e^{+ikx} convention: lossy media need positive imaginary parts
        eps = complex(layer.eps_real, +abs(layer.eps_imag))
        mu  = complex(layer.mu_real,  +abs(layer.mu_imag))
        n_list.append(_safe_n(eps, mu))
        d_list.append(layer.thickness_mm * 1e-3)

    n_list.append(1.0)
    d_list.append(np.inf)

    R_list, T_list, A_list = [], [], []

    for freq in freqs_hz:
        fc = 3e8 / (2.0 * a)

        # Below cutoff: total reflection, no propagation
        if freq <= fc:
            R_list.append(1.0)
            T_list.append(0.0)
            A_list.append(0.0)
            continue

        # TE10 equivalent angle: sin(theta) = fc/f
        theta      = float(np.arcsin(min(fc / freq, 1.0)))
        wavelength = float(3e8 / freq)

        res = tmm.coh_tmm("s", n_list, d_list, theta, wavelength)

        R = max(0.0, min(1.0, float(np.real(res["R"]))))
        T = max(0.0, min(1.0, float(np.real(res["T"]))))
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