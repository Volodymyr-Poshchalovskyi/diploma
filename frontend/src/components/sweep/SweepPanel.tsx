import { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { computeSweep } from '../../lib/api';
import type { ForwardRequest } from '../../types';
import { Play } from 'lucide-react';

interface Props {
  getBaseReq: () => ForwardRequest;
}

const SWEEP_PARAMS = [
  { value: 'thickness_mm', label: 'Товщина (мм)' },
  { value: 'eps_real',     label: "ε' (Real Permittivity)" },
  { value: 'eps_imag',     label: 'ε" (Imag Permittivity)' },
  { value: 'mu_real',      label: "μ' (Real Permeability)" },
  { value: 'mu_imag',      label: 'μ" (Imag Permeability)' },
];

export default function SweepPanel({ getBaseReq }: Props) {
  const { layers, setSweepResult } = useProjectStore();
  const [layerIdx, setLayerIdx]   = useState(0);
  const [param, setParam]         = useState('thickness_mm');
  const [start, setStart]         = useState(1);
  const [stop, setStop]           = useState(5);
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);

  // Кастомний алерт
  const [errorMsg, setErrorMsg] = useState('');

  const run = async () => {
    setErrorMsg('');
    if (layers.length === 0) return setErrorMsg('Додайте хоча б один шар');
    const steps = Math.round((stop - start) / step) + 1;
    if (steps > 20) return setErrorMsg('Забагато кроків (максимум 20)');
    
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
      setErrorMsg('Помилка виконання Sweep');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={styles.title}>📈 Розгортка (Sweep)</h3>
      <p style={styles.subtitle}>Аналіз впливу одного параметра на результат.</p>
      
      {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

      <div style={styles.formGroup}>
        <label style={styles.label}>Цільовий шар</label>
        <select value={layerIdx} onChange={e => setLayerIdx(+e.target.value)} style={styles.input}>
          {layers.map((l, i) => <option key={l.id} value={i}>{i + 1}. {l.label || l.name || 'Без назви'}</option>)}
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Параметр для зміни</label>
        <select value={param} onChange={e => setParam(e.target.value)} style={styles.input}>
          {SWEEP_PARAMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div style={styles.grid}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Початок</label>
          <input type="number" step="any" value={start} onChange={e => setStart(+e.target.value)} style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Кінець</label>
          <input type="number" step="any" value={stop} onChange={e => setStop(+e.target.value)} style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Крок</label>
          <input type="number" step="any" value={step} onChange={e => setStep(+e.target.value)} style={styles.input} />
        </div>
      </div>

      <button onClick={run} disabled={loading} style={styles.btn}>
        {loading ? 'Виконання...' : <><Play size={14} /> Запустити Sweep</>}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' },
  subtitle: { fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' },
  errorBox: { background: '#fee2e2', color: '#dc2626', padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: 'var(--space-md)' },
  
  formGroup: { marginBottom: 'var(--space-sm)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' },
  
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  input: { width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-main)', background: '#fff', boxSizing: 'border-box' },
  
  btn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#059669', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', transition: 'opacity 0.2s' }
};