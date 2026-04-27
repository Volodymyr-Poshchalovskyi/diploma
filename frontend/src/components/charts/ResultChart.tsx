import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { BarChart2, Loader2 } from 'lucide-react';
import type { ComputeResult } from '../../types';

interface Props {
  result: ComputeResult | null;
  isLoading: boolean;
}

const toDb = (v: number) => v > 1e-6 ? 10 * Math.log10(v) : -60;

export default function ResultChart({ result, isLoading }: Props) {
  const [useDb, setUseDb] = useState(false);

  if (isLoading) {
    return (
      <div style={styles.placeholder}>
        <Loader2 size={48} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Розрахунок...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={styles.placeholder}>
        <BarChart2 size={48} color="#d1d5db" strokeWidth={1.5} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          Налаштуйте шари та натисніть <strong>Розрахувати</strong>
        </p>
      </div>
    );
  }

  // ... (весь інший код ResultChart залишається без змін)
  const chartData = result.frequencies.map((f, i) => {
    const R = result.R[i];
    const T = result.T[i];
    const A = result.A[i];
    return {
      freq: parseFloat(f.toFixed(3)),
      R: parseFloat((useDb ? toDb(R) : R * 100).toFixed(2)),
      T: parseFloat((useDb ? toDb(T) : T * 100).toFixed(2)),
      A: parseFloat((useDb ? toDb(A) : A * 100).toFixed(2)),
    };
  });

  const yDomain: [number, number] = useDb ? [-60, 0] : [0, 100];
  const yFormatter = (v: number) => useDb ? `${v} dB` : `${v}%`;
  const tooltipFormatter = (v: number) => useDb ? `${v.toFixed(1)} dB` : `${v.toFixed(1)}%`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>R / T / A vs Частота</h2>
        <button
          onClick={() => setUseDb(d => !d)}
          style={{
            padding: '4px 10px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            background: useDb ? 'var(--primary)' : '#fff',
            color: useDb ? '#fff' : 'var(--text-main)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          {useDb ? 'Linear' : 'dB Scale'}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="freq" label={{ value: 'Частота (ГГц)', position: 'insideBottom', offset: -15 }} tick={{ fontSize: 11 }} />
            <YAxis domain={yDomain} tickFormatter={yFormatter} tick={{ fontSize: 11 }} width={55} />
            <Tooltip formatter={(v: any) => tooltipFormatter(Number(v))} labelFormatter={l => `${l} ГГц`} />
            <Legend verticalAlign="top" />
            <ReferenceLine y={useDb ? -15 : 50} stroke="#ccc" strokeDasharray="4 4" label={{ value: useDb ? '-15 dB' : '50%', fontSize: 10, fill: '#bbb', position: 'right' }} />
            <Line type="monotone" dataKey="R" stroke="#ef4444" dot={false} strokeWidth={2} name="Відбиття R" />
            <Line type="monotone" dataKey="T" stroke="#10b981" dot={false} strokeWidth={2} name="Пропускання T" />
            <Line type="monotone" dataKey="A" stroke="#3b82f6" dot={false} strokeWidth={2} name="Поглинання A" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  placeholder: {
    height: '100%',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-page)',
    borderRadius: 'var(--radius-md)',
    border: '2px dashed var(--border-color)',
  },
};