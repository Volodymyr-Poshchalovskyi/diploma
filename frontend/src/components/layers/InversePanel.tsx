import { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { computeInverse } from '../../lib/api';
import { Target, Settings2, Loader2, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';

interface TargetSpec {
  param: 'R' | 'T' | 'A';
  freq_start: number;
  freq_stop: number;
  target_db: number;
}

export default function InversePanel() {
  const { layers, setLayers, settings } = useProjectStore();
  const [targets, setTargets] = useState<TargetSpec[]>([
    { param: 'R', freq_start: 8, freq_stop: 12, target_db: -15 },
  ]);
  const [maxIter, setMaxIter] = useState(200);
  const [optimizeFlags, setOptimizeFlags] = useState<boolean[]>(layers.map(() => false));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addTarget = () => setTargets(t => [...t, { param: 'R', freq_start: 1, freq_stop: 18, target_db: -10 }]);
  const updateTarget = (i: number, key: keyof TargetSpec, val: any) => setTargets(t => t.map((x, idx) => idx === i ? { ...x, [key]: val } : x));

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const req = {
        layers: layers.map((l, i) => ({
          ...l,
          optimize_thickness: optimizeFlags[i] ?? false,
          thickness_min_mm: 0.1,
          thickness_max_mm: 10.0,
        })),
        targets,
        freq_start: settings.freqStart,
        freq_stop: settings.freqStop,
        freq_points: 100, // Для оптимізації можна брати менше точок
        mode: settings.mode,
        polarization: settings.polarization,
        angle_deg: settings.angleDeg,
        max_iterations: maxIter,
      };
      const data = await computeInverse(req);
      setResult(data);
      if (data.optimized_layers) {
        setLayers(data.optimized_layers.map((l: any, i: number) => ({
          ...layers[i],
          thickness_mm: l.thickness_mm,
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <h3 style={styles.title}>
        <Target size={16} /> Обернена задача
      </h3>
      <p style={styles.subtitle}>Оптимізація товщини шарів під цільові характеристики.</p>

      <div style={{ marginBottom: 'var(--space-sm)' }}>
        <p style={styles.label}>Оптимізувати товщину для:</p>
        {layers.map((l, i) => (
          <label key={l.id} style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={optimizeFlags[i] ?? false}
              onChange={e => setOptimizeFlags(f => f.map((x, idx) => idx === i ? e.target.checked : x))}
            />
            {l.label || `Шар ${i + 1}`}
          </label>
        ))}
      </div>

      <p style={styles.label}>Цільові параметри (dB):</p>
      {targets.map((t, i) => (
        <div key={i} style={styles.targetGrid}>
          <select value={t.param} onChange={e => updateTarget(i, 'param', e.target.value)} style={styles.input}>
            <option>R</option><option>T</option><option>A</option>
          </select>
          <input type="number" value={t.freq_start} onChange={e => updateTarget(i, 'freq_start', +e.target.value)} placeholder="Поч." style={styles.input} />
          <input type="number" value={t.freq_stop} onChange={e => updateTarget(i, 'freq_stop', +e.target.value)} placeholder="Кін." style={styles.input} />
          <input type="number" value={t.target_db} onChange={e => updateTarget(i, 'target_db', +e.target.value)} placeholder="dB" style={styles.input} />
        </div>
      ))}
      
      <button onClick={addTarget} style={styles.addBtn}>
        <Plus size={14} /> Додати умову
      </button>

      <div style={styles.iterRow}>
        <label style={styles.label}>Макс. ітерацій:</label>
        <input type="number" value={maxIter} onChange={e => setMaxIter(+e.target.value)} style={{ ...styles.input, width: '80px' }} />
      </div>

      <button onClick={run} disabled={running} style={styles.runBtn}>
        {running ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Settings2 size={16} />}
        {running ? 'Оптимізація...' : 'Запустити оптимізацію'}
      </button>

      {result && (
        <div style={{ ...styles.resultBox, background: result.success ? '#f0fdf4' : '#fef2f2', borderColor: result.success ? '#bbf7d0' : '#fecaca' }}>
          <p style={{ ...styles.resultTitle, color: result.success ? '#166534' : '#991b1b' }}>
            {result.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {result.success ? 'Зійшлося' : 'Досягнуто ліміт ітерацій'}
          </p>
          <p style={styles.resultText}>Cost: {result.cost?.toFixed(6)} · Ітер: {result.iterations}</p>
          <div style={{ marginTop: '8px' }}>
            {result.optimized_layers?.map((l: any, i: number) => (
              <p key={i} style={styles.resultText}>Шар {i + 1}: <strong>{l.thickness_mm} мм</strong></p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' },
  subtitle: { fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' },
  label: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' },
  
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '4px', cursor: 'pointer' },
  
  targetGrid: { display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: '4px', marginBottom: '6px' },
  input: { padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-main)', background: '#fff', width: '100%', boxSizing: 'border-box' },
  
  addBtn: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 'var(--space-md)', padding: 0, fontWeight: 500 },
  
  iterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' },
  
  runBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', transition: 'opacity 0.2s' },
  
  resultBox: { marginTop: 'var(--space-md)', padding: '12px', border: '1px solid', borderRadius: 'var(--radius-md)' },
  resultTitle: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px' },
  resultText: { margin: '2px 0', fontSize: '0.8rem', color: 'var(--text-main)' }
};