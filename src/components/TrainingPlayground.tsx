import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { TaskType, PongState, LogicGateState } from '../hooks/useWetwareSim';
import { Target, Brain, Award, Play, Activity, Zap } from 'lucide-react';

// ─── Braille letter definitions (dots 1-6, true = raised) ────────────────────

interface BrailleLetter {
  letter: string;
  dots: [boolean, boolean, boolean, boolean, boolean, boolean];
}

const BRAILLE_LETTERS: BrailleLetter[] = [
  { letter: 'A', dots: [true,  false, false, false, false, false] },
  { letter: 'B', dots: [true,  true,  false, false, false, false] },
  { letter: 'C', dots: [true,  false, false, true,  false, false] },
  { letter: 'D', dots: [true,  false, false, true,  true,  false] },
  { letter: 'E', dots: [true,  false, false, false, true,  false] },
  { letter: 'F', dots: [true,  true,  false, true,  false, false] },
  { letter: 'G', dots: [true,  true,  false, true,  true,  false] },
  { letter: 'H', dots: [true,  true,  false, false, true,  false] },
];

// ─── Braille local state types ────────────────────────────────────────────────

interface BrailleHistoryEntry {
  letter: string;
  correct: boolean;
}

interface BrailleTaskState {
  currentIndex: number;
  accuracy: number;
  epochs: number;
  history: BrailleHistoryEntry[];
  stimulating: boolean;
}

// ─── Component props ──────────────────────────────────────────────────────────

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

// ─── BrailleCell sub-component ────────────────────────────────────────────────

interface BrailleCellProps {
  dots: [boolean, boolean, boolean, boolean, boolean, boolean];
  stimulating: boolean;
}

const BrailleCell: React.FC<BrailleCellProps> = ({ dots, stimulating }) => {
  // Standard Braille dot layout:
  //  col 0  col 1
  //  dot1   dot4   (row 0)
  //  dot2   dot5   (row 1)
  //  dot3   dot6   (row 2)
  // Array index: [dot1, dot2, dot3, dot4, dot5, dot6]
  const dotLayout: [number, number, number][] = [
    [0, 0, 0], // dot1 → row 0, col 0, index 0
    [1, 0, 1], // dot2 → row 1, col 0, index 1
    [2, 0, 2], // dot3 → row 2, col 0, index 2
    [0, 1, 3], // dot4 → row 0, col 1, index 3
    [1, 1, 4], // dot5 → row 1, col 1, index 4
    [2, 1, 5], // dot6 → row 2, col 1, index 5
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr 1fr',
      gap: '10px',
      padding: '20px',
      background: 'rgba(0, 0, 0, 0.35)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      width: '96px',
      height: '128px',
    }}>
      {dotLayout.map(([row, col, idx]) => {
        const raised = dots[idx];
        return (
          <div
            key={idx}
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: raised
                ? stimulating
                  ? 'rgba(0, 240, 255, 0.95)'
                  : 'var(--accent-cyan)'
                : 'rgba(255,255,255,0.08)',
              boxShadow: raised
                ? stimulating
                  ? '0 0 14px 4px rgba(0, 240, 255, 0.8), 0 0 4px rgba(0, 240, 255, 1)'
                  : '0 0 8px var(--accent-cyan-glow)'
                : 'none',
              transition: 'all 0.25s ease',
              alignSelf: 'center',
              justifySelf: 'center',
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const TrainingPlayground: React.FC<TrainingPlaygroundProps> = ({
  activeTask,
  setActiveTask,
  pong,
  logicGate,
  setLogicGate,
  administerDopamine,
  administerGABA,
  dopamineLevel,
  gabaLevel,
}) => {
  const pongCanvasRef = useRef<HTMLCanvasElement>(null);
  const stimTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Braille task local state ──────────────────────────────────────────────
  const [braille, setBraille] = useState<BrailleTaskState>({
    currentIndex: 0,
    accuracy: 30,
    epochs: 0,
    history: [],
    stimulating: false,
  });

  // Stable ref to dopamineLevel so the callback doesn't go stale
  const dopamineRef = useRef(dopamineLevel);
  useEffect(() => { dopamineRef.current = dopamineLevel; }, [dopamineLevel]);

  const presentBraillePattern = useCallback(() => {
    if (braille.stimulating) return;

    const currentLetter = BRAILLE_LETTERS[braille.currentIndex];

    // Flash the stimulation indicator
    setBraille(prev => ({ ...prev, stimulating: true }));

    // After 700 ms resolve the trial
    if (stimTimerRef.current !== null) clearTimeout(stimTimerRef.current);
    stimTimerRef.current = setTimeout(() => {
      setBraille(prev => {
        const dopa = dopamineRef.current;
        // Accuracy improvement: probabilistic Δ per epoch
        // Baseline improve ≈ 2%, boosted up to +1% by dopamine level (0–10 scale)
        const improve = 2.0 + (dopa / 10) * 1.0;
        // Correct if random < (accuracy / 100) with a slight floor
        const correct = Math.random() < (prev.accuracy / 100);

        let nextAccuracy = prev.accuracy;
        if (correct) {
          nextAccuracy = Math.min(95, prev.accuracy + improve * (Math.random() * 0.6 + 0.7));
        } else {
          nextAccuracy = Math.max(30, prev.accuracy - 1.5 * Math.random());
        }
        nextAccuracy = Math.round(nextAccuracy * 10) / 10;

        const nextIndex = (prev.currentIndex + 1) % BRAILLE_LETTERS.length;
        const newEntry: BrailleHistoryEntry = { letter: currentLetter.letter, correct };
        const newHistory = [newEntry, ...prev.history].slice(0, 8);

        return {
          currentIndex: nextIndex,
          accuracy: nextAccuracy,
          epochs: prev.epochs + 1,
          history: newHistory,
          stimulating: false,
        };
      });
    }, 700);
  }, [braille.stimulating, braille.currentIndex]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (stimTimerRef.current !== null) clearTimeout(stimTimerRef.current);
    };
  }, []);

  // ── Pong canvas renderer ───────────────────────────────────────────────────
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

    const paddleWidth  = 8;
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

  // ── Derived braille display values ─────────────────────────────────────────
  const currentBrailleLetter = BRAILLE_LETTERS[braille.currentIndex];

  // ── Tab button style helper ────────────────────────────────────────────────
  const tabStyle = (task: TaskType): React.CSSProperties => ({
    background: activeTask === task ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
    border: 'none',
    color: activeTask === task ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.4)',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    transition: 'all 0.2s ease',
  });

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

          {/* Task Selectors tabbed buttons */}
          <div style={{ display: 'flex', background: 'rgba(5, 10, 14, 0.5)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => setActiveTask('pong')} style={tabStyle('pong')}>
              DishBrain Pong
            </button>
            <button onClick={() => setActiveTask('logic')} style={tabStyle('logic')}>
              Logic Gate Network
            </button>
            <button onClick={() => setActiveTask('braille')} style={tabStyle('braille')}>
              Braille Recognition
            </button>
          </div>
        </div>

        {/* ── Viewports ─────────────────────────────────────────────────── */}

        {activeTask === 'pong' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: '#060d13',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)',
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
        )}

        {activeTask === 'logic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(5, 10, 14, 0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
            {/* Logic Gate Visual Schematic */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Synaptic Logic Optimization</h3>

              <div style={{ display: 'flex', gap: '8px' }}>
                {(['AND', 'OR', 'XOR'] as LogicGateState['gateType'][]).map((gate) => (
                  <button
                    key={gate}
                    onClick={() => setLogicGate(gate)}
                    style={{
                      background: logicGate.gateType === gate ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: logicGate.gateType === gate ? '#000' : '#fff',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
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
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: logicGate.inputA ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                    boxShadow: logicGate.inputA ? '0 0 10px var(--accent-cyan)' : 'none',
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{logicGate.inputA ? '1' : '0'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>INPUT B:</span>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: logicGate.inputB ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                    boxShadow: logicGate.inputB ? '0 0 10px var(--accent-cyan)' : 'none',
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
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  <Brain size={28} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent-cyan)', bottom: '6px' }}>
                    {logicGate.gateType}
                  </span>
                </div>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Agar Interneurons</span>
              </div>

              {/* Output value bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Result Output</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: logicGate.actualOutput ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                    boxShadow: logicGate.actualOutput ? '0 0 10px var(--accent-green)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#000', fontSize: '0.75rem',
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

        {activeTask === 'braille' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(5, 10, 14, 0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>

            {/* Title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} style={{ color: 'var(--accent-cyan)' }} />
                  Braille Pattern Recognition
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '6px', maxWidth: '520px', lineHeight: '1.5' }}>
                  Electrical pulses encoding each Braille dot are sent to 6 dedicated MEA input channels.
                  The organoid classifies the pattern by its output spike distribution.
                </p>
              </div>
              {/* Epoch counter */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '90px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Epoch</span>
                <span className="font-telemetry" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
                  {braille.epochs}
                </span>
              </div>
            </div>

            {/* Main stimulation row: Braille cell + target letter + button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '16px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>

              {/* 2×3 Braille dot grid */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Current Pattern</span>
                <BrailleCell dots={currentBrailleLetter.dots} stimulating={braille.stimulating} />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '110px' }}>
                  {currentBrailleLetter.dots.map((raised, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.55rem',
                        fontFamily: 'var(--font-mono)',
                        color: raised ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)',
                        fontWeight: 700,
                      }}
                    >
                      D{i + 1}:{raised ? '1' : '0'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.2)' }}>→</span>

              {/* MEA channels label */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>MEA Channels</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {currentBrailleLetter.dots.map((raised, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: raised
                          ? braille.stimulating ? 'var(--accent-cyan)' : 'rgba(0,240,255,0.5)'
                          : 'rgba(255,255,255,0.06)',
                        boxShadow: raised && braille.stimulating ? '0 0 6px var(--accent-cyan)' : 'none',
                        transition: 'all 0.2s ease',
                      }} />
                      <span style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>
                        CH-{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.2)' }}>→</span>

              {/* Target letter + organoid */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Target Letter</span>
                <div style={{
                  fontSize: '4rem',
                  fontWeight: 800,
                  color: braille.stimulating ? 'var(--accent-cyan)' : '#fff',
                  textShadow: braille.stimulating ? '0 0 20px var(--accent-cyan-glow)' : 'none',
                  lineHeight: 1,
                  transition: 'all 0.25s ease',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {currentBrailleLetter.letter}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <Brain size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                    {braille.stimulating ? 'classifying...' : 'organoid ready'}
                  </span>
                </div>
              </div>

              {/* Present Pattern button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={presentBraillePattern}
                  disabled={braille.stimulating}
                  style={{
                    background: braille.stimulating
                      ? 'rgba(0, 240, 255, 0.05)'
                      : 'linear-gradient(135deg, rgba(0, 240, 255, 0.18), rgba(0, 240, 255, 0.04))',
                    border: `1px solid ${braille.stimulating ? 'rgba(0,240,255,0.1)' : 'rgba(0,240,255,0.45)'}`,
                    color: braille.stimulating ? 'rgba(255,255,255,0.3)' : '#fff',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    cursor: braille.stimulating ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Zap size={13} style={{ color: braille.stimulating ? 'rgba(0,240,255,0.3)' : 'var(--accent-cyan)' }} />
                  {braille.stimulating ? 'Stimulating…' : 'Present Pattern'}
                </button>
                <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', maxWidth: '100px' }}>
                  Pulses 6 MEA channels
                </span>
              </div>
            </div>

            {/* Accuracy bar + stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Recognition Accuracy</span>
                  <span className="font-telemetry" style={{ color: 'var(--accent-cyan)' }}>{braille.accuracy.toFixed(1)}%</span>
                </div>
                {/* Accuracy bar */}
                <div style={{
                  height: '8px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '4px',
                    width: `${braille.accuracy}%`,
                    background: braille.accuracy >= 80
                      ? 'linear-gradient(90deg, var(--accent-green), rgba(0,255,127,0.6))'
                      : braille.accuracy >= 55
                        ? 'linear-gradient(90deg, var(--accent-cyan), rgba(0,240,255,0.6))'
                        : 'linear-gradient(90deg, rgba(255,160,0,0.8), rgba(255,120,0,0.6))',
                    transition: 'width 0.5s ease',
                    boxShadow: braille.accuracy >= 80
                      ? '0 0 8px rgba(0,255,127,0.5)'
                      : '0 0 8px rgba(0,240,255,0.4)',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>
                  <span>Chance: 12.5%</span>
                  <span>Target: 95%</span>
                  <span>Dopamine boost: +{((dopamineLevel / 10) * 1.0).toFixed(1)}%/epoch</span>
                </div>
              </div>
            </div>

            {/* History log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                Classification History (last 8)
              </span>
              {braille.history.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                  No trials yet. Press &lsquo;Present Pattern&rsquo; to begin stimulation.
                </span>
              ) : (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {braille.history.map((entry, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: entry.correct
                          ? 'rgba(0, 255, 127, 0.08)'
                          : 'rgba(255, 80, 80, 0.08)',
                        border: `1px solid ${entry.correct ? 'rgba(0,255,127,0.2)' : 'rgba(255,80,80,0.2)'}`,
                        minWidth: '38px',
                      }}
                    >
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {entry.letter}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: entry.correct ? 'var(--accent-green)' : '#ff5050',
                      }}>
                        {entry.correct ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                transition: 'all 0.2s ease',
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
                transition: 'all 0.2s ease',
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
            lineHeight: '1.4',
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
            {activeTask === 'braille' && (
              <li>
                <strong style={{ color: 'var(--accent-cyan)' }}>BRAILLE MEA:</strong> Based on Graz University 2024 research. Each Braille dot maps to a dedicated MEA input channel. Organoid output spike distribution encodes the classified letter.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
