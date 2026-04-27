import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComputeResult, SweepResult, Layer } from '../../types';
import ShareButton from '../share/ShareButton';
import SharedLinksList from '../share/SharedLinksList';

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

export default function ExportPanel({ result, sweepResult, layers, projectName, settings }: Props) {
  const [exporting, setExporting] = useState<string | null>(null);

  // ── CSV ──────────────────────────────────────────────────────────────────
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

  // ── XLSX ─────────────────────────────────────────────────────────────────
  const exportXLSX = async () => {
    if (!result) return;
    setExporting('xlsx');
    try {
      // Dynamically load SheetJS from CDN
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

      // Column widths
      ws['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];

      XLSX.utils.book_append_sheet(wb, ws, 'Results');

      // Layers sheet
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

  // ── JSON Project Export ───────────────────────────────────────────────────
  const exportJSON = () => {
    const project = {
      name: projectName,
      exportedAt: new Date().toISOString(),
      settings,
      layers: layers.map(({ id, ...l }) => l),
    };
    downloadText(JSON.stringify(project, null, 2), `${projectName || 'project'}.json`, 'application/json');
  };

  // ── JSON Project Import ───────────────────────────────────────────────────
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
          // Dispatch custom event — DashboardPage will handle it
          window.dispatchEvent(new CustomEvent('import-project', { detail: data }));
        } catch {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // ── PDF ───────────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!result) return;
    setExporting('pdf');
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const toDb = (v: number) => v > 1e-6 ? (10 * Math.log10(v)).toFixed(2) : '-60.00';
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(1, 105, 111);
      doc.rect(0, 0, pageW, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('⚡ Composite EM — Simulation Report', 14, 14);

      // Meta
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 30;
      doc.text(`Project: ${projectName || 'Unnamed'}`, 14, y);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y + 6);
      doc.text(`Mode: ${settings.mode}  |  Polarization: ${settings.polarization}  |  Angle: ${settings.angleDeg}°`, 14, y + 12);
      doc.text(`Frequency range: ${settings.freqStart}–${settings.freqStop} GHz`, 14, y + 18);

      // Layers table
      y += 28;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Layer Configuration', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['#', 'Name', 'd (mm)', "ε'", 'ε"', "μ'", 'μ"']],
        body: layers.map((l, i) => [
          i + 1, l.label || l.name || `Layer ${i + 1}`,
          l.thickness_mm, l.eps_real, l.eps_imag, l.mu_real, l.mu_imag,
        ]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [1, 105, 111] },
        margin: { left: 14, right: 14 },
      });

      // Results table (sampled every 10 points for readability)
      y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Simulation Results (sampled)', 14, y);
      y += 4;

      const step = Math.max(1, Math.floor(result.frequencies.length / 30));
      const sampledRows = result.frequencies
        .filter((_, i) => i % step === 0)
        .map((f, idx) => {
          const i = idx * step;
          return [
            f.toFixed(3),
            (result.R[i] * 100).toFixed(2) + '%',
            (result.T[i] * 100).toFixed(2) + '%',
            (result.A[i] * 100).toFixed(2) + '%',
            toDb(result.R[i]) + ' dB',
            toDb(result.T[i]) + ' dB',
            toDb(result.A[i]) + ' dB',
          ];
        });

      autoTable(doc, {
        startY: y,
        head: [['f (GHz)', 'R %', 'T %', 'A %', 'R dB', 'T dB', 'A dB']],
        body: sampledRows,
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [1, 105, 111] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Composite EM Platform  |  Page ${i} of ${pageCount}`, 14, 290);
      }

      doc.save(`${projectName || 'report'}.pdf`);
    } catch (e) {
      alert('PDF export failed. Check console.');
      console.error(e);
    } finally {
      setExporting(null);
    }
  };

  const hasResult = !!result;

  return (
    <div style={s.wrap}>
      <h3 style={s.title}>💾 EXPORT / IMPORT</h3>

      {/* Results export */}
      <p style={s.sectionLabel}>Results</p>
      <div style={s.btnRow}>
        <ExportBtn
          label="CSV"
          icon="📄"
          disabled={!hasResult}
          loading={exporting === 'csv'}
          onClick={exportCSV}
          color="#2563eb"
        />
        <ExportBtn
          label="XLSX"
          icon="📊"
          disabled={!hasResult}
          loading={exporting === 'xlsx'}
          onClick={exportXLSX}
          color="#16a34a"
        />
        <ExportBtn
          label="PDF"
          icon="📑"
          disabled={!hasResult}
          loading={exporting === 'pdf'}
          onClick={exportPDF}
          color="#dc2626"
        />
      </div>

      {!hasResult && (
        <p style={s.hint}>Run a calculation first to enable export</p>
      )}

      {/* Project JSON */}
      <p style={{ ...s.sectionLabel, marginTop: '0.75rem' }}>Project</p>
      <div style={s.btnRow}>
        <ExportBtn
          label="Export JSON"
          icon="⬇️"
          onClick={exportJSON}
          color="#7c3aed"
        />
        <ExportBtn
          label="Import JSON"
          icon="⬆️"
          onClick={importJSON}
          color="#0891b2"
        />
      </div>
      <p style={{ ...s.sectionLabel, marginTop: '0.75rem' }}>Share</p>
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

// ── Sub-components ────────────────────────────────────────────────────────

interface BtnProps {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  color: string;
}

function ExportBtn({ label, icon, onClick, disabled, loading, color }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        flex: 1,
        padding: '0.45rem 0.25rem',
        border: `1px solid ${disabled ? '#e5e5e5' : color}`,
        borderRadius: '6px',
        background: disabled ? '#f9f9f9' : '#fff',
        color: disabled ? '#bbb' : color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.78rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        transition: 'all 0.15s',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? '⏳' : icon} {label}
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

const s: Record<string, React.CSSProperties> = {
  wrap:         { borderTop: '1px solid #eee', paddingTop: '1rem' },
  title:        { fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em', marginBottom: '0.75rem', color: '#444' },
  sectionLabel: { fontSize: '0.72rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
  btnRow:       { display: 'flex', gap: '0.5rem' },
  hint:         { fontSize: '0.72rem', color: '#bbb', marginTop: '0.4rem', textAlign: 'center' },
};