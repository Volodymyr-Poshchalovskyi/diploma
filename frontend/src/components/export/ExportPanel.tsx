import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Upload, FileText, FileSpreadsheet, FileJson, HardDriveDownload, Loader2 } from 'lucide-react';
import type { ComputeResult, SweepResult, Layer } from '../../types';
import ShareButton from '../share/ShareButton';
import SharedLinksList from '../share/SharedLinksList';
import { useProjectStore } from '../../store/useProjectStore';

interface Props {
  result: ComputeResult | null;
  sweepResult: SweepResult | null;
  layers: Layer[];
  projectName: string;
  settings: {
    mode: string;
    polarization: string;
    angleDeg: number;
    freqStart: number;
    freqStop: number;
  };
}

export default function ExportPanel({ result, layers, projectName, settings }: Props) {
  const [exporting, setExporting] = useState<string | null>(null);
  const { setLayers, setProjectName, updateSettings } = useProjectStore();

  const exportCSV = () => {
    if (!result) return;
    const header = 'Frequency (GHz),R (linear),T (linear),A (linear),R (dB),T (dB),A (dB)';
    const toDb = (v: number) => v > 1e-6 ? (10 * Math.log10(v)).toFixed(3) : '-60.000';
    const rows = result.frequencies.map((f, i) =>
      [
        f.toFixed(4),
        result.R[i].toFixed(6),
        result.T[i].toFixed(6),
        result.A[i].toFixed(6),
        toDb(result.R[i]),
        toDb(result.T[i]),
        toDb(result.A[i]),
      ].join(',')
    );
    downloadText([header, ...rows].join('\n'), `${projectName || 'result'}.csv`, 'text/csv');
  };

  const exportXLSX = async () => {
    if (!result) return;
    setExporting('xlsx');
    try {
      const XLSX = await loadSheetJS();
      const toDb = (v: number) => v > 1e-6 ? 10 * Math.log10(v) : -60;

      const wsData = [
        ['Frequency (GHz)', 'R (linear)', 'T (linear)', 'A (linear)', 'R (dB)', 'T (dB)', 'A (dB)'],
        ...result.frequencies.map((f, i) => [
          f, result.R[i], result.T[i], result.A[i],
          toDb(result.R[i]), toDb(result.T[i]), toDb(result.A[i]),
        ]),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Results');

      const layersData = [
        ['Layer', 'Thickness (mm)', "ε'", 'ε"', "μ'", 'μ"'],
        ...layers.map((l, i) => [i + 1, l.thickness_mm, l.eps_real, l.eps_imag, l.mu_real, l.mu_imag]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(layersData), 'Layers');

      XLSX.writeFile(wb, `${projectName || 'result'}.xlsx`);
    } finally {
      setExporting(null);
    }
  };

  const exportJSON = () => {
    const project = {
      name: projectName,
      exportedAt: new Date().toISOString(),
      settings,
      layers: layers.map(({ id, ...l }) => l),
    };
    downloadText(JSON.stringify(project, null, 2), `${projectName || 'project'}.json`, 'application/json');
  };

  const importJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          
          if (data.layers) {
            setLayers(data.layers.map((l: any) => ({ ...l, id: crypto.randomUUID() })));
          }
          if (data.settings) {
            updateSettings(data.settings);
          }
          if (data.name) {
            setProjectName(data.name);
          }
          alert('Проект імпортовано!'); // Тут можеш замінити на showToast, якщо хочеш
        } catch {
          alert('Помилка формату JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportPDF = async () => {
    if (!result) return;
    setExporting('pdf');
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      const pageW = doc.internal.pageSize.getWidth();

      doc.setFillColor(1, 105, 111);
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Composite EM - Simulation Report', 14, 14);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 30;
      doc.text(`Project: ${projectName || 'Unnamed'}`, 14, y);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y + 6);
      
      y += 20;
      autoTable(doc, {
        startY: y,
        head: [['#', 'Name', 'd (mm)', "e'", 'e"', "m'", 'm"']],
        body: layers.map((l, i) => [
          i + 1, l.label || l.name || `Layer ${i + 1}`,
          l.thickness_mm, l.eps_real, l.eps_imag, l.mu_real, l.mu_imag,
        ]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [1, 105, 111] },
      });

      doc.save(`${projectName || 'report'}.pdf`);
    } catch (e) {
      alert('PDF export failed.');
    } finally {
      setExporting(null);
    }
  };

  const hasResult = !!result;

  return (
    <div style={styles.wrap}>
      <h3 style={styles.title}>
        <HardDriveDownload size={14} /> Експорт та Імпорт
      </h3>

      <p style={styles.sectionLabel}>Результати</p>
      <div style={styles.btnRow}>
        <ExportBtn
          label="CSV"
          icon={<FileText size={14} />}
          disabled={!hasResult}
          loading={exporting === 'csv'}
          onClick={exportCSV}
        />
        <ExportBtn
          label="XLSX"
          icon={<FileSpreadsheet size={14} />}
          disabled={!hasResult}
          loading={exporting === 'xlsx'}
          onClick={exportXLSX}
        />
        <ExportBtn
          label="PDF"
          icon={<Download size={14} />}
          disabled={!hasResult}
          loading={exporting === 'pdf'}
          onClick={exportPDF}
        />
      </div>

      {!hasResult && <p style={styles.hint}>Розрахуйте проект для експорту</p>}

      <p style={{ ...styles.sectionLabel, marginTop: 'var(--space-md)' }}>Проект (JSON)</p>
      <div style={styles.btnRow}>
        <ExportBtn
          label="Експорт"
          icon={<FileJson size={14} />}
          onClick={exportJSON}
        />
        <ExportBtn
          label="Імпорт"
          icon={<Upload size={14} />}
          onClick={importJSON}
        />
      </div>

      <p style={{ ...styles.sectionLabel, marginTop: 'var(--space-md)' }}>Поділитися</p>
      <ShareButton
        result={result}
        layers={layers}
        projectName={projectName}
        settings={settings}
      />
      <SharedLinksList />
    </div>
  );
}

// ── ОНОВЛЕНИЙ СТИЛЬ КНОПОК ────────────────────────────────────────────────────────

interface BtnProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

function ExportBtn({ label, icon, onClick, disabled, loading }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        flex: 1,
        padding: '6px 4px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        background: disabled ? '#f9fafb' : '#fff',
        color: disabled ? '#9ca3af' : 'var(--text-main)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.75rem',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        transition: 'all 0.15s',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : icon}
      {label}
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function loadSheetJS() {
  return new Promise<any>((resolve, reject) => {
    if ((window as any).XLSX) return resolve((window as any).XLSX);
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
    script.onload = () => resolve((window as any).XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { paddingTop: 'var(--space-sm)' },
  title: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 var(--space-md)' },
  sectionLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' },
  btnRow: { display: 'flex', gap: '6px' },
  hint: { fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' },
};