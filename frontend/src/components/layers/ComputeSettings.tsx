interface Props {
  mode: 'freespace' | 'waveguide'; setMode: (v: 'freespace' | 'waveguide') => void;
  polarization: 'TE' | 'TM'; setPolarization: (v: 'TE' | 'TM') => void;
  angleDeg: number; setAngleDeg: (v: number) => void;
  freqStart: number; setFreqStart: (v: number) => void;
  freqStop: number; setFreqStop: (v: number) => void;
  freqPoints: number; setFreqPoints: (v: number) => void;
  waveguideA: number; setWaveguideA: (v: number) => void;
}

export default function ComputeSettings({ mode, setMode, polarization, setPolarization, angleDeg, setAngleDeg, freqStart, setFreqStart, freqStop, setFreqStop, freqPoints, setFreqPoints, waveguideA, setWaveguideA }: Props) {
  const s: React.CSSProperties = { width: '100%', padding: '0.3rem 0.4rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.85rem' };
  const row = (label: string, el: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
      <label style={{ fontSize: '0.8rem', color: '#555', minWidth: '110px' }}>{label}</label>
      {el}
    </div>
  );

  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#444' }}>Settings</h3>
      {row('Mode', (
        <select value={mode} onChange={e => setMode(e.target.value as 'freespace' | 'waveguide')} style={{ ...s, width: '110px' }}>
          <option value="freespace">Free space</option>
          <option value="waveguide">Waveguide</option>
        </select>
      ))}
      {mode === 'freespace' && row('Polarization', (
        <select value={polarization} onChange={e => setPolarization(e.target.value as 'TE' | 'TM')} style={{ ...s, width: '110px' }}>
          <option value="TE">TE</option>
          <option value="TM">TM</option>
        </select>
      ))}
      {mode === 'freespace' && row('Angle (°)', (
        <input type="number" min={0} max={89} step={1} value={angleDeg} onChange={e => setAngleDeg(Number(e.target.value))} style={{ ...s, width: '110px', textAlign: 'right' }} />
      ))}
      {mode === 'waveguide' && row('Width a (mm)', (
        <input type="number" step={0.1} value={waveguideA} onChange={e => setWaveguideA(Number(e.target.value))} style={{ ...s, width: '110px', textAlign: 'right' }} />
      ))}
      {row('Freq start (GHz)', (
        <input type="number" step={0.5} value={freqStart} onChange={e => setFreqStart(Number(e.target.value))} style={{ ...s, width: '110px', textAlign: 'right' }} />
      ))}
      {row('Freq stop (GHz)', (
        <input type="number" step={0.5} value={freqStop} onChange={e => setFreqStop(Number(e.target.value))} style={{ ...s, width: '110px', textAlign: 'right' }} />
      ))}
      {row('Points', (
        <input type="number" step={50} min={50} max={1000} value={freqPoints} onChange={e => setFreqPoints(Number(e.target.value))} style={{ ...s, width: '110px', textAlign: 'right' }} />
      ))}
    </div>
  );
}