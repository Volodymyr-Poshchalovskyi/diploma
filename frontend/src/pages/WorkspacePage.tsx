import { useState } from 'react';
import { Layers, BarChart2, Play, Save } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { computeForward } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

import LayerBuilder from '../components/layers/LayerBuilder';
import ComputeSettings from '../components/layers/ComputeSettings';
import InversePanel from '../components/layers/InversePanel';
import SweepPanel from '../components/sweep/SweepPanel';
import ResultChart from '../components/charts/ResultChart';
import SweepChart from '../components/sweep/SweepChart';

type Tab = 'layers' | 'analysis';

export default function WorkspacePage() {
  const { user } = useAuth();
  
  // Дістаємо ВСЕ зі стора
  const { 
    layers, result, sweepResult, isLoading, projectName, settings,
    setResult, setLoading, setProjectName, updateSettings 
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<Tab>('layers');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getBaseReq = () => ({
    layers: layers.map(({ thickness_mm, eps_real, eps_imag, mu_real, mu_imag }) => ({
      thickness_mm, eps_real, eps_imag, mu_real, mu_imag,
    })),
    freq_start: settings.freqStart, freq_stop: settings.freqStop, freq_points: settings.freqPoints,
    mode: settings.mode, angle_deg: settings.angleDeg, polarization: settings.polarization, waveguide_a_mm: settings.waveguideA,
  });

  const handleCompute = async () => {
    if (layers.length === 0) return showToast('Додайте хоча б один шар', 'error');
    setLoading(true);
    try {
      setResult(await computeForward(getBaseReq()));
    } catch (e) {
      showToast('Помилка розрахунку. Перевірте консоль.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!user) return showToast('Потрібно увійти для збереження', 'error');
    setIsSaving(true);
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: projectName,
      config: { layers, settings },
    });
    setIsSaving(false);
    if (error) showToast('Помилка збереження: ' + error.message, 'error');
    else showToast('Проект успішно збережено!', 'success');
  };

  return (
    <div style={styles.container}>
      {/* КАСТОМНИЙ TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444', 
          color: '#fff', padding: '12px 20px', borderRadius: '8px', 
          fontSize: '0.85rem', fontWeight: 500, boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.msg}
        </div>
      )}
      
      <div style={styles.toolbar}>
        <input 
          value={projectName} 
          onChange={(e) => setProjectName(e.target.value)} 
          style={styles.projectNameInput}
          placeholder="Назва проекту..."
        />
        <button onClick={handleSaveProject} disabled={isSaving} style={styles.saveBtn}>
          <Save size={14} /> {isSaving ? 'Збереження...' : 'Зберегти проект'}
        </button>
      </div>

      <div style={styles.grid}>
        <aside style={styles.leftColumn}>
          <div style={styles.tabs}>
            <button onClick={() => setActiveTab('layers')} style={{ ...styles.tab, ...(activeTab === 'layers' ? styles.activeTab : {}) }}>
              <Layers size={14} /> Шари та Параметри
            </button>
            <button onClick={() => setActiveTab('analysis')} style={{ ...styles.tab, ...(activeTab === 'analysis' ? styles.activeTab : {}) }}>
              <BarChart2 size={14} /> Аналіз
            </button>
          </div>

          <div style={styles.panelContent}>
            {activeTab === 'layers' ? (
              <>
                <LayerBuilder />
                <div style={styles.divider} />
                <ComputeSettings
                  mode={settings.mode} setMode={m => updateSettings({ mode: m })}
                  polarization={settings.polarization} setPolarization={p => updateSettings({ polarization: p })}
                  angleDeg={settings.angleDeg} setAngleDeg={a => updateSettings({ angleDeg: a })}
                  freqStart={settings.freqStart} setFreqStart={f => updateSettings({ freqStart: f })}
                  freqStop={settings.freqStop} setFreqStop={f => updateSettings({ freqStop: f })}
                  freqPoints={settings.freqPoints} setFreqPoints={p => updateSettings({ freqPoints: p })}
                  waveguideA={settings.waveguideA} setWaveguideA={w => updateSettings({ waveguideA: w })}
                />
              </>
            ) : (
              <>
                <InversePanel />
                <div style={styles.divider} />
                <SweepPanel getBaseReq={getBaseReq} />
              </>
            )}
          </div>

          <div style={styles.actionArea}>
            <button onClick={handleCompute} disabled={isLoading} style={styles.computeBtn}>
              {isLoading ? 'Розрахунок...' : <><Play size={16} fill="#fff" /> Розрахувати</>}
            </button>
          </div>
        </aside>

        <main style={styles.rightColumn}>
          <div style={styles.chartCard}>
            {activeTab === 'layers' ? (
              <ResultChart result={result} isLoading={isLoading} />
            ) : (
              sweepResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                  <SweepChart sweep={sweepResult} metric="R" />
                  <SweepChart sweep={sweepResult} metric="T" />
                  <SweepChart sweep={sweepResult} metric="A" />
                </div>
              ) : (
                <div style={styles.placeholder}>
                  <BarChart2 size={48} color="#d1d5db" strokeWidth={1.5} />
                  <p style={{ color: '#6b7280', marginTop: '1rem' }}>Запустіть Sweep для відображення графіків</p>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Залиш тут ті самі styles, що я давав у попередньому повідомленні!
const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', height: '100%' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' },
  projectNameInput: { border: 'none', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', outline: 'none', background: 'transparent', width: '300px' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', padding: 'var(--space-sm) var(--space-md)', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' },
  grid: { display: 'flex', gap: 'var(--space-md)', flex: 1, minHeight: 0 },
  leftColumn: { width: '360px', background: 'var(--bg-panel)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 },
  tabs: { display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#f9fafb' },
  tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xs)', padding: 'var(--space-sm)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500, borderBottom: '2px solid transparent' },
  activeTab: { color: 'var(--primary)', borderBottomColor: 'var(--primary)', background: 'var(--bg-panel)' },
  panelContent: { flex: 1, overflowY: 'auto', padding: 'var(--space-md)' },
  divider: { height: '1px', background: 'var(--border-color)', margin: 'var(--space-md) 0' },
  actionArea: { padding: 'var(--space-md)', borderTop: '1px solid var(--border-color)', background: 'var(--bg-panel)' },
  computeBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },
  rightColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', overflowY: 'auto' },
  chartCard: { background: 'var(--bg-panel)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minHeight: '100%' },
  placeholder: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }
};