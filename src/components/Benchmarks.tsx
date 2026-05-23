import React from 'react';
import { Cpu, Zap, Leaf, Layers, ShieldCheck } from 'lucide-react';

export const Benchmarks: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', height: '100%' }}>
      {/* Left: Interactive Comparative Metrics Panels */}
      <div className="glass-panel glass-panel-glow-green" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu style={{ color: 'var(--accent-green)', filter: 'drop-shadow(0 0 5px var(--accent-green-glow))' }} />
            Silicon vs. Wetware Computing Benchmarks
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            A quantitative comparative analysis of biological brain-tissue computing structures against advanced silicon processors.
          </p>
        </div>

        {/* Dynamic visual comparison bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Power Draw Metric */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={14} style={{ color: 'var(--accent-cyan)' }} /> 1. Operational Power Draw
              </span>
              <span className="font-telemetry glow-text-green" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                70,000,000x Efficiency
              </span>
            </div>
            
            {/* Silicon Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                <span>Standard Silicon (NVIDIA H100 Cluster Equivalent)</span>
                <span className="font-telemetry" style={{ color: 'var(--accent-red)' }}>700,000,000 uW (700 Watts)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--accent-red)', boxShadow: '0 0 10px var(--accent-red-glow)' }} />
              </div>
            </div>

            {/* Wetware Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                <span>Synaptic Wetware Organoid (MEA-64 Grid)</span>
                <span className="font-telemetry" style={{ color: 'var(--accent-green)' }}>10 uW (0.00001 Watts)</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '1%', height: '100%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green-glow)' }} />
              </div>
            </div>
          </div>

          {/* Synaptic Spatial Volume Density */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={14} style={{ color: '#a855f7' }} /> 2. Synaptic Density (Volume)
              </span>
              <span className="font-telemetry glow-text-cyan" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                3D Fractal Routing
              </span>
            </div>

            {/* Silicon Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                <span>Planar Transistor Gate density (2D lithography)</span>
                <span className="font-telemetry">10^8 nodes / mm^3</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '15%', height: '100%', background: 'var(--accent-amber)', boxShadow: '0 0 10px var(--accent-amber-glow)' }} />
              </div>
            </div>

            {/* Wetware Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                <span>Wetware Neuronal Synaptic volume (3D bio-gels)</span>
                <span className="font-telemetry" style={{ color: 'var(--accent-green)' }}>10^11 nodes / mm^3</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green-glow)' }} />
              </div>
            </div>
          </div>

          {/* Environmental Carbon Cost */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Leaf size={14} style={{ color: 'var(--accent-green)' }} /> 3. Carbon Emissions (CO2 / year equivalent)
              </span>
              <span className="font-telemetry glow-text-green" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                Zero Emissions (Agar-based biodegrade)
              </span>
            </div>

            {/* Silicon Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                <span>Coal/Gas-fueled high-compute server centers</span>
                <span className="font-telemetry">5.2 Tons CO2 / GPU Cluster</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '90%', height: '100%', background: 'var(--accent-red)', boxShadow: '0 0 10px var(--accent-red-glow)' }} />
              </div>
            </div>

            {/* Wetware Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                <span>Biomass glucose feeding and ambient incubators</span>
                <span className="font-telemetry" style={{ color: 'var(--accent-green)' }}>0.0001 Tons CO2</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '0.5%', height: '100%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green-glow)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Strategic Executive Bulletins (YC pitching facts) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck style={{ color: 'var(--accent-green)' }} size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Biological Advantage</h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>
            Why leading venture firms and biocomputing researchers are shifting capital towards wetware platforms:
          </p>

          <ul style={{ 
            fontSize: '0.75rem', 
            color: 'rgba(255,255,255,0.6)', 
            paddingLeft: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            lineHeight: '1.4'
          }}>
            <li>
              <strong style={{ color: '#fff' }}>No heat sinks required:</strong> Standard CPUs reach temperatures exceeding 90°C. Organoid computers are fully operational at a physiological 37°C, requiring zero mechanical air/water cooling architectures.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Molecular auto-assembly:</strong> Silicon manufacturing is constrained by chip fabrication plants (fabs costing $15 Billion). Biocomputers are grown organically in hydrogel incubators inside standard tissue-culture labs.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Non-volatile memory logic:</strong> Standard chips require separate RAM/flash nodes. Biological cells house integrated storage within self-organizing synaptic connections (LTP modeling).
            </li>
          </ul>
        </div>

        {/* Corporate Strategic Vision Pitch */}
        <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Market Commercial projection</span>
          <div className="font-telemetry" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            $1.4M <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)' }}>Saved / TFLOP</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginTop: '6px' }}>
            By hosting deep-network inference models directly inside live cortical tissues, cloud infrastructure operational overhead collapses by 99.998%, introducing absolute carbon neutrality across high-dimensional AI services.
          </p>
        </div>
      </div>
    </div>
  );
};
