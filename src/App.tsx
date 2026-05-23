import React, { useState } from 'react';
import { useWetwareSim } from './hooks/useWetwareSim';
import { GrowRoom } from './components/GrowRoom';
import { ElectrophysiologyGrid } from './components/ElectrophysiologyGrid';
import { ConnectomeGraph } from './components/ConnectomeGraph';
import { TrainingPlayground } from './components/TrainingPlayground';
import { IncubatorControls } from './components/IncubatorControls';
import { Benchmarks } from './components/Benchmarks';
import { About } from './components/About';
import { EthicsPanel } from './components/EthicsPanel';
import { ExportPanel } from './components/ExportPanel';

import {
  Sprout, Zap, Brain, Thermometer, BarChart,
  Activity, Shield, Clock, RefreshCw, BookOpen,
  FlaskConical, Cpu, Download, Share2
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    incubator, vitals, activeTask, logicGate, pong,
    electrodes, logs, burstMetrics, ethicsMetrics, rasterEvents,
    modelType, setModelType,
    adjustIncubator, administerDopamine, administerGABA,
    triggerElectrodeStimulation, seedStemCells,
    setActiveTask, setLogicGate, addLog,
  } = useWetwareSim();

  const [activeTab, setActiveTab] = useState<'grow' | 'mea' | 'connectome' | 'training' | 'incubator' | 'benchmarks' | 'about'>('grow');
  const [showExport, setShowExport] = useState(false);

  const isEmergency = vitals.viability < 80 || vitals.isStarving;
  const isHealthy   = vitals.viability >= 90;

  // Shared nav-button style factory
  const navBtn = (tab: typeof activeTab, activeColor: string) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: 'none',
    background: activeTab === tab ? `${activeColor}14` : 'transparent',
    color: activeTab === tab ? activeColor : 'rgba(255,255,255,0.5)',
    fontWeight: 600 as const,
    fontSize: '0.875rem',
    cursor: 'pointer' as const,
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  });

  return (
    <div className="dashboard-grid">
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className="glass-panel" style={{
        borderRight: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} style={{
              color: isEmergency ? 'var(--accent-red)' : 'var(--accent-green)',
              animation: 'heartbeat 1.5s infinite ease-in-out',
            }} />
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.5px', color: '#fff' }}>
              SYNAPTIC WETWARE
            </h1>
          </div>
          <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
            BIOLABS DISH OS V2.0 · DUAL NEURON MODEL
          </span>
        </div>

        {/* ── NEURON MODEL TOGGLE ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.5px' }}>
            Neuron Physics Model
          </span>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '3px', gap: '3px',
          }}>
            <button
              id="model-izh-btn"
              onClick={() => setModelType('izhikevich')}
              style={{
                padding: '8px 6px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.2, textAlign: 'center',
                background: modelType === 'izhikevich'
                  ? 'linear-gradient(135deg, rgba(0,240,255,0.25), rgba(0,240,255,0.1))'
                  : 'transparent',
                color: modelType === 'izhikevich' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.35)',
                boxShadow: modelType === 'izhikevich' ? '0 0 10px rgba(0,240,255,0.15)' : 'none',
                transition: 'all 0.25s ease',
              }}
              title="Izhikevich: fast, 2-parameter — 100× more efficient"
            >
              <FlaskConical size={13} style={{ display: 'block', margin: '0 auto 3px' }} />
              Izhikevich
              <div style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: 400, marginTop: '1px' }}>Fast · 2-param</div>
            </button>
            <button
              id="model-hh-btn"
              onClick={() => setModelType('hodgkin-huxley')}
              style={{
                padding: '8px 6px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.2, textAlign: 'center',
                background: modelType === 'hodgkin-huxley'
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(168,85,247,0.1))'
                  : 'transparent',
                color: modelType === 'hodgkin-huxley' ? '#c084fc' : 'rgba(255,255,255,0.35)',
                boxShadow: modelType === 'hodgkin-huxley' ? '0 0 10px rgba(168,85,247,0.2)' : 'none',
                transition: 'all 0.25s ease',
              }}
              title="Hodgkin-Huxley: full 4-variable ion channel gating — biologically exact"
            >
              <Cpu size={13} style={{ display: 'block', margin: '0 auto 3px' }} />
              Hodgkin-Huxley
              <div style={{ fontSize: '0.55rem', opacity: 0.6, fontWeight: 400, marginTop: '1px' }}>Full HH · 4-var</div>
            </button>
          </div>
          {/* Model descriptor */}
          <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>
            {modelType === 'izhikevich'
              ? 'Izhikevich: biologically plausible spike shapes at 100× lower compute cost (a=0.02, b=0.2, c=−65, d=8).'
              : 'Hodgkin-Huxley: exact Na⁺/K⁺ ion channel gating (gNa=120, gK=36, gL=0.3 mS/cm²). Nobel Prize 1963.'}
          </p>
        </div>

        {/* Status */}
        <div className="glass-card" style={{
          borderLeft: isEmergency ? '3px solid var(--accent-red)' :
                      isHealthy   ? '3px solid var(--accent-green)' : '3px solid var(--accent-amber)',
          background: 'rgba(255,255,255,0.01)', padding: '10px 14px',
          display: 'flex', flexDirection: 'column', gap: '5px',
        }}>
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            Cellular System Status
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: isEmergency ? 'var(--accent-red)' : isHealthy ? 'var(--accent-green)' : 'var(--accent-amber)',
              boxShadow: isEmergency ? '0 0 8px var(--accent-red)' : isHealthy ? '0 0 8px var(--accent-green)' : '0 0 8px var(--accent-amber)',
            }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#fff' }}>
              {isEmergency ? 'CELL CRITICAL STRESS' : vitals.seizureActivity ? 'SEIZURE ANOMALY' : 'BIOLOGICAL NODE ONLINE'}
            </span>
          </div>
        </div>

        {/* Vitals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Cell Count',        val: vitals.cellCount.toLocaleString(),               color: '#fff' },
            { label: 'Synaptic Density',  val: `${vitals.synapticDensity} syn/cell`,            color: '#fff' },
            { label: 'Homeostatic Health',val: `${vitals.viability}%`,                          color: isEmergency ? 'var(--accent-red)' : 'var(--accent-green)' },
            { label: 'Burst Frequency',   val: `${burstMetrics.burstFrequency} bursts/min`,     color: 'var(--accent-cyan)' },
            { label: 'Synchrony',         val: `${(burstMetrics.synchronyScore * 100).toFixed(0)}%`, color: burstMetrics.networkBursting ? 'var(--accent-amber)' : 'rgba(255,255,255,0.7)' },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>{m.label}</span>
              <span className="font-telemetry" style={{ fontWeight: 600, fontSize: '0.8rem', color: m.color }}>{m.val}</span>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>
            LAB WORKSPACES
          </span>
          <button onClick={() => setActiveTab('grow')}       style={navBtn('grow',       'var(--accent-green)')}><Sprout    size={16} /> Stem-Cell Grow Room</button>
          <button onClick={() => setActiveTab('mea')}        style={navBtn('mea',        'var(--accent-cyan)')}><Zap       size={16} /> Electrophysiology MEA</button>
          <button onClick={() => setActiveTab('connectome')} style={navBtn('connectome', 'var(--accent-cyan)')}><Share2    size={16} /> Functional Connectome</button>
          <button onClick={() => setActiveTab('training')}   style={navBtn('training',   'var(--accent-cyan)')}><Brain     size={16} /> Cognitive Conditioning</button>
          <button onClick={() => setActiveTab('incubator')}  style={navBtn('incubator',  'var(--accent-green)')}><Thermometer size={16} /> Incubator Environment</button>
          <button onClick={() => setActiveTab('benchmarks')} style={navBtn('benchmarks', '#fff')}><BarChart  size={16} /> Silicon vs Biotech</button>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
          <button onClick={() => setActiveTab('about')} style={navBtn('about', '#c084fc')}><BookOpen size={16} /> What is this?</button>
        </nav>

        {/* Ethics Panel — always visible in sidebar */}
        <EthicsPanel ethics={ethicsMetrics} vitals={vitals} />

        {/* Re-seed button */}
        <button
          onClick={seedStemCells}
          className="glass-card"
          style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        >
          <RefreshCw size={12} /> Emergency Re-seed Grid
        </button>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <main className="main-content">
        {/* Header */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)',
          borderRadius: '12px', padding: '10px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={11} style={{ color: 'var(--accent-green)' }} /> Secured Lab Connection
            </span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={11} /> Live telemetry: 100ms · Model: <strong style={{ color: modelType === 'izhikevich' ? 'var(--accent-cyan)' : '#c084fc' }}>{modelType === 'izhikevich' ? 'Izhikevich' : 'Hodgkin-Huxley'}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
              <span className="font-telemetry" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', fontWeight: 600 }}>
                MEA {burstMetrics.networkBursting ? '🔴 BURST ACTIVE' : '🟢 NOMINAL'}
              </span>
            </div>
            <button
              onClick={() => setShowExport(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(0,240,255,0.08)',
                border: '1px solid rgba(0,240,255,0.18)',
                color: 'var(--accent-cyan)', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,240,255,0.16)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,240,255,0.08)')}
            >
              <Download size={12} /> Export Data
            </button>
          </div>
        </header>

        {/* Tab views */}
        <div style={{ flex: 1 }}>
          {activeTab === 'grow' && (
            <GrowRoom vitals={vitals} seedStemCells={seedStemCells} addLog={addLog} />
          )}
          {activeTab === 'mea' && (
            <ElectrophysiologyGrid
              electrodes={electrodes}
              triggerElectrodeStimulation={triggerElectrodeStimulation}
              logs={logs}
              rasterEvents={rasterEvents}
              burstMetrics={burstMetrics}
            />
          )}
          {activeTab === 'connectome' && (
            <ConnectomeGraph electrodes={electrodes} />
          )}
          {activeTab === 'training' && (
            <TrainingPlayground
              activeTask={activeTask} setActiveTask={setActiveTask}
              pong={pong} logicGate={logicGate} setLogicGate={setLogicGate}
              administerDopamine={administerDopamine} administerGABA={administerGABA}
              dopamineLevel={incubator.dopamine} gabaLevel={incubator.gaba}
            />
          )}
          {activeTab === 'incubator' && (
            <IncubatorControls incubator={incubator} vitals={vitals} adjustIncubator={adjustIncubator} logs={logs} />
          )}
          {activeTab === 'benchmarks' && <Benchmarks />}
          {activeTab === 'about'      && <About />}
        </div>
      </main>

      {/* ── EXPORT PANEL ─────────────────────────────────────────── */}
      {showExport && (
        <ExportPanel
          vitals={vitals}
          burstMetrics={burstMetrics}
          ethicsMetrics={ethicsMetrics}
          electrodes={electrodes}
          rasterEvents={rasterEvents}
          modelType={modelType}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default App;
