import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, Download, FileText, Table } from 'lucide-react';
import ResultChart from '../components/charts/ResultChart';
import type { ComputeResult, Layer } from '../types';

interface ShareData {
  project_name: string;
  layers: Layer[];
  settings: {
    mode: string;
    polarization: string;
    angleDeg: number;
    freqStart: number;
    freqStop: number;
  };
  result: ComputeResult;
  created_at: string;
}

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [data,    setData]    = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${API_URL}/api/share/${shareId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(setData)
      .catch(() => setError('Shared project not found or has expired.'))
      .finally(() => setLoading(false));
  }, [shareId]);

  const exportCSV = () => {
    if (!data?.result) return;
    const { frequencies, R, T, A } = data.result;
    const toDb = (v: number) => v > 1e-6 ? (10 * Math.log10(v)).toFixed(3) : '-60.000';
    const header = 'Frequency (GHz),R (linear),T (linear),A (linear),R (dB),T (dB),A (dB)';
    const rows = frequencies.map((f, i) =>
      [f.toFixed(4), R[i].toFixed(6), T[i].toFixed(6), A[i].toFixed(6),
       toDb(R[i]), toDb(T[i]), toDb(A[i])].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${data.project_name || 'shared'}.csv`;
    a.click();
  };

  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${data.project_name || 'shared'}.json`;
    a.click();
  };

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinnerLg} />
      <p style={{ color: '#6b7280', marginTop: '1rem' }}>Loading shared project...</p>
    </div>
  );

  if (error) return (
    <div style={s.center}>
      <p style={{ color: '#dc2626', fontWeight: 600 }}>{error}</p>
    </div>
  );

  if (!data) return null;

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="#01696f" strokeWidth={2.5} />
          <span style={s.logo}>Composite EM</span>
          <span style={s.badge}>Shared View</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportCSV} style={s.exportBtn}>
            <Table size={14} /> CSV
          </button>
          <button onClick={exportJSON} style={s.exportBtn}>
            <Download size={14} /> JSON
          </button>
        </div>
      </header>

      <div style={s.body}>
        {/* Left: info panel */}
        <aside style={s.info}>
          <h2 style={s.projectName}>{data.project_name || 'Untitled Project'}</h2>
          <p style={s.meta}>Shared {new Date(data.created_at).toLocaleDateString()}</p>

          <section style={s.section}>
            <h3 style={s.sectionTitle}>Settings</h3>
            <InfoRow label="Mode"          value={data.settings.mode} />
            <InfoRow label="Polarization"  value={data.settings.polarization} />
            <InfoRow label="Angle"         value={`${data.settings.angleDeg}°`} />
            <InfoRow label="Frequency"     value={`${data.settings.freqStart}–${data.settings.freqStop} GHz`} />
          </section>

          <section style={s.section}>
            <h3 style={s.sectionTitle}>Layers ({data.layers.length})</h3>
            {data.layers.map((l, i) => (
              <div key={i} style={s.layerCard}>
                <div style={s.layerIndex}>{i + 1}</div>
                <div style={s.layerDetails}>
                  <div style={s.layerName}>{(l as any).label || `Layer ${i + 1}`}</div>
                  <div style={s.layerParams}>
                    d = {l.thickness_mm} mm &nbsp;·&nbsp;
                    ε = {l.eps_real}{l.eps_imag ? `+${l.eps_imag}j` : ''} &nbsp;·&nbsp;
                    μ = {l.mu_real}{l.mu_imag ? `+${l.mu_imag}j` : ''}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <div style={s.readonlyNote}>
            <FileText size={13} />
            Read-only view — import JSON to edit
          </div>
        </aside>

        {/* Right: chart */}
        <main style={s.main}>
          <ResultChart result={data.result} isLoading={false} />
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.8rem' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root:        { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', background: '#f3f4f6' },
  center:      { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  spinnerLg:   { width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTop: '3px solid #01696f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.25rem', height: '52px', background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 20 },
  logo:        { fontWeight: 700, fontSize: '1rem', color: '#111827' },
  badge:       { fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '999px' },
  exportBtn:   { display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', color: '#374151' },
  body:        { display: 'flex', flex: 1, overflow: 'hidden' },
  info:        { width: '280px', minWidth: '280px', background: '#fff', borderRight: '1px solid #e5e7eb', padding: '1.25rem', overflowY: 'auto' as const },
  projectName: { fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem' },
  meta:        { fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 1.25rem' },
  section:     { marginBottom: '1.25rem' },
  sectionTitle:{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: '0.5rem' },
  layerCard:   { display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' },
  layerIndex:  { width: '20px', height: '20px', background: '#f0fdf4', color: '#166534', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  layerDetails:{ flex: 1 },
  layerName:   { fontSize: '0.82rem', fontWeight: 600, color: '#111827' },
  layerParams: { fontSize: '0.72rem', color: '#6b7280', marginTop: '0.15rem' },
  readonlyNote:{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#9ca3af', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', marginTop: '0.5rem' },
  main:        { flex: 1, padding: '1.5rem', overflowY: 'auto' as const },
};