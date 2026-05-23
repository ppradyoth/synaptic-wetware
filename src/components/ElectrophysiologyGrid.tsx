import React, { useEffect, useRef, useState } from 'react';
import type { Electrode, SpikeEvent, BurstMetrics } from '../hooks/useWetwareSim';
import { Zap, Activity, Info, BarChart } from 'lucide-react';

interface ElectrophysiologyGridProps {
  electrodes: Electrode[];
  triggerElectrodeStimulation: (id: number) => void;
  logs: string[];
  rasterEvents: SpikeEvent[];
  burstMetrics: BurstMetrics;
}

export const ElectrophysiologyGrid: React.FC<ElectrophysiologyGridProps> = ({
  electrodes,
  triggerElectrodeStimulation,
  logs,
  rasterEvents,
  burstMetrics,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedElectrode, setSelectedElectrode] = useState<Electrode | null>(null);

  // Active spike visualization counter
  const totalFiringRate = electrodes.reduce((acc, el) => acc + el.spikeRate, 0);
  const avgSpikeRate = electrodes.length > 0 ? (totalFiringRate / electrodes.length).toFixed(2) : '0';

  // Oscilloscope Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = canvas.width;
    const dataArray = new Array(bufferLength).fill(canvas.height / 2);

    const draw = () => {
      if (!ctx || !canvas) return;

      // Slowly clear canvas for trailing effect
      ctx.fillStyle = 'rgba(10, 20, 29, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 30) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      // Read active electrode spikes to inject wave disruptions
      let spikeDisruption = 0;
      electrodes.forEach((el) => {
        if (el.voltage > 10) {
          spikeDisruption += (el.voltage / 40) * (Math.random() > 0.5 ? 25 : -25);
        }
      });

      // Clamp disruption
      spikeDisruption = Math.max(-45, Math.min(45, spikeDisruption));

      // Calculate next voltage trace point
      // Smooth back to baseline (midway) + random synaptic noise
      const baseline = canvas.height / 2;
      const noise = (Math.random() - 0.5) * 2;
      let nextY = baseline + noise + spikeDisruption;

      // Add small sine baseline for cardiac/perfusion flow simulation
      nextY += Math.sin(Date.now() / 150) * 3;

      // Push and shift data
      dataArray.push(nextY);
      dataArray.shift();

      // Draw the wave trace
      ctx.strokeStyle = spikeDisruption !== 0 ? 'rgba(0, 240, 255, 0.85)' : 'rgba(0, 255, 127, 0.7)';
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = spikeDisruption !== 0 ? 8 : 2;
      ctx.shadowColor = spikeDisruption !== 0 ? 'rgba(0, 240, 255, 0.5)' : 'rgba(0, 255, 127, 0.3)';
      
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        if (i === 0) {
          ctx.moveTo(i, dataArray[i]);
        } else {
          ctx.lineTo(i, dataArray[i]);
        }
      }
      ctx.stroke();

      // Reset shadows
      ctx.shadowBlur = 0;

      // Oscilloscope Overlay Info text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText('TRACE CH: AGGREGATE MEA', 15, 20);
      ctx.fillText('VERTICAL SCALE: 10 uV/DIV', 15, 35);
      ctx.fillStyle = spikeDisruption !== 0 ? 'rgba(0, 240, 255, 0.8)' : 'rgba(0, 255, 127, 0.8)';
      ctx.fillText(spikeDisruption !== 0 ? 'SPIKE DEPOLARIZATION ACTIVE' : 'STEADY SIGNAL', 15, 50);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [electrodes]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', height: '100%' }}>
      {/* Left: Electrode Array Grid */}
      <div className="glass-panel glass-panel-glow-green" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Zap style={{ color: 'var(--accent-green)', filter: 'drop-shadow(0 0 5px var(--accent-green-glow))' }} />
              Multi-Electrode Array (MEA-64)
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
              8x8 grid of platinum micro-electrodes. Click any channel to send an electrical excitation pulse.
            </p>
          </div>
          <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Avg Firing Rate</span>
            <span className="font-telemetry glow-text-green" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-green)' }}>
              {avgSpikeRate} <span style={{ fontSize: '0.875rem' }}>Hz</span>
            </span>
          </div>
        </div>

        {/* Burst Metrics Row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Burst Freq',   val: `${burstMetrics.burstFrequency} /min`,                             color: 'var(--accent-cyan)' },
            { label: 'Mean IBI',     val: burstMetrics.meanIBI > 0 ? `${burstMetrics.meanIBI.toFixed(1)}s` : '—', color: '#fff' },
            { label: 'Synchrony',    val: `${(burstMetrics.synchronyScore * 100).toFixed(0)}%`,              color: burstMetrics.networkBursting ? 'var(--accent-amber)' : 'var(--accent-green)' },
            { label: 'Spike Events', val: `${rasterEvents.length} / 4s`,                                     color: 'rgba(255,255,255,0.7)' },
          ].map(m => (
            <div key={m.label} style={{
              flex: 1, minWidth: '80px', padding: '8px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', flexDirection: 'column', gap: '2px',
            }}>
              <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{m.label}</span>
              <span className="font-telemetry" style={{ fontSize: '0.875rem', fontWeight: 700, color: m.color }}>{m.val}</span>
            </div>
          ))}
        </div>

        {/* 8x8 Visual Grid container */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(8, 1fr)', 
          gap: '10px', 
          background: 'rgba(5, 10, 14, 0.5)', 
          padding: '16px', 
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.03)',
          aspectRatio: '1',
          maxWidth: '520px',
          margin: '0 auto',
          width: '100%'
        }}>
          {electrodes.map((el) => {
            const isFiring = el.voltage > 10;
            const isSelected = selectedElectrode?.id === el.id;

            // Compute background and border based on electrode state & role
            let borderStyle = '1px solid rgba(255, 255, 255, 0.05)';
            let bgStyle = 'rgba(255, 255, 255, 0.02)';
            let dotGlow = 'rgba(255, 255, 255, 0.1)';

            if (el.role === 'input-a' || el.role === 'input-b') {
              borderStyle = '1px solid rgba(0, 240, 255, 0.2)';
              bgStyle = 'rgba(0, 240, 255, 0.02)';
              dotGlow = 'rgba(0, 240, 255, 0.3)';
            } else if (el.role === 'motor-up' || el.role === 'motor-down') {
              borderStyle = '1px solid rgba(0, 255, 127, 0.2)';
              bgStyle = 'rgba(0, 255, 127, 0.02)';
              dotGlow = 'rgba(0, 255, 127, 0.3)';
            }

            if (isFiring) {
              bgStyle = el.role.startsWith('input') ? 'rgba(0, 240, 255, 0.3)' : 'rgba(0, 255, 127, 0.3)';
              borderStyle = el.role.startsWith('input') ? '1px solid var(--accent-cyan)' : '1px solid var(--accent-green)';
              dotGlow = el.role.startsWith('input') ? 'var(--accent-cyan)' : 'var(--accent-green)';
            }

            if (isSelected) {
              borderStyle = '1px solid #fff';
            }

            return (
              <button
                key={el.id}
                onClick={() => {
                  triggerElectrodeStimulation(el.id);
                  setSelectedElectrode(el);
                }}
                style={{
                  background: bgStyle,
                  border: borderStyle,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  padding: '8px 0',
                  boxShadow: isFiring ? `0 0 12px ${dotGlow}` : 'none'
                }}
                className="electrode-cell"
              >
                {/* Node ID */}
                <span className="font-telemetry" style={{ fontSize: '0.65rem', color: isFiring ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                  CH{el.id < 10 ? `0${el.id}` : el.id}
                </span>

                {/* Core firing micro-dot */}
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isFiring ? '#fff' : dotGlow,
                  marginTop: '4px',
                  boxShadow: isFiring ? `0 0 10px #fff, 0 0 20px ${dotGlow}` : 'none',
                  transition: 'all 0.1s ease',
                  transform: isFiring ? 'scale(1.3)' : 'scale(1)'
                }} />

                {/* Role tags */}
                {el.role !== 'interneuron' && (
                  <span style={{
                    fontSize: '0.5rem',
                    textTransform: 'uppercase',
                    padding: '1px 3px',
                    borderRadius: '3px',
                    background: el.role.startsWith('input') ? 'rgba(0,240,255,0.15)' : 'rgba(0,255,127,0.15)',
                    color: el.role.startsWith('input') ? 'var(--accent-cyan)' : 'var(--accent-green)',
                    position: 'absolute',
                    bottom: '2px',
                    fontWeight: 700
                  }}>
                    {el.role === 'input-a' ? 'IN-A' :
                     el.role === 'input-b' ? 'IN-B' :
                     el.role === 'motor-up' ? 'M-UP' : 'M-DN'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar: Diagnostic Panel & Real-time Waveform */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Oscilloscope Panel */}
        <div className="glass-panel glass-panel-glow-cyan" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity style={{ color: 'var(--accent-cyan)', filter: 'drop-shadow(0 0 5px var(--accent-cyan-glow))' }} size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Oscilloscope Trace</h3>
          </div>
          <canvas
            ref={canvasRef}
            width={300}
            height={160}
            style={{
              width: '100%',
              height: '160px',
              background: 'var(--bg-dark)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'block'
            }}
          />
        </div>

        {/* Selected Channel Diagnostic Box */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info style={{ color: '#a855f7' }} size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Channel Diagnostics</h3>
          </div>

          {selectedElectrode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Channel Name</span>
                <span className="font-telemetry" style={{ fontWeight: 600 }}>CH-0{selectedElectrode.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Spatial Coordinates</span>
                <span className="font-telemetry" style={{ fontWeight: 600 }}>X: {selectedElectrode.x}, Y: {selectedElectrode.y}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Channel Role</span>
                <span className="font-telemetry" style={{ 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: selectedElectrode.role === 'interneuron' ? '#e2e8f0' :
                         selectedElectrode.role.startsWith('input') ? 'var(--accent-cyan)' : 'var(--accent-green)'
                }}>
                  {selectedElectrode.role}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Live Firing Frequency</span>
                <span className="font-telemetry" style={{ fontWeight: 600 }}>{selectedElectrode.spikeRate} Hz</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Membrane Potential</span>
                <span className="font-telemetry" style={{ fontWeight: 700, color: selectedElectrode.voltage > 10 ? 'var(--accent-cyan)' : '#cbd5e1' }}>
                  {selectedElectrode.voltage.toFixed(1)} uV
                </span>
              </div>

              <button
                onClick={() => triggerElectrodeStimulation(selectedElectrode.id)}
                className="glass-card"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(0, 255, 127, 0.1))',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '10px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.6)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Zap size={14} /> Send Stimulus Pulse
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem', textAlign: 'center', padding: '0 20px' }}>
              No electrode selected.<br />Click any electrode on the grid to inspect and pulse details.
            </div>
          )}
        </div>

        {/* Console Log Overlay Feed */}
        <div className="glass-panel" style={{ padding: '16px', height: '140px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart style={{ color: '#fff' }} size={16} />
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>System Feed</span>
          </div>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '6px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.6)'
          }}>
            {logs.slice(0, 10).map((log, i) => (
              <div key={i} style={{ 
                borderLeft: log.includes('WARNING') ? '2px solid var(--accent-amber)' :
                            log.includes('CRITICAL') ? '2px solid var(--accent-red)' : '2px solid var(--accent-green)',
                paddingLeft: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
