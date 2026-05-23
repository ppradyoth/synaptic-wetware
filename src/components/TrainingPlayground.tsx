import React, { useEffect, useRef } from 'react';
import type { TaskType, PongState, LogicGateState } from '../hooks/useWetwareSim';
import { Target, Brain, Award, Play, Activity } from 'lucide-react';

interface TrainingPlaygroundProps {
  activeTask: TaskType;
  setActiveTask: (task: TaskType) => void;
  pong: PongState;
  logicGate: LogicGateState;
  setLogicGate: (gate: LogicGateState['gateType']) => void;
  administerDopamine: () => void;
  administerGABA: () => void;
  dopamineLevel: number;
  gabaLevel: number;
}

export const TrainingPlayground: React.FC<TrainingPlaygroundProps> = ({
  activeTask,
  setActiveTask,
  pong,
  logicGate,
  setLogicGate,
  administerDopamine,
  administerGABA,
  dopamineLevel,
  gabaLevel
}) => {
  const pongCanvasRef = useRef<HTMLCanvasElement>(null);

  // Animate the Pong Cabin game display
  useEffect(() => {
    if (activeTask !== 'pong') return;
    const canvas = pongCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear board
    ctx.fillStyle = '#060d13';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw field boundary dashed line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Translate coordinates (0-100 values to canvas width/height)
    const bx = (pong.ballX / 100) * canvas.width;
    const by = (pong.ballY / 100) * canvas.height;
    const py = (pong.paddleY / 100) * canvas.height;

    const paddleWidth = 8;
    const paddleHeight = 40;
    const px = canvas.width - 20;

    // Draw Sensory Stimulus Lines from ball to grid mapping (virtual light rays)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Draw Paddle (Controlled by MEA output motor neurons)
    const isHitActive = Math.abs(bx - px) < 12 && Math.abs(by - py) < paddleHeight / 2;
    ctx.fillStyle = isHitActive ? 'var(--accent-green)' : 'var(--accent-cyan)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = isHitActive ? 'var(--accent-green)' : 'var(--accent-cyan)';
    
    // Draw rounded paddle
    ctx.beginPath();
    ctx.roundRect(px - paddleWidth / 2, py - paddleHeight / 2, paddleWidth, paddleHeight, 4);
    ctx.fill();

    // Draw Ball
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();

    // Reset shadows
    ctx.shadowBlur = 0;

    // Draw Score UI
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '24px JetBrains Mono';
    ctx.fillText(pong.score.toString(), canvas.width / 2 - 40, 40);
    ctx.fillText(pong.misses.toString(), canvas.width / 2 + 20, 40);

    ctx.font = '8px JetBrains Mono';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillText('WETWARE AGENT HITS', canvas.width / 2 - 120, 15);
    ctx.fillText('SYSTEM ERROR PENALTIES', canvas.width / 2 + 10, 15);

  }, [pong, activeTask]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px', height: '100%' }}>
      {/* Left: Active Game Visual Viewport */}
      <div className="glass-panel glass-panel-glow-cyan" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target style={{ color: 'var(--accent-cyan)', filter: 'drop-shadow(0 0 5px var(--accent-cyan-glow))' }} />
              Wetware Conditioning Playground
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
              Select a task to stimulate the multi-electrode interface and condition synaptic response behaviors.
            </p>
          </div>

          {/* Task Selectors tabbed button */}
          <div style={{ display: 'flex', background: 'rgba(5, 10, 14, 0.5)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setActiveTask('pong')}
              style={{
                background: activeTask === 'pong' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                border: 'none',
                color: activeTask === 'pong' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.4)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
                transition: 'all 0.2s ease'
              }}
            >
              DishBrain Pong
            </button>
            <button
              onClick={() => setActiveTask('logic')}
              style={{
                background: activeTask === 'logic' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                border: 'none',
                color: activeTask === 'logic' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.4)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
                transition: 'all 0.2s ease'
              }}
            >
              Logic Gate Network
            </button>
          </div>
        </div>

        {/* Viewports */}
        {activeTask === 'pong' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              background: '#060d13', 
              border: '1px solid rgba(255, 255, 255, 0.05)', 
              borderRadius: '12px', 
              overflow: 'hidden',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)'
            }}>
              <canvas
                ref={pongCanvasRef}
                width={500}
                height={260}
                style={{ display: 'block', width: '100%', height: '260px' }}
              />
            </div>
            
            {/* Pong Status telemetry cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Biological Accuracy</span>
                <span className="font-telemetry glow-text-green" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                  {pong.successRate}%
                </span>
              </div>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Active Volleys</span>
                <span className="font-telemetry" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  {pong.epochs}
                </span>
              </div>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Adaptive Learning Rate</span>
                <span className="font-telemetry glow-text-cyan" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {(0.1 + dopamineLevel * 0.05 - gabaLevel * 0.02).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(5, 10, 14, 0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
            {/* Logic Gate Visual Schematic */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Synaptic Logic Optimization</h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                {['AND', 'OR', 'XOR'].map((gate) => (
                  <button
                    key={gate}
                    onClick={() => setLogicGate(gate as LogicGateState['gateType'])}
                    style={{
                      background: logicGate.gateType === gate ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: logicGate.gateType === gate ? '#000' : '#fff',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {gate}
                  </button>
                ))}
              </div>
            </div>

            {/* Neural Logic schematic representation */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', margin: '20px 0', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
              {/* Input logic bubbles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>INPUT A:</span>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    borderRadius: '50%', 
                    background: logicGate.inputA ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                    boxShadow: logicGate.inputA ? '0 0 10px var(--accent-cyan)' : 'none'
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{logicGate.inputA ? '1' : '0'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>INPUT B:</span>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    borderRadius: '50%', 
                    background: logicGate.inputB ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                    boxShadow: logicGate.inputB ? '0 0 10px var(--accent-cyan)' : 'none'
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{logicGate.inputB ? '1' : '0'}</span>
                </div>
              </div>

              {/* Glowing Synapse network path symbol */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  padding: '16px 24px', 
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <Brain size={28} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{
                    position: 'absolute',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    color: 'var(--accent-cyan)',
                    bottom: '6px'
                  }}>{logicGate.gateType}</span>
                </div>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Agar Interneurons</span>
              </div>

              {/* Output value bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Result Output</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    background: logicGate.actualOutput ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                    boxShadow: logicGate.actualOutput ? '0 0 10px var(--accent-green)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: '#000',
                    fontSize: '0.75rem'
                  }}>
                    {logicGate.actualOutput ? '1' : '0'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>EXPECTED: {logicGate.expectedOutput ? '1' : '0'}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: logicGate.actualOutput === logicGate.expectedOutput ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {logicGate.actualOutput === logicGate.expectedOutput ? 'CORRECT' : 'ERROR'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Accuracy tracker meters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Logic Accuracy</span>
                <span className="font-telemetry glow-text-cyan" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {logicGate.accuracy}%
                </span>
              </div>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Training Volleys</span>
                <span className="font-telemetry" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                  {logicGate.epochs}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Conditioning chemical control & Training protocols */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Neuro-Stimulators & Perfusion */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award style={{ color: '#d97706' }} size={18} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Synaptic Modulation</h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>
            Inject biochemical neuromodulators directly into agar support structures to adjust the neuroplasticity coefficient.
          </p>

          {/* Dopamine button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
              <span>Dopamine concentration</span>
              <span className="font-telemetry glow-text-cyan" style={{ color: 'var(--accent-cyan)' }}>{dopamineLevel.toFixed(2)} uM</span>
            </div>
            <button
              onClick={administerDopamine}
              className="glass-card"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(0, 240, 255, 0.02))',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)'}
            >
              <Activity size={13} style={{ color: 'var(--accent-cyan)' }} /> Perfuse Dopamine (+3.0uM)
            </button>
          </div>

          {/* GABA button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
              <span>GABA concentration</span>
              <span className="font-telemetry glow-text-green" style={{ color: 'var(--accent-green)' }}>{gabaLevel.toFixed(2)} uM</span>
            </div>
            <button
              onClick={administerGABA}
              className="glass-card"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.1), rgba(0, 255, 127, 0.02))',
                border: '1px solid rgba(0, 255, 127, 0.3)',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 255, 127, 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 255, 127, 0.3)'}
            >
              <Activity size={13} style={{ color: 'var(--accent-green)' }} /> Perfuse GABA (+3.0uM)
            </button>
          </div>
        </div>

        {/* Operating Manual Protocol summary */}
        <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play style={{ color: '#fff' }} size={16} />
            <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Conditioning Protocols</h4>
          </div>
          
          <ul style={{ 
            fontSize: '0.75rem', 
            color: 'rgba(255,255,255,0.5)', 
            paddingLeft: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            lineHeight: '1.4'
          }}>
            <li>
              <strong style={{ color: 'var(--accent-cyan)' }}>HEBBIAN LEARNING:</strong> Axons reinforce pathways that fire synchronously. Keep glucose and oxygen values stable inside incubator.
            </li>
            <li>
              <strong style={{ color: 'var(--accent-cyan)' }}>REWARD SIGNALING:</strong> Successful hits deliver high-frequency sinusoidal voltage pulses, aligning synaptic pathfinding.
            </li>
            <li>
              <strong style={{ color: 'var(--accent-amber)' }}>DOPAMINE SURGE:</strong> Speeds learning plasticity tenfold. Highly unstable; can induce biological seizures (high spike frequencies).
            </li>
            <li>
              <strong style={{ color: 'var(--accent-green)' }}>GABA STABILIZATION:</strong> Injects membrane inhibitors to depress hyper-excitations and reset electrical thresholds.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
