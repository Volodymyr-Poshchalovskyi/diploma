import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { SweepResult } from '../../types';

interface Props {
  sweep: SweepResult | null;
  metric: 'R' | 'T' | 'A';
}

// Distinct colors for up to 20 sweep curves
const COLORS = [
  '#e63946','#2a9d8f','#e9c46a','#264653','#f4a261',
  '#457b9d','#a8dadc','#6d6875','#b5838d','#e76f51',
  '#52b788','#ff006e','#8338ec','#3a86ff','#fb5607',
  '#023047','#8ecae6','#219ebc','#ffb703','#d62828',
];

export default function SweepChart({ sweep, metric }: Props) {
  if (!sweep) return null;

  // Build chart data: [{freq, "1.0mm": val, "2.0mm": val, ...}]
  const freqs = sweep.results[0].frequencies;
  const chartData = freqs.map((f, i) => {
    const point: Record<string, number> = { freq: parseFloat(f.toFixed(3)) };
    sweep.results.forEach(r => {
      point[String(r.value)] = parseFloat((r[metric][i] * 100).toFixed(2));
    });
    return point;
  });

  const unit = sweep.sweep_param === 'thickness_mm' ? 'mm' : '';

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
        Sweep: {metric} vs Frequency — varying {sweep.sweep_param}
      </h2>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="freq"
            label={{ value: 'Frequency (GHz)', position: 'insideBottom', offset: -15 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11 }}
            width={45}
          />
          <Tooltip
            formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, `${name}${unit}`]}
            labelFormatter={l => `${l} GHz`}
          />
          <Legend verticalAlign="top" />
          {sweep.results.map((r, i) => (
            <Line
              key={r.value}
              type="monotone"
              dataKey={String(r.value)}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
              name={`${r.value}${unit}`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}