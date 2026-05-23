import React, { useRef, useEffect, useCallback } from 'react';
import type { Electrode } from '../hooks/useWetwareSim';
import { Share2 } from 'lucide-react';

interface ConnectomeGraphProps {
  electrodes: Electrode[];
}

// Functional connectivity: electrodes with correlated firing rates are "connected"
function buildEdges(electrodes: Electrode[]): Array<{ a: number; b: number; strength: number }> {
  const edges: Array<{ a: number; b: number; strength: number }> = [];
  for (let i = 0; i < electrodes.length; i++) {
    for (let j = i + 1; j < electrodes.length; j++) {
      const rateA = electrodes[i].spikeRate;
      const rateB = electrodes[j].spikeRate;
      const avg = (rateA + rateB) / 2;
      if (avg === 0) continue;
      // Pearson-like similarity on firing rate
      const diff = Math.abs(rateA - rateB);
      const strength = Math.max(0, 1 - diff / avg);
      if (strength > 0.75) {
        // Only draw strong connections to keep graph readable
        edges.push({ a: i, b: j, strength });
      }
    }
  }
  return edges;
}

function roleColor(role: Electrode['role']): string {
  switch (role) {
    case 'input-a':   return '#00f0ff';
    case 'input-b':   return '#00f0ff';
    case 'motor-up':  return '#ffbf00';
    case 'motor-down':return '#ffbf00';
    default:          return '#00ff7f';
  }
}

// Force-directed layout (simplified Fruchterman-Reingold, 120 iterations)
function computeLayout(n: number, edges: Array<{ a: number; b: number; strength: number }>, W: number, H: number): Array<{ x: number; y: number }> {
  const k = Math.sqrt((W * H) / n);
  const pos = Array.from({ length: n }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.7,
    y: H / 2 + (Math.random() - 0.5) * H * 0.7,
  }));
  const vel = Array.from({ length: n }, () => ({ x: 0, y: 0 }));

  for (let iter = 0; iter < 120; iter++) {
    const temp = Math.max(2, 30 * (1 - iter / 120));

    // Repulsion
    for (let i = 0; i < n; i++) {
      vel[i] = { x: 0, y: 0 };
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
        const f = (k * k) / dist;
        vel[i].x += (dx / dist) * f;
        vel[i].y += (dy / dist) * f;
      }
    }
    // Attraction
    for (const { a, b } of edges) {
      const dx = pos[a].x - pos[b].x;
      const dy = pos[a].y - pos[b].y;
      const dist = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
      const f = (dist * dist) / k;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      vel[a].x -= fx;
      vel[a].y -= fy;
      vel[b].x += fx;
      vel[b].y += fy;
    }
    // Apply with temperature cap
    for (let i = 0; i < n; i++) {
      const mag = Math.max(0.01, Math.sqrt(vel[i].x ** 2 + vel[i].y ** 2));
      const scale = Math.min(mag, temp) / mag;
      pos[i].x = Math.max(18, Math.min(W - 18, pos[i].x + vel[i].x * scale));
      pos[i].y = Math.max(18, Math.min(H - 18, pos[i].y + vel[i].y * scale));
    }
  }
  return pos;
}

export const ConnectomeGraph: React.FC<ConnectomeGraphProps> = ({ electrodes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<Array<{ x: number; y: number }>>([]);
  const lastElCountRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || electrodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Recompute layout only when electrode count changes (expensive)
    const edges = buildEdges(electrodes);
    if (lastElCountRef.current !== electrodes.length) {
      layoutRef.current = computeLayout(electrodes.length, edges, W, H);
      lastElCountRef.current = electrodes.length;
    }
    const pos = layoutRef.current;
    if (pos.length !== electrodes.length) return;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(2, 6, 12, 0.85)';
    ctx.fillRect(0, 0, W, H);

    // Draw edges
    for (const { a, b, strength } of edges) {
      if (!pos[a] || !pos[b]) continue;
      const alpha = (strength - 0.75) / 0.25; // 0-1 within threshold range
      ctx.beginPath();
      ctx.moveTo(pos[a].x, pos[a].y);
      ctx.lineTo(pos[b].x, pos[b].y);
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.35})`;
      ctx.lineWidth = alpha * 1.5;
      ctx.stroke();
    }

    // Draw nodes
    for (let i = 0; i < electrodes.length; i++) {
      if (!pos[i]) continue;
      const el = electrodes[i];
      const color = roleColor(el.role);
      const firing = el.voltage > 10;
      const r = firing ? 5.5 : 3.5;

      // Glow for firing nodes
      if (firing) {
        const grd = ctx.createRadialGradient(pos[i].x, pos[i].y, 0, pos[i].x, pos[i].y, r * 3);
        grd.addColorStop(0, `${color}60`);
        grd.addColorStop(1, `${color}00`);
        ctx.beginPath();
        ctx.arc(pos[i].x, pos[i].y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(pos[i].x, pos[i].y, r, 0, Math.PI * 2);
      ctx.fillStyle = firing ? color : `${color}70`;
      ctx.fill();

      // Label special roles
      if (el.role !== 'interneuron') {
        ctx.font = '7px JetBrains Mono, monospace';
        ctx.fillStyle = `${color}cc`;
        ctx.textAlign = 'center';
        const label = el.role === 'input-a' ? 'IN-A' : el.role === 'input-b' ? 'IN-B' : el.role === 'motor-up' ? 'M↑' : 'M↓';
        ctx.fillText(label, pos[i].x, pos[i].y - r - 3);
      }
    }

    // Legend
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    const legend = [
      { color: '#00f0ff', label: 'Input' },
      { color: '#ffbf00', label: 'Motor' },
      { color: '#00ff7f', label: 'Interneuron' },
    ];
    legend.forEach((l, i) => {
      ctx.beginPath();
      ctx.arc(12, H - 36 + i * 13, 4, 0, Math.PI * 2);
      ctx.fillStyle = l.color;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(l.label, 22, H - 32 + i * 13);
    });

    // Connection count
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,240,255,0.4)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`${edges.length} functional connections`, W - 8, H - 8);
  }, [electrodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Resize canvas to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  || 420;
    canvas.height = rect.height || 300;
    draw();
  }, [draw]);

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Share2 size={18} style={{ color: 'var(--accent-cyan)' }} />
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Functional Connectome</h3>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
            Force-directed graph of functional electrode connectivity · edges drawn where firing rate correlation &gt; 0.75
          </p>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '10px',
          border: '1px solid rgba(0,240,255,0.08)',
          background: 'rgba(2,6,12,0.85)',
          display: 'block',
        }}
      />
      <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
        Layout computed via Fruchterman-Reingold force-directed algorithm. Nodes reposition as connectivity changes.
        In real MEA analysis this graph is built from spike cross-correlations (MEA-ToolBox, FieldTrip).
      </p>
    </div>
  );
};
