import React from 'react';

interface Props {
  mode: 'freespace' | 'waveguide'; setMode: (v: 'freespace' | 'waveguide') => void;
  polarization: 'TE' | 'TM'; setPolarization: (v: 'TE' | 'TM') => void;
  angleDeg: number; setAngleDeg: (v: number) => void;
  freqStart: number; setFreqStart: (v: number) => void;
  freqStop: number; setFreqStop: (v: number) => void;
  freqPoints: number; setFreqPoints: (v: number) => void;
  waveguideA: number; setWaveguideA: (v: number) => void;
}

export default function ComputeSettings({ 
  mode, setMode, polarization, setPolarization, angleDeg, setAngleDeg, 
  freqStart, setFreqStart, freqStop, setFreqStop, freqPoints, setFreqPoints, 
  waveguideA, setWaveguideA 
}: Props) {
  
  return (
    <div>
      <h3 style={styles.title}>Параметри розрахунку</h3>
      
      <div style={styles.grid}>
        {/* Тип середовища */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Режим</label>
          <select value={mode} onChange={e => setMode(e.target.value as 'freespace' | 'waveguide')} style={styles.input}>
            <option value="freespace">Вільний простір</option>
            <option value="waveguide">Хвилевод</option>
          </select>
        </div>

        {/* Специфічні налаштування режиму */}
        {mode === 'freespace' ? (
          <>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Поляризація</label>
              <select value={polarization} onChange={e => setPolarization(e.target.value as 'TE' | 'TM')} style={styles.input}>
                <option value="TE">TE</option>
                <option value="TM">TM</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Кут падіння (°)</label>
              <input type="number" min={0} max={89} step={1} value={angleDeg} onChange={e => setAngleDeg(Number(e.target.value))} style={styles.input} />
            </div>
          </>
        ) : (
          <div style={styles.inputGroup}>
            <label style={styles.label}>Ширина a (мм)</label>
            <input type="number" step={0.1} value={waveguideA} onChange={e => setWaveguideA(Number(e.target.value))} style={styles.input} />
          </div>
        )}
      </div>

      <div style={{ height: '1px', background: 'var(--border-color)', margin: 'var(--space-md) 0' }} />

      <h3 style={{...styles.title, marginBottom: 'var(--space-sm)'}}>Діапазон частот</h3>
      <div style={styles.grid}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Від (ГГц)</label>
          <input type="number" step={0.5} value={freqStart} onChange={e => setFreqStart(Number(e.target.value))} style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>До (ГГц)</label>
          <input type="number" step={0.5} value={freqStop} onChange={e => setFreqStop(Number(e.target.value))} style={styles.input} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>К-ть точок</label>
          <input type="number" step={50} min={50} max={2000} value={freqPoints} onChange={e => setFreqPoints(Number(e.target.value))} style={styles.input} />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { margin: '0 0 var(--space-md)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-sm)' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  input: { width: '100%', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-main)', background: '#fff', boxSizing: 'border-box' }
};