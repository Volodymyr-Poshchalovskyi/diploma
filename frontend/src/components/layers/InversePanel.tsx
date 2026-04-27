import { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { computeInverse } from '../../lib/api';

interface Target {
  param: 'R' | 'T' | 'A';
  freq_start: number;
  freq_stop: number;
  target_db: number;
}

export default function InversePanel() {
  const { layers, setLayers } = useProjectStore();
  const [targets, setTargets] = useState<Target[]>([
    { param: 'R', freq_start: 8, freq_stop: 12, target_db: -15 },
  ]);
  const [maxIter, setMaxIter] = useState(200);
  const [optimizeFlags, setOptimizeFlags] = useState<boolean[]>(layers.map(() => false));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addTarget = () =>
    setTargets(t => [...t, { param: 'R', freq_start: 1, freq_stop: 18, target_db: -10 }]);

  const updateTarget = (i: number, key: keyof Target, val: any) =>
    setTargets(t => t.map((x, idx) => idx === i ? { ...x, [key]: val } : x));

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
        freq_start: 1,
        freq_stop: 18,
        freq_points: 100,
        mode: 'freespace',
        polarization: 'TE',
        angle_deg: 0,
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
    <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#555' }}>
        🎯 Inverse Problem
      </h3>

      {/* Layer optimization flags */}
      <div style={{ marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem' }}>Optimize thickness of:</p>
        {layers.map((l, i) => (
          <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
            <input
              type="checkbox"
              checked={optimizeFlags[i] ?? false}
              onChange={e => setOptimizeFlags(f => f.map((x, idx) => idx === i ? e.target.checked : x))}
            />
            {l.label || `Layer ${i + 1}`}
          </label>
        ))}
      </div>

      {/* Targets */}
      <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem' }}>Targets:</p>
      {targets.map((t, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: '0.3rem', marginBottom: '0.4rem', alignItems: 'center' }}>
          <select value={t.param} onChange={e => updateTarget(i, 'param', e.target.value)} style={inp}>
            <option>R</option><option>T</option><option>A</option>
          </select>
          <input type="number" value={t.freq_start} onChange={e => updateTarget(i, 'freq_start', +e.target.value)} placeholder="f start" style={inp} />
          <input type="number" value={t.freq_stop} onChange={e => updateTarget(i, 'freq_stop', +e.target.value)} placeholder="f stop" style={inp} />
          <input type="number" value={t.target_db} onChange={e => updateTarget(i, 'target_db', +e.target.value)} placeholder="dB" style={inp} />
        </div>
      ))}
      <button onClick={addTarget} style={{ fontSize: '0.75rem', color: '#01696f', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '0.75rem' }}>
        + Add target
      </button>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.75rem', color: '#888' }}>Max iter:</label>
        <input type="number" value={maxIter} onChange={e => setMaxIter(+e.target.value)} style={{ ...inp, width: '70px' }} />
      </div>

      <button onClick={run} disabled={running} style={{ width: '100%', padding: '0.6rem', background: running ? '#aaa' : '#01696f', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: running ? 'default' : 'pointer' }}>
        {running ? '⏳ Optimizing...' : '🔍 Run Optimization'}
      </button>

      {result && (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: result.success ? '#f0faf4' : '#fff5f5', borderRadius: '6px', fontSize: '0.8rem' }}>
          <p>{result.success ? '✅ Converged' : '⚠️ Not fully converged'}</p>
          <p>Cost: {result.cost?.toFixed(6)} · Iter: {result.iterations}</p>
          {result.optimized_layers?.map((l: any, i: number) => (
            <p key={i}>Layer {i + 1}: <strong>{l.thickness_mm} mm</strong></p>
          ))}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  padding: '0.25rem 0.4rem', border: '1px solid #e0e0e0', borderRadius: '4px',
  fontSize: '0.75rem', width: '100%',
};