import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { ComputeResult } from '../../types';

interface Props {
  result: ComputeResult | null;
  isLoading: boolean;
}

// Convert linear power ratio to dB, floor at -60 dB
const toDb = (v: number) => v > 1e-6 ? 10 * Math.log10(v) : -60;

export default function ResultChart({ result, isLoading }: Props) {
  const [useDb, setUseDb] = useState(false);

  if (isLoading) {
    return (
      <div style={s.placeholder}>
        <span style={{ fontSize: '2rem' }}>⏳</span>
        <p>Computing...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={s.placeholder}>
        <span style={{ fontSize: '2rem' }}>📊</span>
        <p style={{ color: '#888' }}>Configure layers and click <strong>Run Calculation</strong></p>
      </div>
    );
  }

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>R / T / A vs Frequency</h2>
        <button
          onClick={() => setUseDb(d => !d)}
          style={{
            padding: '0.3rem 0.75rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            background: useDb ? '#01696f' : '#f5f5f5',
            color: useDb ? '#fff' : '#444',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {useDb ? '↩ Linear' : '📉 dB'}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="freq"
            label={{ value: 'Frequency (GHz)', position: 'insideBottom', offset: -15 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={yDomain}
            tickFormatter={yFormatter}
            tick={{ fontSize: 11 }}
            width={55}
          />
          <Tooltip
            formatter={(v: number) => tooltipFormatter(v)}
            labelFormatter={l => `${l} GHz`}
          />
          <Legend verticalAlign="top" />
          <ReferenceLine y={useDb ? -15 : 50} stroke="#ccc" strokeDasharray="4 4" label={{ value: useDb ? '-15 dB' : '50%', fontSize: 10, fill: '#bbb', position: 'right' }} />
          <Line type="monotone" dataKey="R" stroke="#e53e3e" dot={false} strokeWidth={2} name="Reflection R" />
          <Line type="monotone" dataKey="T" stroke="#38a169" dot={false} strokeWidth={2} name="Transmission T" />
          <Line type="monotone" dataKey="A" stroke="#3182ce" dot={false} strokeWidth={2} name="Absorption A" />
        </LineChart>
      </ResponsiveContainer>

      <p style={{ fontSize: '0.72rem', color: '#aaa', marginTop: '0.5rem', textAlign: 'right' }}>
        {useDb ? 'dB scale: 10·log₁₀(ratio), floor −60 dB' : 'Linear scale: % of incident power'}
      </p>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  placeholder: {
    height: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
    borderRadius: '12px',
    border: '2px dashed #e0e0e0',
  },
};