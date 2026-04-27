import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Layer, ComputeResult, SweepResult } from '../types';

interface ProjectState {
  layers: Layer[];
  result: ComputeResult | null;
  sweepResult: SweepResult | null;
  isLoading: boolean;
  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  reorderLayers: (layers: Layer[]) => void;
  setLayers: (layers: Layer[]) => void;
  setResult: (result: ComputeResult | null) => void;
  setSweepResult: (s: SweepResult | null) => void;
  setLoading: (loading: boolean) => void;
  
}

const DEFAULT_LAYER: Omit<Layer, 'id'> = {
  thickness_mm: 3.0,
  eps_real: 1.0,
  eps_imag: 0.0,
  mu_real: 1.0,
  mu_imag: 0.0,
  label: 'New layer',
};

export const useProjectStore = create<ProjectState>((set) => ({
  layers: [{ ...DEFAULT_LAYER, id: uuidv4(), label: 'Layer 1' }],
  result: null,
  sweepResult: null,
  isLoading: false,

  addLayer: () =>
    set((state) => ({
      layers: [
        ...state.layers,
        { ...DEFAULT_LAYER, id: uuidv4(), label: `Layer ${state.layers.length + 1}` },
      ],
    })),

  removeLayer: (id) =>
    set((state) => ({ layers: state.layers.filter((l) => l.id !== id) })),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  reorderLayers: (layers) => set({ layers }),

  setLayers: (layers) => set({ layers }),

  setResult: (result) => set({ result }),
  setSweepResult: (sweepResult) => set({ sweepResult }),
  setLoading: (isLoading) => set({ isLoading }),
}));