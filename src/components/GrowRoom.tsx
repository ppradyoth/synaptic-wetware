import React, { useEffect, useRef, useState } from 'react';
import type { SimulationVitals } from '../hooks/useWetwareSim';
import { Sprout, RefreshCw, Zap, TrendingUp } from 'lucide-react';

interface GrowRoomProps {
  vitals: SimulationVitals;
  seedStemCells: () => void;
  addLog: (msg: string) => void;
}

interface GrowthPath {
  points: { x: number; y: number }[];
  active: boolean;
  vx: number;
  vy: number;
  color: string;
}

export const GrowRoom: React.FC<GrowRoomProps> = ({
  vitals,
  seedStemCells,
  addLog
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spheroidCanvasRef = useRef<HTMLCanvasElement>(null);
  const [growthPaths, setGrowthPaths] = useState<GrowthPath[]>([]);
  const [isGrowing, setIsGrowing] = useState(false);
  const calciumWavesRef = useRef<Array<{ x: number; y: number; r: number; alpha: number; maxR: number }>>([]);
  const spheroidAnimRef = useRef<number>(0);

  // Trigger biological growth surge (NGF Perfusion)
  const triggerGrowthSurge = () => {
    if (vitals.viability < 70) {
      addLog('NGF injection failed. Organoid viability is too low to sustain growth.');
      return;
    }

    addLog('Injected Nerve Growth Factor (NGF) perfusion. Axonal sprouting accelerated.');
    setIsGrowing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Spawn 10-15 new axonal growth paths starting from random locations
    const newPaths: GrowthPath[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      newPaths.push({
        points: [{ 
          x: canvas.width / 2 + (Math.random() - 0.5) * 100, 
          y: canvas.height / 2 + (Math.random() - 0.5) * 100 
        }],
        active: true,
        vx: Math.cos(angle) * 1.5,
        vy: Math.sin(angle) * 1.5,
        color: `hsla(${120 + Math.random() * 80}, 80%, 55%, 0.65)`
      });
    }

    setGrowthPaths((prev) => [...prev, ...newPaths]);
  };

  // Re-seed cells resets paths
  const handleSeed = () => {
    seedStemCells();
    setGrowthPaths([]);
    setIsGrowing(true);
    calciumWavesRef.current = [];
  };

  // ── 3D Spheroid + Calcium Wave Canvas ────────────────────────
  useEffect(() => {
    const canvas = spheroidCanvasRef.current;
    if (!canvas) return;
    canvas.width  = 220;
    canvas.height = 220;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = 110, cy = 110;
    const baseR = 72 * Math.min(1, vitals.cellCount / 400000);

    // Spawn calcium waves when network is active
    if (vitals.synapticDensity > 200 && Math.random() > 0.88) {
      const angle = Math.random() * Math.PI * 2;
      const spawnR = baseR * (0.3 + Math.random() * 0.6);
      calciumWavesRef.current.push({
        x: cx + Math.cos(angle) * spawnR,
        y: cy + Math.sin(angle) * spawnR,
        r: 0, alpha: 0.7,
        maxR: 30 + Math.random() * 25,
      });
    }

    const drawSpheroid = () => {
      ctx.clearRect(0, 0, 220, 220);

      if (vitals.cellCount < 5000) return;

      // ── Cortical layers (back → front) ──────────────────────
      const layers = [
        { rScale: 1.00, color: [10, 60, 40],   label: 'VZ' },
        { rScale: 0.82, color: [0, 100, 70],   label: 'SVZ' },
        { rScale: 0.63, color: [0, 160, 100],  label: 'CP' },
        { rScale: 0.42, color: [0, 220, 140],  label: 'MZ' },
      ];

      layers.forEach(layer => {
        const r = baseR * layer.rScale;
        const [r0, g0, b0] = layer.color;
        const viab = vitals.viability / 100;
        const grd = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r);
        grd.addColorStop(0, `rgba(${Math.round(r0 * 1.5 * viab)},${Math.round(g0 * 1.5 * viab)},${Math.round(b0 * 1.5 * viab)},0.65)`);
        grd.addColorStop(0.7, `rgba(${Math.round(r0 * viab)},${Math.round(g0 * viab)},${Math.round(b0 * viab)},0.45)`);
        grd.addColorStop(1,   `rgba(${Math.round(r0 * 0.3 * viab)},${Math.round(g0 * 0.3 * viab)},${Math.round(b0 * 0.3 * viab)},0.15)`);
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.92, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // ── Specular highlight ──────────────────────────────────
      const spec = ctx.createRadialGradient(cx - baseR * 0.3, cy - baseR * 0.35, 1, cx - baseR * 0.2, cy - baseR * 0.25, baseR * 0.5);
      spec.addColorStop(0, 'rgba(255,255,255,0.18)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(cx, cy, baseR, baseR * 0.92, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      // ── Calcium wave ripples (simulated GCaMP fluorescence) ─
      calciumWavesRef.current = calciumWavesRef.current.filter(w => w.alpha > 0.03);
      calciumWavesRef.current.forEach(wave => {
        wave.r   += 1.4;
        wave.alpha *= 0.93;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,200,${wave.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // ── Layer labels ────────────────────────────────────────
      if (vitals.synapticDensity > 100) {
        ctx.font = '7px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(0,255,127,0.5)';
        ctx.textAlign = 'right';
        layers.forEach((l, i) => {
          const lr = baseR * l.rScale;
          ctx.fillText(l.label, cx - lr * 0.72, cy + i * 10 - 14);
        });
      }

      // ── Outline rim ─────────────────────────────────────────
      ctx.beginPath();
      ctx.ellipse(cx, cy, baseR, baseR * 0.92, -0.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,255,127,0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      spheroidAnimRef.current = requestAnimationFrame(drawSpheroid);
    };

    drawSpheroid();
    return () => cancelAnimationFrame(spheroidAnimRef.current);
  }, [vitals]);

  // Biological Growth Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust scale
    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = 420;

    // Standard 8x8 coordinates
    const electrodeRadius = 10;
    const columns = 8;
    const rows = 8;
    const spacingX = canvas.width / (columns + 1);
    const spacingY = canvas.height / (rows + 1);

    const electrodeGrid: { x: number; y: number }[] = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= columns; c++) {
        electrodeGrid.push({
          x: c * spacingX,
          y: r * spacingY
        });
      }
    }

    // Set initial seed growth paths if empty and healthy
    let activePaths = [...growthPaths];
    if (activePaths.length === 0 && vitals.synapticDensity > 15 && isGrowing) {
      for (let i = 0; i < 8; i++) {
        const sourceNode = electrodeGrid[Math.floor(Math.random() * electrodeGrid.length)];
        const angle = Math.random() * Math.PI * 2;
        activePaths.push({
          points: [{ x: sourceNode.x, y: sourceNode.y }],
          active: true,
          vx: Math.cos(angle) * 1.2,
          vy: Math.sin(angle) * 1.2,
          color: 'rgba(0, 255, 127, 0.5)'
        });
      }
    }

    let animationId: number;

    const render = () => {
      if (!ctx || !canvas) return;

      // Draw background
      ctx.fillStyle = 'rgba(10, 20, 29, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw electrode grids
      electrodeGrid.forEach((node, idx) => {
        // Subtle glowing outer ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, electrodeRadius * 1.8, 0, Math.PI * 2);
        ctx.stroke();

        // Inner circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, electrodeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Visual electrode node label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.font = '8px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`CH${idx}`, node.x, node.y + 3);
      });

      // Growth cone update loop (Branching axon pathfinding algorithm)
      if (isGrowing && vitals.viability > 50) {
        activePaths.forEach((path) => {
          if (!path.active) return;

          const lastPt = path.points[path.points.length - 1];
          
          // Random walk path deflection + pull towards nearest electrode center
          let closestNode = electrodeGrid[0];
          let minDist = Infinity;
          
          electrodeGrid.forEach((node) => {
            const dist = Math.hypot(node.x - lastPt.x, node.y - lastPt.y);
            if (dist < minDist && dist > 5) {
              minDist = dist;
              closestNode = node;
            }
          });

          // Chemical attractant vector towards electrodes (taxis)
          let pullX = 0;
          let pullY = 0;
          if (minDist < 80) {
            pullX = (closestNode.x - lastPt.x) / minDist * 0.25;
            pullY = (closestNode.y - lastPt.y) / minDist * 0.25;
          }

          // Compute new velocity with random drift
          const randomDriftX = (Math.random() - 0.5) * 0.9;
          const randomDriftY = (Math.random() - 0.5) * 0.9;

          path.vx = Math.max(-2, Math.min(2, path.vx + randomDriftX + pullX));
          path.vy = Math.max(-2, Math.min(2, path.vy + randomDriftY + pullY));

          // Move
          const nextPt = {
            x: lastPt.x + path.vx,
            y: lastPt.y + path.vy
          };

          // Clamp bounds
          if (nextPt.x < 10 || nextPt.x > canvas.width - 10 || nextPt.y < 10 || nextPt.y > canvas.height - 10) {
            path.active = false;
            return;
          }

          path.points.push(nextPt);

          // Synapse formation checkpoint
          if (minDist < 6 && Math.random() > 0.96) {
            // Fused synapse!
            path.color = 'var(--accent-cyan)';
            
            // Randomly branch into two paths (axon bifurcation)
            if (activePaths.length < 80 && Math.random() > 0.85) {
              const angleA = Math.random() * Math.PI * 2;
              const angleB = Math.random() * Math.PI * 2;
              activePaths.push({
                points: [{ x: nextPt.x, y: nextPt.y }],
                active: true,
                vx: Math.cos(angleA) * 1.1,
                vy: Math.sin(angleA) * 1.1,
                color: 'rgba(0, 255, 127, 0.4)'
              });
              activePaths.push({
                points: [{ x: nextPt.x, y: nextPt.y }],
                active: true,
                vx: Math.cos(angleB) * 1.1,
                vy: Math.sin(angleB) * 1.1,
                color: 'rgba(0, 255, 127, 0.4)'
              });
              path.active = false; // Prune parent
            }
          }

          // Cap axon lengths
          if (path.points.length > 250) {
            path.active = false;
          }
        });
      }

      // Draw all Axon trails
      activePaths.forEach((path) => {
        if (path.points.length < 2) return;

        ctx.strokeStyle = path.color;
        ctx.lineWidth = vitals.myelination > 30 ? 2.2 : 1.2;
        ctx.beginPath();
        path.points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();

        // Draw glowing growth cone tip
        if (path.active) {
          const tip = path.points[path.points.length - 1];
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Sync local growth states to React triggers occasionally
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [growthPaths, vitals, isGrowing]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: '20px', height: '100%' }}>
      {/* Top: Grow Room controls and diagnostics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sprout style={{ color: 'var(--accent-green)', filter: 'drop-shadow(0 0 5px var(--accent-green-glow))' }} />
            Chamber 01: Stem Cell & Axon Growth
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
            Simulates stem-cell division, neural migration, pathfinding growth cones, and synaptogenesis.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={triggerGrowthSurge}
            className="glass-card"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 127, 0.1), rgba(0, 240, 255, 0.05))',
              border: '1px solid rgba(0, 255, 127, 0.25)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0, 255, 127, 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 255, 127, 0.25)'}
          >
            <Zap size={15} style={{ color: 'var(--accent-green)' }} /> Inject NGF (Growth Hormone)
          </button>
          <button
            onClick={handleSeed}
            className="glass-card"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
          >
            <RefreshCw size={15} /> Re-seed Chamber
          </button>
        </div>
      </div>

      {/* Grid of growth stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Total Cell Count</span>
          <span className="font-telemetry glow-text-green" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-green)' }}>
            {vitals.cellCount.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>cells</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Average survival index: {vitals.viability}%</span>
        </div>

        <div className="glass-panel animate-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Synaptic Density</span>
          <span className="font-telemetry glow-text-cyan" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {vitals.synapticDensity} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>syn/cell</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Total connected junctions active</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Axonal Net Length</span>
          <span className="font-telemetry" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#a855f7' }}>
            {(vitals.synapticDensity * 0.18 + growthPaths.length * 1.5).toFixed(1)} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>meters</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Integrated paths inside agar hydrogel</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Myelination Index</span>
          <span className="font-telemetry glow-text-amber" style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
            {vitals.myelination}%
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Insulated signal speed optimization</span>
        </div>
      </div>

      {/* Growth Render viewport */}
      <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex' }}>
        {/* Main axon pathfinding canvas */}
        <canvas
          ref={canvasRef}
          style={{ display: 'block', flex: 1, height: '360px', background: 'var(--bg-dark)' }}
        />

        {/* Right side: 3D spheroid + maturation timeline */}
        <div style={{ width: '240px', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.25)' }}>
          {/* Spheroid canvas */}
          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(0,255,127,0.5)', fontWeight: 700, letterSpacing: '0.5px' }}>3D Cortical Spheroid</span>
            <canvas
              ref={spheroidCanvasRef}
              width={220} height={220}
              style={{ width: '200px', height: '200px', borderRadius: '50%' }}
            />
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>GCaMP fluorescence · {vitals.cellCount.toLocaleString()} cells</span>
          </div>

          {/* Maturation Timeline */}
          <div style={{ flex: 1, padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', overflowY: 'auto' }}>
            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Maturation Timeline</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '8px' }}>
              {[
                { day: 0,   label: 'iPSC Seeding',          done: true },
                { day: 7,   label: 'Neural Rosette',         done: vitals.cellCount > 50000 },
                { day: 14,  label: 'VZ/SVZ Patterning',      done: vitals.synapticDensity > 20 },
                { day: 30,  label: 'Cortical Neuron Emergence', done: vitals.synapticDensity > 80 },
                { day: 60,  label: 'Spontaneous Activity',   done: vitals.synapticDensity > 500 },
                { day: 90,  label: 'Network Bursting',        done: vitals.synapticDensity > 1500 },
                { day: 120, label: 'Mature Organoid',         done: vitals.myelination > 40 },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '16px', flexShrink: 0 }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', marginTop: '2px', flexShrink: 0,
                      background: m.done ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                      boxShadow: m.done ? '0 0 6px var(--accent-green)' : 'none',
                      border: m.done ? 'none' : '1px solid rgba(255,255,255,0.15)',
                    }} />
                    {i < 6 && <div style={{ width: '1px', height: '22px', background: m.done ? 'rgba(0,255,127,0.2)' : 'rgba(255,255,255,0.05)' }} />}
                  </div>
                  <div style={{ paddingBottom: '12px' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: m.done ? '#fff' : 'rgba(255,255,255,0.3)' }}>{m.label}</div>
                    <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>Day {m.day}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth telemetry overlay */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(5,10,14,0.75)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px',
          padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '5px',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TrendingUp size={9} style={{ color: 'var(--accent-cyan)' }} /> Growth Telemetry
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
            <div>MODE: <span style={{ color: isGrowing ? 'var(--accent-green)' : 'rgba(255,255,255,0.4)' }}>{isGrowing ? 'AXON PATHFINDING' : 'IDLE'}</span></div>
            <div>CONES: <span style={{ color: 'var(--accent-cyan)' }}>{growthPaths.filter(p => p.active).length}</span></div>
            <div>DIVISION: <span style={{ color: 'var(--accent-green)' }}>{vitals.viability > 90 ? 'OPTIMAL' : vitals.viability > 70 ? 'STABLE' : 'STUNTED'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
