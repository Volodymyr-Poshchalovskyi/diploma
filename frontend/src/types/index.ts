export interface Layer {
  id: string;
  thickness_mm: number;
  eps_real: number;
  eps_imag: number;
  mu_real: number;
  mu_imag: number;
  label?: string;
  name?: string; // for material library
}

export interface ForwardRequest {
  layers: Omit<Layer, 'id' | 'label'>[];
  freq_start: number;
  freq_stop: number;
  freq_points: number;
  mode: 'freespace' | 'waveguide';
  angle_deg?: number;
  polarization?: 'TE' | 'TM';
  waveguide_a_mm?: number;
}

export interface ComputeResult {
  frequencies: number[];
  R: number[];
  T: number[];
  A: number[];
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  eps_real: number;
  eps_imag: number;
  mu_real: number;
  mu_imag: number;
  is_builtin?: boolean;
  is_custom?: boolean;
  user_id?: string;
}

export interface SweepResultItem {
  value: number;
  frequencies: number[];
  R: number[];
  T: number[];
  A: number[];
}

export interface SweepResult {
  sweep_param: string;
  results: SweepResultItem[];
}