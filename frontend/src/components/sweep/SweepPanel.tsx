import { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { computeSweep } from '../../lib/api';
import type { ForwardRequest } from '../../types';

interface Props {
  getBaseReq: () => ForwardRequest;
}

const SWEEP_PARAMS = [
  { value: 'thickness_mm', label: 'Thickness (mm)' },
  { value: 'eps_real',     label: "ε' (eps_real)" },
  { value: 'eps_imag',     label: 'ε" (eps_imag)' },
  { value: 'mu_real',      label: "μ' (mu_real)" },
  { value: 'mu_imag',      label: 'μ" (mu_imag)' },
];

export default function SweepPanel({ getBaseReq }: Props) {
  const { layers, setSweepResult } = useProjectStore();
  const [layerIdx, setLayerIdx]   = useState(0);
  const [param, setParam]         = useState('thickness_mm');
  const [start, setStart]         = useState(1);
  const [stop, setStop]           = useState(5);
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);

  const run = async () => {
    if (layers.length === 0) return alert('Add at least one layer');
    const steps = Math.round((stop - start) / step) + 1;
    if (steps > 20) return alert('Too many sweep steps (max 20)');
    setLoading(true);
    try {
      const data = await computeSweep({
        ...getBaseReq(),
        sweep_layer_index: layerIdx,
        sweep_param: param,
        sweep_start: start,
        sweep_stop: stop,
        sweep_step: step,
      });
      setSweepResult(data);
    } catch (e) {
      alert('Sweep failed');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <h3 style={s.title}>📈 SWEEP</h3>
      <div style={s.row}>
        <label style={s.label}>Layer</label>
        <select value={layerIdx} onChange={e => setLayerIdx(+e.target.value)} style={s.select}>
          {layers.map((l, i) => <option key={i} value={i}>{i + 1}. {l.name}</option>)}
        </select>
      </div>
      <div style={s.row}>
        <label style={s.label}>Parameter</label>
        <select value={param} onChange={e => setParam(e.target.value)} style={s.select}>
          {SWEEP_PARAMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div style={s.row}>
        <label style={s.label}>From</label>
        <input type="number" value={start} onChange={e => setStart(+e.target.value)} style={s.input} />
        <label style={s.label}>To</label>
        <input type="number" value={stop} onChange={e => setStop(+e.target.value)} style={s.input} />
        <label style={s.label}>Step</label>
        <input type="number" value={step} onChange={e => setStep(+e.target.value)} style={s.input} />
      </div>
      <button onClick={run} disabled={loading} style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Running...' : '📈 Run Sweep'}
      </button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap:   { borderTop: '1px solid #eee', paddingTop: '1rem' },
  title:  { fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em', marginBottom: '0.75rem', color: '#444' },
  row:    { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' },
  label:  { fontSize: '0.78rem', color: '#666', minWidth: '60px' },
  select: { flex: 1, padding: '0.3rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.8rem' },
  input:  { width: '60px', padding: '0.3rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'right' },
  btn:    { width: '100%', padding: '0.6rem', background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
};