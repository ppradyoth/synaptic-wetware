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
  const [growthPaths, setGrowthPaths] = useState<GrowthPath[]>([]);
  const [isGrowing, setIsGrowing] = useState(false);

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
  };

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
      <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '420px',
            background: 'var(--bg-dark)'
          }}
        />

        {/* Dynamic Growth Overlay Overlay */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(5, 10, 14, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TrendingUp size={10} style={{ color: 'var(--accent-cyan)' }} /> Growth Telemetry
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <div>GROWTH MODE: <span style={{ color: isGrowing ? 'var(--accent-green)' : 'rgba(255,255,255,0.4)' }}>{isGrowing ? 'SPILE PATHFINDING' : 'IDLE'}</span></div>
            <div>ACTIVE GROWTH CONES: <span style={{ color: 'var(--accent-cyan)' }}>{growthPaths.filter(p => p.active).length} nodes</span></div>
            <div>STEM CELL DIVISION: <span style={{ color: 'var(--accent-green)' }}>{(vitals.viability > 90 ? 'OPTIMAL' : vitals.viability > 70 ? 'STABLE' : 'STUNTED')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
