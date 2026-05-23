import React, { useState } from 'react';
import { Download, X, FileText, FileJson, Code2, CheckCircle } from 'lucide-react';
import type {
  SimulationVitals,
  BurstMetrics,
  EthicsMetrics,
  Electrode,
  SpikeEvent,
  NeuronModel,
} from '../hooks/useWetwareSim';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface ExportPanelProps {
  vitals: SimulationVitals;
  burstMetrics: BurstMetrics;
  ethicsMetrics: EthicsMetrics;
  electrodes: Electrode[];
  rasterEvents: SpikeEvent[];
  modelType: NeuronModel;
  onClose: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildCsvContent(
  rasterEvents: SpikeEvent[],
  electrodes: Electrode[],
): string {
  const header = 'electrode_id,role,timestamp_ms';
  const roleMap = new Map<number, Electrode['role']>(
    electrodes.map((el) => [el.id, el.role]),
  );
  const rows = rasterEvents.map((ev) => {
    const role = roleMap.get(ev.electrodeId) ?? 'interneuron';
    return `${ev.electrodeId},${role},${ev.t.toFixed(2)}`;
  });
  return [header, ...rows].join('\n');
}

function buildJsonContent(
  vitals: SimulationVitals,
  burstMetrics: BurstMetrics,
  ethicsMetrics: EthicsMetrics,
  modelType: NeuronModel,
  electrodes: Electrode[],
): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    modelType,
    vitals,
    burstMetrics,
    ethicsMetrics: {
      phiProxy: ethicsMetrics.phiProxy,
      sentienceRisk: ethicsMetrics.sentienceRisk,
      welfareLevel: ethicsMetrics.welfareLevel,
      welfareLogEntries: ethicsMetrics.welfareLog.length,
    },
    electrodeStates: electrodes.map((el) => ({
      id: el.id,
      x: el.x,
      y: el.y,
      role: el.role,
      voltage_mV: el.voltage,
      spikeRate_Hz: el.spikeRate,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

function buildPythonSnippet(burstMetrics: BurstMetrics): string {
  return `import finalspark

client = finalspark.Client(api_key='YOUR_API_KEY')
organoid = client.get_organoid('MEA-SYN-001')

spikes = organoid.get_spike_events(window_ms=4000)
network_state = organoid.get_network_state()

# Returns: burst_freq=${burstMetrics.burstFrequency}, synchrony=${burstMetrics.synchronyScore}
# Example output:
# {
#   "burst_frequency": ${burstMetrics.burstFrequency},
#   "mean_ibi_s": ${burstMetrics.meanIBI},
#   "synchrony_score": ${burstMetrics.synchronyScore},
#   "network_bursting": ${String(burstMetrics.networkBursting)},
#   "total_bursts": ${burstMetrics.totalBursts}
# }

print(f"Burst freq: {network_state['burst_frequency']} bursts/min")
print(f"Synchrony:  {network_state['synchrony_score']:.2f}")
print(f"Spike events this window: {len(spikes)}")
`;
}

function triggerBlobDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const ExportPanel: React.FC<ExportPanelProps> = ({
  vitals,
  burstMetrics,
  ethicsMetrics,
  electrodes,
  rasterEvents,
  modelType,
  onClose,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // ── Derived content ──────────────────────────────────────────────
  const csvContent  = buildCsvContent(rasterEvents, electrodes);
  const jsonContent = buildJsonContent(vitals, burstMetrics, ethicsMetrics, modelType, electrodes);
  const pySnippet   = buildPythonSnippet(burstMetrics);

  const csvPreviewLines = csvContent.split('\n').slice(0, 5);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleDownloadCsv = () => {
    triggerBlobDownload(csvContent, 'spike_events.csv', 'text/csv');
  };

  const handleDownloadJson = () => {
    triggerBlobDownload(jsonContent, 'network_state.json', 'application/json');
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(pySnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    } catch {
      // Fallback: create a temporary textarea for older browsers
      const ta = document.createElement('textarea');
      ta.value = pySnippet;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    }
  };

  // ── Styles ───────────────────────────────────────────────────────
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(5,10,18,0.97)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '18px',
    padding: '28px 32px',
    width: 'min(680px, 95vw)',
    maxHeight: '90vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,240,255,0.04)',
  };

  const actionBtnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 18px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#fff',
    width: '100%',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  };

  const csvBtnStyle: React.CSSProperties = {
    ...actionBtnBase,
    borderColor: 'rgba(0,240,255,0.18)',
    color: 'var(--accent-cyan)',
  };

  const jsonBtnStyle: React.CSSProperties = {
    ...actionBtnBase,
    borderColor: 'rgba(168,85,247,0.18)',
    color: '#c084fc',
  };

  const pyBtnStyle: React.CSSProperties = {
    ...actionBtnBase,
    borderColor: copiedSnippet ? 'rgba(0,255,128,0.3)' : 'rgba(251,191,36,0.18)',
    color: copiedSnippet ? 'var(--accent-green)' : 'var(--accent-amber)',
    background: copiedSnippet ? 'rgba(0,255,128,0.05)' : 'rgba(255,255,255,0.03)',
  };

  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute' as const,
    top: '20px',
    right: '24px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '6px 8px',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.6)',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '0.6rem',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 700,
    letterSpacing: '0.6px',
    marginBottom: '10px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{ position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={panelStyle}>

          {/* Close button */}
          <button
            style={closeBtnStyle}
            onClick={onClose}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            aria-label="Close export panel"
          >
            <X size={14} />
          </button>

          {/* ── Title ─────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(0,240,255,0.05))',
                border: '1px solid rgba(0,240,255,0.18)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Download size={18} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <h2 style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '0.3px',
                margin: 0,
              }}>
                Export Lab Data
              </h2>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: 0, paddingLeft: '46px' }}>
              Mimics FinalSpark Neuroplatform Python API output format
            </p>
          </div>

          {/* ── Quick stats ───────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
          }}>
            {[
              { label: 'Spike Events',   val: rasterEvents.length.toString(),                       color: 'var(--accent-cyan)' },
              { label: 'Active Electrodes', val: `${electrodes.length}`,                            color: '#c084fc' },
              { label: 'Burst Freq',     val: `${burstMetrics.burstFrequency} /min`,               color: 'var(--accent-amber)' },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}>
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {s.label}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>
                  {s.val}
                </span>
              </div>
            ))}
          </div>

          {/* ── Export buttons ────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={sectionLabelStyle}>Export Formats</p>

            {/* CSV */}
            <button
              style={csvBtnStyle}
              onClick={handleDownloadCsv}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,240,255,0.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            >
              <FileText size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Download Spike Events (.csv)</span>
              <span style={{ fontSize: '0.68rem', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
                {rasterEvents.length} rows
              </span>
              <Download size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
            </button>

            {/* JSON */}
            <button
              style={jsonBtnStyle}
              onClick={handleDownloadJson}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(168,85,247,0.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            >
              <FileJson size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Download Network State (.json)</span>
              <span style={{ fontSize: '0.68rem', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
                vitals + metrics
              </span>
              <Download size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
            </button>

            {/* Python snippet */}
            <button
              style={pyBtnStyle}
              onClick={handleCopySnippet}
              onMouseEnter={(e) => {
                if (!copiedSnippet) e.currentTarget.style.background = 'rgba(251,191,36,0.07)';
              }}
              onMouseLeave={(e) => {
                if (!copiedSnippet) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              {copiedSnippet
                ? <CheckCircle size={16} style={{ flexShrink: 0 }} />
                : <Code2 size={16} style={{ flexShrink: 0 }} />
              }
              <span style={{ flex: 1 }}>
                {copiedSnippet ? 'Copied to Clipboard!' : 'Copy Python API Snippet'}
              </span>
              <span style={{ fontSize: '0.68rem', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
                finalspark
              </span>
            </button>
          </div>

          {/* ── Python snippet preview ────────────────────────────── */}
          <div>
            <p style={sectionLabelStyle}>Python API Snippet Preview</p>
            <pre style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '14px 16px',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(200,220,255,0.75)',
              lineHeight: 1.65,
              overflowX: 'auto',
              margin: 0,
              whiteSpace: 'pre',
            }}>
              {pySnippet}
            </pre>
          </div>

          {/* ── CSV preview ───────────────────────────────────────── */}
          <div>
            <p style={sectionLabelStyle}>
              CSV Preview&nbsp;
              <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none' }}>
                (first 5 lines)
              </span>
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}>
              {csvPreviewLines.map((line, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                  padding: '7px 14px',
                  borderBottom: idx < csvPreviewLines.length - 1
                    ? '1px solid rgba(255,255,255,0.04)'
                    : 'none',
                  background: idx === 0 ? 'rgba(0,240,255,0.04)' : 'transparent',
                }}>
                  <span style={{
                    fontSize: '0.58rem',
                    color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'var(--font-mono)',
                    minWidth: '18px',
                    textAlign: 'right',
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: idx === 0 ? 'var(--accent-cyan)' : 'rgba(200,220,255,0.65)',
                  }}>
                    {line}
                  </span>
                </div>
              ))}
              {rasterEvents.length === 0 && (
                <div style={{
                  padding: '14px',
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  color: 'rgba(255,255,255,0.25)',
                }}>
                  No spike events recorded yet — let the simulation run for a few seconds.
                </div>
              )}
            </div>
            {rasterEvents.length > 4 && (
              <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)', margin: '6px 0 0', textAlign: 'right' }}>
                +{rasterEvents.length - 4} more rows in downloaded file
              </p>
            )}
          </div>

          {/* ── Footer note ───────────────────────────────────────── */}
          <p style={{
            fontSize: '0.62rem',
            color: 'rgba(255,255,255,0.2)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '14px',
            margin: 0,
            lineHeight: 1.6,
          }}>
            Data mirrors the{' '}
            <span style={{ color: 'rgba(0,240,255,0.5)' }}>FinalSpark Neuroplatform Python API</span>
            {' '}schema (organoid.get_spike_events / get_network_state). All data is generated
            by the in-browser biophysical simulation and contains no real patient data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;
