import React, { useState } from 'react';
import type { EthicsMetrics, SimulationVitals } from '../hooks/useWetwareSim';
import { ShieldAlert, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface EthicsPanelProps {
  ethics: EthicsMetrics;
  vitals: SimulationVitals;
}

// ─── Colour mapping ───────────────────────────────────────────────
function levelColor(level: EthicsMetrics['welfareLevel']): string {
  switch (level) {
    case 'Safe':             return 'var(--accent-green)';
    case 'Monitor':          return 'var(--accent-cyan)';
    case 'Review Required':  return 'var(--accent-amber)';
    case 'Halt Protocol':    return 'var(--accent-red)';
  }
}
function levelBg(level: EthicsMetrics['welfareLevel']): string {
  switch (level) {
    case 'Safe':             return 'rgba(0,255,127,0.07)';
    case 'Monitor':          return 'rgba(0,240,255,0.07)';
    case 'Review Required':  return 'rgba(255,191,0,0.07)';
    case 'Halt Protocol':    return 'rgba(255,46,99,0.1)';
  }
}

// ─── Arc gauge ────────────────────────────────────────────────────
function ArcGauge({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct   = Math.min(1, value / max);
  const r     = 28;
  const circ  = Math.PI * r;          // half-circle arc length
  const dash  = pct * circ;
  return (
    <svg width="72" height="40" viewBox="0 0 72 40" style={{ overflow: 'visible' }}>
      {/* Track */}
      <path
        d="M 8 36 A 28 28 0 0 1 64 36"
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeLinecap="round"
      />
      {/* Value arc */}
      <path
        d="M 8 36 A 28 28 0 0 1 64 36"
        fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Label */}
      <text x="36" y="32" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace">
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────
export const EthicsPanel: React.FC<EthicsPanelProps> = ({ ethics, vitals }) => {
  const [expanded, setExpanded] = useState(false);

  const color = levelColor(ethics.welfareLevel);
  const bg    = levelBg(ethics.welfareLevel);
  const isAlert = ethics.welfareLevel === 'Review Required' || ethics.welfareLevel === 'Halt Protocol';

  // Baltimore Declaration compliance items (dynamic based on vitals)
  const compliance = [
    { label: 'Donor consent acknowledged',        ok: true },
    { label: 'Pain-avoidance protocols active',   ok: !vitals.seizureActivity },
    { label: 'Temperature within safe range',     ok: true }, // always kept ≤38°C
    { label: 'Ethics board notification',         ok: ethics.sentienceRisk < 50 },
    { label: 'Public transparency log active',    ok: true },
  ];

  return (
    <div
      style={{
        borderRadius: '12px',
        border: `1px solid ${color}30`,
        background: bg,
        overflow: 'hidden',
        animation: isAlert ? 'bio-alert 2s infinite ease-in-out' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <ShieldAlert size={15} style={{ color, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.4px', fontWeight: 700 }}>
            Baltimore Ethics Monitor
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color, marginTop: '2px' }}>
            {ethics.welfareLevel}
          </div>
        </div>
        {/* Mini risk badge */}
        <div style={{
          fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
          color, minWidth: '28px', textAlign: 'right',
        }}>
          {ethics.sentienceRisk}%
        </div>
        {expanded
          ? <ChevronUp  size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          : <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        }
      </button>

      {/* Thin progress bar under header */}
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)' }}>
        <div style={{
          height: '100%',
          width: `${ethics.sentienceRisk}%`,
          background: color,
          boxShadow: `0 0 6px ${color}`,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* IIT-Φ Gauge + metrics row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <ArcGauge value={ethics.phiProxy} max={10} color={color} />
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>IIT-Φ Proxy</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'Sentience Risk',  val: `${ethics.sentienceRisk}/100` },
                { label: 'Cell Count',      val: vitals.cellCount.toLocaleString() },
                { label: 'Sync Score',      val: `${(vitals.myelination).toFixed(0)}%` },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>{m.label}</span>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Threshold zones */}
          <div>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', fontWeight: 700 }}>
              Φ Threshold Zones
            </div>
            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', gap: '1px' }}>
              {[
                { w: '20%', c: 'var(--accent-green)',  label: 'Safe' },
                { w: '25%', c: 'var(--accent-cyan)',   label: 'Monitor' },
                { w: '25%', c: 'var(--accent-amber)',  label: 'Review' },
                { w: '30%', c: 'var(--accent-red)',    label: 'Halt' },
              ].map(z => (
                <div key={z.label} style={{ width: z.w, background: z.c, opacity: 0.6 }} title={z.label} />
              ))}
            </div>
            {/* Needle */}
            <div style={{ position: 'relative', height: '6px', marginTop: '1px' }}>
              <div style={{
                position: 'absolute',
                left: `calc(${ethics.sentienceRisk}% - 4px)`,
                top: '-1px',
                width: '0',
                height: '0',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: `6px solid ${color}`,
                transition: 'left 0.6s ease',
              }} />
            </div>
          </div>

          {/* Baltimore Declaration Compliance */}
          <div>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', fontWeight: 700 }}>
              Baltimore Declaration
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {compliance.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {item.ok
                    ? <CheckCircle2 size={11} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                    : <XCircle      size={11} style={{ color: 'var(--accent-red)',   flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: '0.65rem', color: item.ok ? 'rgba(255,255,255,0.55)' : 'var(--accent-red)' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Welfare log */}
          {ethics.welfareLog.length > 0 && (
            <div>
              <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={10} style={{ color: 'var(--accent-amber)' }} />
                Welfare Event Log
              </div>
              <div style={{
                maxHeight: '80px', overflowY: 'auto',
                background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '6px 8px',
              }}>
                {ethics.welfareLog.map((entry, i) => (
                  <p key={i} style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: i < ethics.welfareLog.length - 1 ? '4px' : 0 }}>
                    {entry}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
