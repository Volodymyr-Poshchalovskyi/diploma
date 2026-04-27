// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { Layers, FlaskConical, BarChart2, Download, Play, LogOut, Zap, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProjectStore } from '../store/useProjectStore';
import { computeForward } from '../lib/api';
import type { ForwardRequest } from '../types';

import LayerBuilder     from '../components/layers/LayerBuilder';
import ComputeSettings  from '../components/layers/ComputeSettings';
import MaterialLibrary  from '../components/materials/MaterialLibrary';
import InversePanel     from '../components/layers/InversePanel';
import SweepPanel       from '../components/sweep/SweepPanel';
import ExportPanel      from '../components/export/ExportPanel';
import ProjectPanel     from '../components/project/ProjectPanel';
import ResultChart      from '../components/charts/ResultChart';
import SweepChart       from '../components/sweep/SweepChart';

type Tab = 'layers' | 'materials' | 'analysis';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'layers',    label: 'Layers',    icon: <Layers size={15} /> },
  { id: 'materials', label: 'Materials', icon: <FlaskConical size={15} /> },
  { id: 'analysis',  label: 'Analysis',  icon: <BarChart2 size={15} /> },
];

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { layers, result, sweepResult, isLoading, setResult, setLoading, setLayers } = useProjectStore();

  const [activeTab,    setActiveTab]    = useState<Tab>('layers');
  const [mode,         setMode]         = useState<'freespace' | 'waveguide'>('freespace');
  const [polarization, setPolarization] = useState<'TE' | 'TM'>('TE');
  const [angleDeg,     setAngleDeg]     = useState(0);
  const [freqStart,    setFreqStart]    = useState(1);
  const [freqStop,     setFreqStop]     = useState(18);
  const [freqPoints,   setFreqPoints]   = useState(200);
  const [waveguideA,   setWaveguideA]   = useState(22.86);
  const [projectName,  setProjectName]  = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      const data = (e as CustomEvent).detail;
      if (!data?.layers) return;
      setLayers(data.layers.map((l: any) => ({ ...l, id: crypto.randomUUID() })));
      if (data.settings) {
        const s = data.settings;
        if (s.mode)                     setMode(s.mode);
        if (s.polarization)             setPolarization(s.polarization);
        if (s.angleDeg  !== undefined)  setAngleDeg(s.angleDeg);
        if (s.freqStart !== undefined)  setFreqStart(s.freqStart);
        if (s.freqStop  !== undefined)  setFreqStop(s.freqStop);
        if (s.freqPoints !== undefined) setFreqPoints(s.freqPoints);
      }
      if (data.name) setProjectName(data.name);
    };
    window.addEventListener('import-project', handler);
    return () => window.removeEventListener('import-project', handler);
  }, [setLayers]);

  const getBaseReq = (): ForwardRequest => ({
    layers: layers.map(({ thickness_mm, eps_real, eps_imag, mu_real, mu_imag }) => ({
      thickness_mm, eps_real, eps_imag, mu_real, mu_imag,
    })),
    freq_start: freqStart, freq_stop: freqStop, freq_points: freqPoints,
    mode, angle_deg: angleDeg, polarization, waveguide_a_mm: waveguideA,
  });

  const handleCompute = async () => {
    if (layers.length === 0) { showToast('Add at least one layer first'); return; }
    setLoading(true);
    try {
      setResult(await computeForward(getBaseReq()));
    } catch (e) {
      showToast('Computation failed. Check console.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const settings = { mode, polarization, angleDeg, freqStart, freqStop };

  return (
    <div style={s.root}>
      {toast && <div style={s.toast}>{toast}</div>}

      <header style={s.header}>
        <div style={s.headerLeft}>
          <Zap size={18} color="#01696f" strokeWidth={2.5} />
          <span style={s.logoText}>Composite EM</span>
          {projectName && <span style={s.projectBadge}>{projectName}</span>}
        </div>
        <div style={s.headerRight}>
          <span style={s.email}>{user?.email}</span>
          <button onClick={signOut} style={s.signOutBtn}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      <div style={s.body}>
        <aside style={s.sidebar}>
          <nav style={s.tabBar}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ ...s.tabBtn, ...(activeTab === tab.id ? s.tabActive : {}) }}>
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div style={s.tabContent}>
            {activeTab === 'layers' && (
              <>
                <LayerBuilder />
                <div style={s.divider} />
                <ComputeSettings
                  mode={mode}               setMode={setMode}
                  polarization={polarization} setPolarization={setPolarization}
                  angleDeg={angleDeg}         setAngleDeg={setAngleDeg}
                  freqStart={freqStart}       setFreqStart={setFreqStart}
                  freqStop={freqStop}         setFreqStop={setFreqStop}
                  freqPoints={freqPoints}     setFreqPoints={setFreqPoints}
                  waveguideA={waveguideA}     setWaveguideA={setWaveguideA}
                />
              </>
            )}
            {activeTab === 'materials' && <MaterialLibrary layerId={layers[0]?.id || ''} />}
            {activeTab === 'analysis' && (
              <>
                <InversePanel />
                <div style={s.divider} />
                <SweepPanel getBaseReq={getBaseReq} />
              </>
            )}
          </div>

          <div style={s.computeWrap}>
            <button onClick={handleCompute} disabled={isLoading}
              style={{ ...s.computeBtn, opacity: isLoading ? 0.65 : 1 }}>
              {isLoading
                ? <><span style={s.spinner} /> Computing...</>
                : <><Play size={14} fill="#fff" /> Run Calculation</>}
            </button>
          </div>
        </aside>

        <main style={s.main}>
          {!result && !sweepResult ? (
            <div style={s.emptyState}>
              <BarChart2 size={44} color="#d1d5db" strokeWidth={1.5} />
              <p style={s.emptyTitle}>No results yet</p>
              <p style={s.emptyHint}>Configure layers and click <strong>Run Calculation</strong></p>
              <button onClick={() => setActiveTab('layers')} style={s.emptyAction}>
                Go to Layers <ChevronRight size={13} />
              </button>
            </div>
          ) : (
            <>
              <div id="result-chart-container">
                <ResultChart result={result} isLoading={isLoading} />
              </div>
              {sweepResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <SweepChart sweep={sweepResult} metric="R" />
                  <SweepChart sweep={sweepResult} metric="T" />
                  <SweepChart sweep={sweepResult} metric="A" />
                </div>
              )}
            </>
          )}
        </main>

        <aside style={s.rightSidebar}>
          <div style={s.rightSidebarHeader}>
            <Download size={14} color="#6b7280" />
            <span style={s.rightSidebarTitle}>Export & Share</span>
          </div>
          <div style={{ padding: '0.875rem', overflowY: 'auto', flex: 1 }}>
            <ProjectPanel projectName={projectName} setProjectName={setProjectName} />
            <div style={s.divider} />
            <ExportPanel
              result={result}
              sweepResult={sweepResult}
              layers={layers}
              projectName={projectName}
              settings={settings}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root:        { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', background: '#f3f4f6' },
  toast:       { position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, background: '#1f2937', color: '#fff', padding: '0.65rem 1.1rem', borderRadius: '8px', fontSize: '0.82rem', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.25rem', height: '50px', background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 20, flexShrink: 0 },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  logoText:    { fontWeight: 700, fontSize: '0.95rem', color: '#111827', letterSpacing: '-0.01em' },
  projectBadge:{ fontSize: '0.7rem', padding: '0.18rem 0.55rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '999px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  email:       { fontSize: '0.78rem', color: '#9ca3af' },
  signOutBtn:  { display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', color: '#6b7280' },
  body:        { display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 50px)' },
  sidebar:     { width: '280px', minWidth: '280px', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  tabBar:      { display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', flexShrink: 0 },
  tabBtn:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', padding: '0.5rem 0.2rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', fontSize: '0.62rem', fontWeight: 500, borderBottom: '2px solid transparent', transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden', minWidth: 0 },
  tabActive:   { color: '#01696f', borderBottom: '2px solid #01696f', background: '#fff' },
  tabContent:  { flex: 1, overflowY: 'auto' as const, padding: '0.875rem' },
  divider:     { height: '1px', background: '#f3f4f6', margin: '0.75rem 0' },
  computeWrap: { padding: '0.75rem', borderTop: '1px solid #f3f4f6', background: '#fff', flexShrink: 0 },
  computeBtn:  { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', background: '#01696f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  spinner:     { width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' },
  main:        { flex: 1, padding: '1.5rem', overflowY: 'auto' as const, minWidth: 0 },
  emptyState:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', color: '#9ca3af', textAlign: 'center' },
  emptyTitle:  { fontSize: '1rem', fontWeight: 600, color: '#374151', margin: 0 },
  emptyHint:   { fontSize: '0.82rem', margin: 0, color: '#6b7280' },
  emptyAction: { display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', padding: '0.45rem 0.9rem', background: '#01696f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' },
  rightSidebar:      { width: '260px', minWidth: '260px', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  rightSidebarHeader:{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem', borderBottom: '1px solid #f3f4f6', flexShrink: 0 },
  rightSidebarTitle: { fontSize: '0.75rem', fontWeight: 700, color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase' as const },
};