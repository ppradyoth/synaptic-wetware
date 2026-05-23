import React from 'react';
import type { IncubatorParams, SimulationVitals } from '../hooks/useWetwareSim';
import { Thermometer, Heart, AlertTriangle, Droplets } from 'lucide-react';

interface IncubatorControlsProps {
  incubator: IncubatorParams;
  vitals: SimulationVitals;
  adjustIncubator: (param: keyof IncubatorParams, value: number) => void;
  logs: string[];
}

export const IncubatorControls: React.FC<IncubatorControlsProps> = ({
  incubator,
  vitals,
  adjustIncubator,
  logs
}) => {
  const isEmergency = vitals.viability < 80 || vitals.isStarving;

  // Temperature status string
  const tempStatus = incubator.temperature > 39 ? 'HYPERTHERMIA (LETHAL)' :
                     incubator.temperature < 34 ? 'HYPOTHERMIA (STUNTED)' : 'OPTIMAL';
  const tempColor = incubator.temperature > 39 || incubator.temperature < 34 ? 'var(--accent-red)' : 'var(--accent-green)';

  // Glucose status
  const glucoseStatus = incubator.glucose < 2.5 ? 'CRITICAL STARVATION' :
                        incubator.glucose > 10.0 ? 'SATURATED' : 'OPTIMAL';
  const glucoseColor = incubator.glucose < 2.5 ? 'var(--accent-red)' : 
                        incubator.glucose > 10.0 ? 'var(--accent-amber)' : 'var(--accent-green)';

  // Oxygen status
  const oxygenStatus = incubator.oxygen < 75 ? 'CRITICAL ANOXIA' :
                       incubator.oxygen < 90 ? 'HYPOXIA' : 'OPTIMAL';
  const oxygenColor = incubator.oxygen < 75 ? 'var(--accent-red)' :
                      incubator.oxygen < 90 ? 'var(--accent-amber)' : 'var(--accent-green)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', height: '100%' }}>
      {/* Left: Interactive Environmental Controls */}
      <div 
        className={`glass-panel ${isEmergency ? 'bio-alert-active' : 'glass-panel-glow-green'}`} 
        style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Thermometer style={{ color: isEmergency ? 'var(--accent-red)' : 'var(--accent-green)' }} />
              Incubator V-02 Life Support Controls
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
              Regulate internal physical and biochemical properties of the agar scaffold matrix.
            </p>
          </div>
          {isEmergency && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(255, 46, 99, 0.15)', 
              border: '1px solid var(--accent-red)', 
              borderRadius: '8px', 
              padding: '6px 12px',
              color: 'var(--accent-red)',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              <AlertTriangle size={14} /> EMERGENCY OUTOFBOUNDS
            </div>
          )}
        </div>

        {/* Environmental Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Temperature Slider */}
          <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>Agar Temp</span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Target: 37.0°C</span>
            </div>
            <input
              type="range"
              min="30"
              max="42"
              step="0.1"
              value={incubator.temperature}
              onChange={(e) => adjustIncubator('temperature', parseFloat(e.target.value))}
              className="slider-green"
            />
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span className="font-telemetry" style={{ fontSize: '1.25rem', fontWeight: 700, color: tempColor }}>
                {incubator.temperature.toFixed(1)}°C
              </span>
              <span style={{ fontSize: '0.65rem', color: tempColor, fontWeight: 600, textTransform: 'uppercase' }}>
                {tempStatus}
              </span>
            </div>
          </div>

          {/* Glucose Slider */}
          <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>Glucose Perfusion</span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Target: 5.5 mM</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.1"
              value={incubator.glucose}
              onChange={(e) => adjustIncubator('glucose', parseFloat(e.target.value))}
              className="slider-cyan"
            />
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span className="font-telemetry" style={{ fontSize: '1.25rem', fontWeight: 700, color: glucoseColor }}>
                {incubator.glucose.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>mM</span>
              </span>
              <span style={{ fontSize: '0.65rem', color: glucoseColor, fontWeight: 600, textTransform: 'uppercase' }}>
                {glucoseStatus}
              </span>
            </div>
          </div>

          {/* Oxygen Slider */}
          <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>Oxygen Saturation</span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Target: 95.0%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={incubator.oxygen}
              onChange={(e) => adjustIncubator('oxygen', parseFloat(e.target.value))}
              className="slider-green"
            />
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span className="font-telemetry" style={{ fontSize: '1.25rem', fontWeight: 700, color: oxygenColor }}>
                {incubator.oxygen.toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.65rem', color: oxygenColor, fontWeight: 600, textTransform: 'uppercase' }}>
                {oxygenStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Health Vitals Dial & Perfusion Logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Viability Gauge Dial */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
            <Heart style={{ color: isEmergency ? 'var(--accent-red)' : 'var(--accent-green)' }} size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Organoid Viability</h3>
          </div>

          {/* Circular Viability representation */}
          <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px 0' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle
                cx="65"
                cy="65"
                r="55"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="65"
                cy="65"
                r="55"
                stroke={isEmergency ? 'var(--accent-red)' : 'var(--accent-green)'}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="345"
                strokeDashoffset={345 - (345 * vitals.viability) / 100}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="font-telemetry" style={{ 
                fontSize: '2rem', 
                fontWeight: 800, 
                color: isEmergency ? 'var(--accent-red)' : 'var(--accent-green)',
                textShadow: isEmergency ? '0 0 10px var(--accent-red-glow)' : '0 0 10px var(--accent-green-glow)'
              }}>{vitals.viability}%</span>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Health Vitals</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Myelin sheath density:</span>
              <span className="font-telemetry" style={{ fontWeight: 600 }}>{vitals.myelination}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Seizure status:</span>
              <span style={{ fontWeight: 700, color: vitals.seizureActivity ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {vitals.seizureActivity ? 'ACTIVE SEIZURE' : 'STABLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Perfusion Valve status log overlay */}
        <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplets style={{ color: 'var(--accent-cyan)' }} size={16} />
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Perfusion Flow Logs</h4>
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.45)'
          }}>
            {logs.filter(l => l.includes('glucose') || l.includes('viability') || l.includes('vit') || l.includes('NGF') || l.includes('Dopamine') || l.includes('GABA') || l.includes('seizure')).slice(0, 8).map((log, idx) => (
              <div key={idx} style={{ 
                borderBottom: '1px solid rgba(255,255,255,0.02)',
                paddingBottom: '4px'
              }}>
                {log}
              </div>
            ))}
            {logs.filter(l => l.includes('glucose') || l.includes('viability') || l.includes('vit') || l.includes('NGF') || l.includes('Dopamine') || l.includes('GABA')).length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>All perfusion valves running normally.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
