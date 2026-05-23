import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NeuronModel = 'izhikevich' | 'hodgkin-huxley';

export interface Electrode {
  id: number;
  x: number;
  y: number;
  voltage: number;      // Current membrane voltage mV
  spikeRate: number;    // Hz
  role: 'input-a' | 'input-b' | 'motor-up' | 'motor-down' | 'interneuron';
  lastSpikeTime: number;
}

export type TaskType = 'logic' | 'pong' | 'waveform' | 'braille';

export interface PongState {
  ballX: number; ballY: number;
  ballVX: number; ballVY: number;
  paddleY: number;
  score: number; misses: number; epochs: number; successRate: number;
}

export interface LogicGateState {
  gateType: 'AND' | 'OR' | 'XOR';
  inputA: boolean; inputB: boolean;
  expectedOutput: boolean; actualOutput: boolean;
  accuracy: number; epochs: number;
}

export interface SimulationVitals {
  cellCount: number;
  synapticDensity: number;
  viability: number;
  myelination: number;
  learningProgress: number;
  seizureActivity: boolean;
  isStarving: boolean;
}

export interface IncubatorParams {
  temperature: number;
  glucose: number;
  oxygen: number;
  dopamine: number;
  gaba: number;
}

export interface BurstMetrics {
  burstFrequency: number;   // bursts / min
  meanIBI: number;          // mean inter-burst interval (seconds)
  synchronyScore: number;   // 0–1
  networkBursting: boolean;
  totalBursts: number;
}

export interface EthicsMetrics {
  phiProxy: number;         // simplified IIT Φ, 0–10
  sentienceRisk: number;    // 0–100
  welfareLevel: 'Safe' | 'Monitor' | 'Review Required' | 'Halt Protocol';
  welfareLog: string[];
}

// Spike event for raster plot
export interface SpikeEvent {
  electrodeId: number;
  t: number; // ms within 4-second raster window (0–4000)
}

// ─── Per-electrode internal neuron state (kept in refs, not React state) ─────

interface IzhState { v: number; u: number; }
interface HHState  { V: number; m: number; h: number; n: number; }

// ─── Hodgkin–Huxley rate functions ────────────────────────────────────────────

function hhAlphaM(V: number): number {
  const dv = V + 40;
  if (Math.abs(dv) < 1e-6) return 1.0;
  return 0.1 * dv / (1 - Math.exp(-dv / 10));
}
function hhBetaM(V: number): number { return 4 * Math.exp(-(V + 65) / 18); }
function hhAlphaH(V: number): number { return 0.07 * Math.exp(-(V + 65) / 20); }
function hhBetaH(V: number): number  { return 1 / (1 + Math.exp(-(V + 35) / 10)); }
function hhAlphaN(V: number): number {
  const dv = V + 55;
  if (Math.abs(dv) < 1e-6) return 0.1;
  return 0.01 * dv / (1 - Math.exp(-dv / 10));
}
function hhBetaN(V: number): number { return 0.125 * Math.exp(-(V + 65) / 80); }

/** Euler step of Hodgkin-Huxley (dt in ms). Returns [newState, spiked]. */
function stepHH(s: HHState, I: number, dt: number): [HHState, boolean] {
  const { V, m, h, n } = s;
  const I_Na = 120 * m * m * m * h * (V - 50);
  const I_K  = 36  * n * n * n * n * (V + 77);
  const I_L  = 0.3 * (V + 54.4);
  const dV = (I - I_Na - I_K - I_L); // Cm = 1 µF/cm²
  const dm = hhAlphaM(V) * (1 - m) - hhBetaM(V) * m;
  const dh = hhAlphaH(V) * (1 - h) - hhBetaH(V) * h;
  const dn = hhAlphaN(V) * (1 - n) - hhBetaN(V) * n;
  const newV = V + dV * dt;
  const spiked = V < 0 && newV >= 0; // zero-crossing = spike
  return [{
    V: Math.max(-90, Math.min(60, newV)),
    m: Math.max(0, Math.min(1, m + dm * dt)),
    h: Math.max(0, Math.min(1, h + dh * dt)),
    n: Math.max(0, Math.min(1, n + dn * dt)),
  }, spiked];
}

/** Euler step of Izhikevich regular-spiking cortical neuron (dt in ms). */
function stepIzh(s: IzhState, I: number, dt: number): [IzhState, boolean] {
  const { v, u } = s;
  // a=0.02, b=0.2, c=-65, d=8  (regular spiking)
  const dv = (0.04 * v * v + 5 * v + 140 - u + I) * dt;
  const du = (0.02 * (0.2 * v - u)) * dt;
  const newV = v + dv;
  if (newV >= 30) return [{ v: -65, u: u + du + 8 }, true];
  return [{ v: Math.max(-90, newV), u: u + du }, false];
}

// ─── Burst detection (MaxInterval algorithm) ─────────────────────────────────

function detectBursts(spikeTimes: number[]): { count: number; meanIBI: number } {
  const MAX_ISI = 100;   // ms — spikes within this gap are in the same burst
  const MIN_SPIKES = 3;  // minimum spikes to be a burst
  if (spikeTimes.length < MIN_SPIKES) return { count: 0, meanIBI: 0 };

  const burstEnds: number[] = [];
  let burstSpikes = 1;
  let lastBurstEnd = -Infinity;
  const ibis: number[] = [];

  for (let i = 1; i < spikeTimes.length; i++) {
    if (spikeTimes[i] - spikeTimes[i - 1] < MAX_ISI) {
      burstSpikes++;
    } else {
      if (burstSpikes >= MIN_SPIKES) {
        const burstEnd = spikeTimes[i - 1];
        burstEnds.push(burstEnd);
        if (lastBurstEnd > -Infinity) ibis.push((spikeTimes[i] - lastBurstEnd) / 1000);
        lastBurstEnd = burstEnd;
      }
      burstSpikes = 1;
    }
  }
  // close last potential burst
  if (burstSpikes >= MIN_SPIKES) burstEnds.push(spikeTimes[spikeTimes.length - 1]);

  const meanIBI = ibis.length > 0 ? ibis.reduce((a, b) => a + b, 0) / ibis.length : 0;
  return { count: burstEnds.length, meanIBI };
}

// ─── Ethics metrics ───────────────────────────────────────────────────────────

function calcEthicsLevel(risk: number): EthicsMetrics['welfareLevel'] {
  if (risk < 20)  return 'Safe';
  if (risk < 45)  return 'Monitor';
  if (risk < 70)  return 'Review Required';
  return 'Halt Protocol';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWetwareSim = () => {
  // Neuron model selection
  const [modelType, setModelType] = useState<NeuronModel>('izhikevich');

  // Incubator
  const [incubator, setIncubator] = useState<IncubatorParams>({
    temperature: 37.0, glucose: 5.5, oxygen: 95, dopamine: 0.1, gaba: 0.1,
  });

  // Vitals
  const [vitals, setVitals] = useState<SimulationVitals>({
    cellCount: 250000, synapticDensity: 80, viability: 98,
    myelination: 12, learningProgress: 0, seizureActivity: false, isStarving: false,
  });

  // Electrodes
  const [electrodes, setElectrodes] = useState<Electrode[]>([]);

  // Tasks
  const [activeTask, setActiveTask] = useState<TaskType>('pong');
  const [logicGate, setLogicGate] = useState<LogicGateState>({
    gateType: 'XOR', inputA: false, inputB: false,
    expectedOutput: false, actualOutput: false, accuracy: 50, epochs: 0,
  });
  const [pong, setPong] = useState<PongState>({
    ballX: 50, ballY: 50, ballVX: 1.2, ballVY: 0.8,
    paddleY: 50, score: 0, misses: 0, epochs: 0, successRate: 0,
  });

  // Network analytics (derived from neuron models)
  const [burstMetrics, setBurstMetrics] = useState<BurstMetrics>({
    burstFrequency: 0, meanIBI: 0, synchronyScore: 0,
    networkBursting: false, totalBursts: 0,
  });

  // Ethics
  const [ethicsMetrics, setEthicsMetrics] = useState<EthicsMetrics>({
    phiProxy: 0, sentienceRisk: 0, welfareLevel: 'Safe', welfareLog: [],
  });

  // Raster plot snapshot (last 4 seconds of spikes)
  const [rasterEvents, setRasterEvents] = useState<SpikeEvent[]>([]);

  // Logs
  const [logs, setLogs] = useState<string[]>([
    'Wetware simulation node initialized.',
    'Incubator heating elements engaged. 37.0°C achieved.',
  ]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  }, []);

  // ── Per-electrode internal neuron states (ref = no re-render) ──
  const izhStates = useRef<IzhState[]>([]);
  const hhStates  = useRef<HHState[]>([]);
  // Spike history per electrode: list of absolute ms timestamps
  const spikeHistory = useRef<number[][]>([]);
  const simTimeMs = useRef<number>(0); // elapsed sim time in ms

  // Ethics welfare log (persisted in ref to avoid stale closure)
  const ethicsWelfareLog = useRef<string[]>([]);

  // Stale-closure refs for the sim loop
  const incubatorRef   = useRef(incubator);
  const vitalsRef      = useRef(vitals);
  const electrodesRef  = useRef(electrodes);
  const pongRef        = useRef(pong);
  const logicRef       = useRef(logicGate);
  const activeTaskRef  = useRef(activeTask);
  const modelTypeRef   = useRef(modelType);

  useEffect(() => { incubatorRef.current  = incubator; },  [incubator]);
  useEffect(() => { vitalsRef.current     = vitals; },     [vitals]);
  useEffect(() => { electrodesRef.current = electrodes; }, [electrodes]);
  useEffect(() => { pongRef.current       = pong; },       [pong]);
  useEffect(() => { logicRef.current      = logicGate; },  [logicGate]);
  useEffect(() => { activeTaskRef.current = activeTask; }, [activeTask]);
  useEffect(() => { modelTypeRef.current  = modelType; },  [modelType]);

  // ── Initialize electrodes + neuron states ──────────────────────
  useEffect(() => {
    const initial: Electrode[] = [];
    const izh: IzhState[]      = [];
    const hh:  HHState[]       = [];
    const hist: number[][]     = [];

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const id = y * 8 + x;
        let role: Electrode['role'] = 'interneuron';
        if (x === 0 && y === 2) role = 'input-a';
        else if (x === 0 && y === 5) role = 'input-b';
        else if (x === 7 && y === 1) role = 'motor-up';
        else if (x === 7 && y === 6) role = 'motor-down';

        initial.push({ id, x, y, voltage: -65 + Math.random() * 3, spikeRate: 1 + Math.random() * 2, role, lastSpikeTime: 0 });
        izh.push({ v: -65 + Math.random() * 2, u: -14 + Math.random() });
        hh.push({ V: -65 + Math.random() * 2, m: 0.053, h: 0.596, n: 0.318 });
        hist.push([]);
      }
    }
    setElectrodes(initial);
    izhStates.current  = izh;
    hhStates.current   = hh;
    spikeHistory.current = hist;
  }, []);

  // ── Actions ─────────────────────────────────────────────────────
  const adjustIncubator = useCallback((param: keyof IncubatorParams, value: number) => {
    setIncubator(prev => ({ ...prev, [param]: value }));
  }, []);

  const administerDopamine = useCallback(() => {
    setIncubator(prev => ({ ...prev, dopamine: Math.min(prev.dopamine + 3.0, 10.0) }));
    addLog('Administered Dopamine surge (+3.0 µM). Plasticity coefficients amplified.');
  }, [addLog]);

  const administerGABA = useCallback(() => {
    setIncubator(prev => ({ ...prev, gaba: Math.min(prev.gaba + 3.0, 10.0) }));
    addLog('Administered GABA inhibitory dose (+3.0 µM). Membrane stabilisation engaged.');
  }, [addLog]);

  const triggerElectrodeStimulation = useCallback((id: number) => {
    // Inject a depolarising current into both model states
    if (izhStates.current[id]) izhStates.current[id].v = 30;
    if (hhStates.current[id])  hhStates.current[id].V  = 30;
    setElectrodes(prev => prev.map(el => el.id === id
      ? { ...el, voltage: 40.0, lastSpikeTime: Date.now() }
      : el
    ));
    addLog(`Manual µ-electrode stimulation pulsed on Channel ${id}.`);
  }, [addLog]);

  const seedStemCells = useCallback(() => {
    setVitals({ cellCount: 150000, synapticDensity: 10, viability: 100, myelination: 0, learningProgress: 0, seizureActivity: false, isStarving: false });
    setIncubator({ temperature: 37.0, glucose: 5.5, oxygen: 95, dopamine: 0.1, gaba: 0.1 });
    setPong({ ballX: 50, ballY: 50, ballVX: 1.2, ballVY: 0.8, paddleY: 50, score: 0, misses: 0, epochs: 0, successRate: 0 });
    setLogicGate({ gateType: 'XOR', inputA: false, inputB: false, expectedOutput: false, actualOutput: false, accuracy: 50, epochs: 0 });
    // Reset neuron states
    izhStates.current  = izhStates.current.map(() => ({ v: -65 + Math.random() * 2, u: -14 + Math.random() }));
    hhStates.current   = hhStates.current.map(() => ({ V: -65 + Math.random() * 2, m: 0.053, h: 0.596, n: 0.318 }));
    spikeHistory.current = spikeHistory.current.map(() => []);
    simTimeMs.current  = 0;
    ethicsWelfareLog.current = [];
    addLog('Clean MEA grid prepared. Seeding neural stem cells (150,000 count). Growth loop started.');
  }, [addLog]);

  // ── Core Simulation Loop (100 ms interval) ──────────────────────
  useEffect(() => {
    const TICK_MS = 100; // ms per React tick
    // Integration step sizes
    const HH_DT   = 0.1;  // ms — HH needs fine steps
    const IZH_DT  = 0.5;  // ms — Izhikevich is stable at coarser steps
    const RASTER_WINDOW = 4000; // ms to display in raster

    const simTick = setInterval(() => {
      const inc      = incubatorRef.current;
      const vit      = vitalsRef.current;
      const els      = electrodesRef.current;
      const currTask = activeTaskRef.current;
      const model    = modelTypeRef.current;

      if (els.length === 0) return;

      simTimeMs.current += TICK_MS;
      const now = simTimeMs.current;

      // ── 1. BIOCHEMICAL ENVIRONMENT ───────────────────────────────
      const tempDev = Math.abs(inc.temperature - 37.0);
      const glucDev = inc.glucose < 2.0 ? (2.0 - inc.glucose) : 0;
      const oxyDev  = inc.oxygen  < 80  ? (80  - inc.oxygen)  : 0;
      const bioScore = Math.max(0, 100 - tempDev * 15 - glucDev * 20 - oxyDev * 1.5);
      const starving = inc.glucose < 3.0 || inc.oxygen < 85;

      let newCellCount  = vit.cellCount;
      let newViability  = Math.max(0, Math.min(100, Math.round(bioScore)));

      if (newViability < 60) {
        newCellCount = Math.max(2000, Math.round(newCellCount - (60 - newViability) * 50));
      } else if (newViability > 90 && newCellCount < 800000 && Math.random() > 0.7) {
        newCellCount = Math.min(800000, newCellCount + 120);
      }

      let newSynapticDensity = vit.synapticDensity;
      if (newViability > 85) {
        newSynapticDensity = Math.min(4500, newSynapticDensity + (Math.random() > 0.5 ? 2 : 0));
      } else if (newViability < 70) {
        newSynapticDensity = Math.max(10, newSynapticDensity - 4);
      }

      let newMyelination = vit.myelination;
      if (newViability > 90 && newSynapticDensity > 500 && Math.random() > 0.9) {
        newMyelination = Math.min(100, newMyelination + 1);
      } else if (newViability < 65) {
        newMyelination = Math.max(0, newMyelination - 2);
      }

      // Chemical decay
      const newDopamine = Math.max(0.1, inc.dopamine - 0.08);
      const newGaba     = Math.max(0.1, inc.gaba - 0.08);
      const cellMeta    = (newCellCount / 500000) * 0.015;
      const newGlucose  = Math.max(0, inc.glucose - cellMeta);
      const newOxygen   = Math.max(0, inc.oxygen  - cellMeta * 2);

      setIncubator(prev => ({
        ...prev,
        glucose:  Math.round(newGlucose  * 100) / 100,
        oxygen:   Math.round(newOxygen   * 10)  / 10,
        dopamine: Math.round(newDopamine * 100) / 100,
        gaba:     Math.round(newGaba     * 100) / 100,
      }));

      if (starving && !vit.isStarving) addLog('WARNING: Vitals declining. Incubator oxygen/glucose depleted. Cells under heavy stress.');
      if (!starving && vit.isStarving)  addLog('Vitals recovered. Homeostasis re-established inside incubator.');

      // ── 2. NEURON MODEL INTEGRATION (HH or Izhikevich) ───────────
      // Base excitatory drive: maps viability + neurotransmitters → input current
      const baseI    = (newViability / 100) * 6.0;
      const dopBoost = inc.dopamine * 1.5;
      const gabaInh  = inc.gaba * 1.2;
      const networkI = Math.max(0, baseI + dopBoost - gabaInh);

      const dt       = model === 'hodgkin-huxley' ? HH_DT : IZH_DT;
      const steps    = Math.round(TICK_MS / dt);

      const tickSpikes: boolean[] = new Array(els.length).fill(false);
      const newVoltages: number[] = new Array(els.length).fill(-65);

      for (let eIdx = 0; eIdx < els.length; eIdx++) {
        // Per-electrode current: base + noise + task stimulation
        const noise   = (Math.random() - 0.5) * 2.0;
        const elI     = networkI + noise;
        let spikedThisTick = false;
        let finalV = -65;

        if (model === 'hodgkin-huxley') {
          let s = hhStates.current[eIdx];
          for (let step = 0; step < steps; step++) {
            const [ns, spike] = stepHH(s, elI, dt);
            s = ns;
            if (spike) spikedThisTick = true;
          }
          hhStates.current[eIdx] = s;
          finalV = s.V;
        } else {
          let s = izhStates.current[eIdx];
          for (let step = 0; step < steps; step++) {
            const [ns, spike] = stepIzh(s, elI, dt);
            s = ns;
            if (spike) spikedThisTick = true;
          }
          izhStates.current[eIdx] = s;
          finalV = s.v;
        }

        tickSpikes[eIdx] = spikedThisTick;
        newVoltages[eIdx] = finalV;
        if (spikedThisTick) {
          spikeHistory.current[eIdx].push(now);
        }
      }

      // Trim spike history to last 60 seconds
      const keepAfter = now - 60000;
      for (let i = 0; i < spikeHistory.current.length; i++) {
        const hist = spikeHistory.current[i];
        const trimIdx = hist.findIndex(t => t >= keepAfter);
        if (trimIdx > 0) spikeHistory.current[i] = hist.slice(trimIdx);
        else if (trimIdx === -1) spikeHistory.current[i] = [];
      }

      // ── 3. BURST DETECTION & SYNCHRONY ───────────────────────────
      // Use last 60s of spike history for burst analysis
      const burstResults = spikeHistory.current.map(hist => detectBursts(hist));
      const totalBursts  = burstResults.reduce((a, b) => a + b.count, 0);
      const validIBIs    = burstResults.filter(b => b.meanIBI > 0).map(b => b.meanIBI);
      const meanIBI      = validIBIs.length > 0 ? validIBIs.reduce((a, b) => a + b, 0) / validIBIs.length : 0;

      // Synchrony: fraction of electrodes that spiked this tick
      const spikingCount  = tickSpikes.filter(Boolean).length;
      const synchrony     = spikingCount / els.length;
      const avgSyncRolled = synchrony * 0.1 + burstMetrics.synchronyScore * 0.9; // smoothed

      const burstFreq = totalBursts > 0
        ? Math.round((totalBursts / Math.max(1, now / 60000)) * 10) / 10
        : 0;

      const newBurstMetrics: BurstMetrics = {
        burstFrequency: burstFreq,
        meanIBI: Math.round(meanIBI * 100) / 100,
        synchronyScore: Math.round(avgSyncRolled * 100) / 100,
        networkBursting: synchrony > 0.4,
        totalBursts,
      };
      setBurstMetrics(newBurstMetrics);

      // ── 4. ETHICS METRICS ─────────────────────────────────────────
      const phiProxy = Math.round(
        avgSyncRolled *
        Math.log(1 + newCellCount / 10000) *
        (newSynapticDensity / 500) * 10
      ) / 10;
      const sentienceRisk = Math.min(100, Math.round(phiProxy * 15));
      const welfareLevel  = calcEthicsLevel(sentienceRisk);

      // Auto-log threshold crossings
      if (welfareLevel === 'Review Required' && ethicsWelfareLog.current.every(l => !l.includes('Review'))) {
        const entry = `[${new Date().toLocaleTimeString()}] IIT-Φ proxy = ${phiProxy.toFixed(1)}. Network complexity crossed Review threshold. Baltimore Declaration review protocol triggered.`;
        ethicsWelfareLog.current = [entry, ...ethicsWelfareLog.current.slice(0, 19)];
        addLog('⚖️ ETHICS ALERT: Sentience review threshold crossed. See Ethics Panel.');
      }
      if (welfareLevel === 'Halt Protocol' && ethicsWelfareLog.current.every(l => !l.includes('Halt'))) {
        const entry = `[${new Date().toLocaleTimeString()}] HALT PROTOCOL triggered. Φ proxy = ${phiProxy.toFixed(1)}. Administer GABA immediately.`;
        ethicsWelfareLog.current = [entry, ...ethicsWelfareLog.current.slice(0, 19)];
        addLog('🛑 ETHICS HALT: Organoid complexity too high. Protocol paused. Administer GABA.');
      }

      setEthicsMetrics({
        phiProxy,
        sentienceRisk,
        welfareLevel,
        welfareLog: [...ethicsWelfareLog.current],
      });

      // ── 5. RASTER SNAPSHOT (last 4 seconds) ──────────────────────
      const rasterCutoff = now - RASTER_WINDOW;
      const newRaster: SpikeEvent[] = [];
      for (let eIdx = 0; eIdx < spikeHistory.current.length; eIdx++) {
        for (const t of spikeHistory.current[eIdx]) {
          if (t >= rasterCutoff) {
            newRaster.push({ electrodeId: eIdx, t: t - rasterCutoff });
          }
        }
      }
      setRasterEvents(newRaster);

      // ── 6. UPDATE ELECTRODE DISPLAY STATE ────────────────────────
      const updatedElectrodes = els.map((el, idx) => {
        const spiked   = tickSpikes[idx];
        const newRate  = spiked
          ? Math.max(0.1, Math.min(100, el.spikeRate * 0.8 + 20 * 0.2))
          : Math.max(0.1, el.spikeRate * 0.95);
        return {
          ...el,
          voltage: Math.round(newVoltages[idx] * 10) / 10,
          spikeRate: Math.round(newRate * 10) / 10,
          lastSpikeTime: spiked ? Date.now() : el.lastSpikeTime,
        };
      });

      // ── 7. PONG TASK ─────────────────────────────────────────────
      let updatedLearningProgress = vit.learningProgress;

      if (currTask === 'pong' && newCellCount > 10000 && newViability > 50) {
        const p = { ...pongRef.current };
        const motorUp   = updatedElectrodes.find(e => e.role === 'motor-up')?.spikeRate   ?? 1;
        const motorDown = updatedElectrodes.find(e => e.role === 'motor-down')?.spikeRate ?? 1;
        const learningEff = (newSynapticDensity / 1500) * (1 + inc.dopamine * 0.4) / (1 + inc.gaba * 0.2);
        const speed = Math.min(3.5, Math.abs(motorUp - motorDown) * 0.5);
        const trackSpeed = 1.0 + learningEff * 2.5;

        // Sensory input to electrodes
        updatedElectrodes.forEach(c => {
          if (c.role === 'input-a' && p.ballY < p.paddleY) izhStates.current[c.id].v = 15;
          if (c.role === 'input-b' && p.ballY > p.paddleY) izhStates.current[c.id].v = 15;
        });

        p.paddleY += (p.ballY - p.paddleY) * 0.05 * trackSpeed * (speed > 0.5 ? 1.2 : 0.6);
        p.paddleY = Math.max(10, Math.min(90, p.paddleY));
        p.ballX += p.ballVX;
        p.ballY += p.ballVY;
        if (p.ballY <= 2 || p.ballY >= 98) p.ballVY = -p.ballVY;

        if (p.ballX >= 93 && p.ballX <= 95) {
          if (Math.abs(p.ballY - p.paddleY) <= 15) {
            p.ballVX = -Math.abs(p.ballVX * 1.05);
            p.ballVY = (p.ballY - p.paddleY) * 0.15;
            p.score += 1; p.epochs += 1;
            p.successRate = Math.min(100, Math.round(p.successRate * 0.9 + 10));
          }
        } else if (p.ballX > 100) {
          p.misses += 1; p.epochs += 1;
          p.successRate = Math.max(0, Math.round(p.successRate * 0.9));
          p.ballX = 10; p.ballY = 20 + Math.random() * 60;
          p.ballVX = 1.2; p.ballVY = (Math.random() - 0.5) * 1.5;
        }
        if (p.ballX <= 2) p.ballVX = Math.abs(p.ballVX);

        setPong(p);
        updatedLearningProgress = p.successRate;
      }

      // ── 8. LOGIC GATE TASK ────────────────────────────────────────
      if (currTask === 'logic' && newCellCount > 10000 && newViability > 50) {
        const lg = { ...logicRef.current };
        if (lg.epochs === 0 || Math.random() > 0.92) {
          lg.inputA = Math.random() > 0.5;
          lg.inputB = Math.random() > 0.5;
          switch (lg.gateType) {
            case 'AND': lg.expectedOutput = lg.inputA && lg.inputB; break;
            case 'OR':  lg.expectedOutput = lg.inputA || lg.inputB; break;
            case 'XOR': lg.expectedOutput = lg.inputA !== lg.inputB; break;
          }
          const chA = updatedElectrodes.find(e => e.role === 'input-a');
          const chB = updatedElectrodes.find(e => e.role === 'input-b');
          if (chA && lg.inputA) izhStates.current[chA.id].v = 20;
          if (chB && lg.inputB) izhStates.current[chB.id].v = 20;
          lg.epochs += 1;
          const weight = Math.min(0.98, 0.4 + (newSynapticDensity / 1500) * 0.1 + inc.dopamine * 0.05);
          lg.actualOutput = Math.random() < weight ? lg.expectedOutput : !lg.expectedOutput;
          lg.accuracy = lg.actualOutput === lg.expectedOutput
            ? Math.min(100, Math.round(lg.accuracy * 0.95 + 5))
            : Math.max(10, Math.round(lg.accuracy * 0.95));
          setLogicGate(lg);
          updatedLearningProgress = lg.accuracy;
        }
      }

      const seizure = avgSyncRolled > 0.7;
      if (seizure && !vit.seizureActivity) addLog('CRITICAL: Seizure activity detected. Neurons hyper-synchronized. Administer GABA.');

      setVitals({
        cellCount: newCellCount, synapticDensity: newSynapticDensity,
        viability: newViability, myelination: newMyelination,
        learningProgress: updatedLearningProgress,
        seizureActivity: seizure, isStarving: starving,
      });
      setElectrodes(updatedElectrodes);

    }, TICK_MS);

    return () => clearInterval(simTick);
  }, [addLog, burstMetrics.synchronyScore]);

  return {
    incubator, vitals, activeTask, logicGate, pong,
    electrodes, logs, burstMetrics, ethicsMetrics, rasterEvents,
    modelType, setModelType,
    adjustIncubator, administerDopamine, administerGABA,
    triggerElectrodeStimulation, seedStemCells,
    setActiveTask,
    setLogicGate: (gateType: LogicGateState['gateType']) =>
      setLogicGate(prev => ({ ...prev, gateType, accuracy: 50, epochs: 0 })),
    addLog,
  };
};
