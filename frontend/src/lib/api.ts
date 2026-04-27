import axios from 'axios';
import type { ForwardRequest, ComputeResult } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const computeForward = async (req: ForwardRequest): Promise<ComputeResult> => {
  const { data } = await api.post<ComputeResult>('/api/compute/forward', req);
  return data;
};

export const computeInverse = async (req: any): Promise<any> => {
  const { data } = await api.post('/api/optimize/', req);
  return data;
};

export const computeSweep = (req: any) =>
  fetch(`${API_URL}/api/compute/sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  }).then(r => r.json());

export default api;