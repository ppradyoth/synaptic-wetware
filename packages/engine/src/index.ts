/**
 * @ppradyoth/synaptic-wetware-engine
 * 
 * A high-fidelity, peer-reviewed-grade mathematical physics and network simulation engine
 * for Organoid Intelligence (OI) biocomputing.
 * 
 * Provides:
 * 1. Hodgkin-Huxley ionic conductance models with thermodynamic temperature (Q10) scaling.
 * 2. Complete cortical-type Izhikevich model parameter sets and solvers.
 * 3. Electro-physiology standard 3-Phase MaxInterval burst detection.
 * 4. A SynapticNetwork simulator class featuring Spike-Timing-Dependent Plasticity (STDP),
 *    dopaminergic/GABAergic chemical modulation, and metabolically coupled resource depletion.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

/** Supported physiological neuron models */
export type NeuronModel = 'izhikevich' | 'hodgkin-huxley';

/** Firing types for cortical and subcortical neurons */
export type CorticalPreset = 'RS' | 'IB' | 'CH' | 'FS' | 'LTS';

/** Represents a single micro-electrode channel on an 8x8 MEA Grid */
export interface Electrode {
  id: number;
  x: number;
  y: number;
  voltage: number;      // Membrane voltage in mV
  spikeRate: number;    // Spike frequency in Hz
  role: 'input-a' | 'input-b' | 'motor-up' | 'motor-down' | 'interneuron';
  lastSpikeTime: number;
}

/** Bioreactor incubator environment parameters */
export interface IncubatorParams {
  temperature: number; // in °C (ideal is 37.0)
  glucose: number;     // in mM (metabolized by cellular activity)
  oxygen: number;      // in % dissolved oxygen
  dopamine: number;    // in µM (modulates synaptic plasticity)
  gaba: number;        // in µM (modulates synaptic inhibition and stabilizes voltages)
}

/** Biological health vitals of the organoid neural population */
export interface SimulationVitals {
  cellCount: number;
  synapticDensity: number; // synapses / µm³
  viability: number;       // % alive cells
  myelination: number;     // % axon coverage
  learningProgress: number;// cognitive benchmark metric
  seizureActivity: boolean;// network hyper-synchrony flag
  isStarving: boolean;     // metabolic failure flag
}

/** Electro-physiological population metrics */
export interface BurstMetrics {
  burstFrequency: number;   // bursts / minute
  meanIBI: number;          // mean inter-burst interval (seconds)
  synchronyScore: number;   // network synchrony coefficient (0 to 1)
  networkBursting: boolean; // active population bursting flag
  totalBursts: number;      // aggregate burst count
}

/** Ethics & Welfare assessment metrics in line with the Baltimore Declaration */
export interface EthicsMetrics {
  phiProxy: number;         // simplified Integrated Information Theory (IIT) Φ value (0–10)
  sentienceRisk: number;    // composite risk index (0–100)
  welfareLevel: 'Safe' | 'Monitor' | 'Review Required' | 'Halt Protocol';
  welfareLog: string[];
}

/** Recording element for raster spike train representation */
export interface SpikeEvent {
  electrodeId: number;
  t: number;                // timestamp relative to raster window start (ms)
}

/** Internal numerical integration state for Hodgkin-Huxley gating variables */
export interface HHState {
  V: number;  // Membrane potential (mV)
  m: number;  // Sodium activation gate (0 to 1)
  h: number;  // Sodium inactivation gate (0 to 1)
  n: number;  // Potassium activation gate (0 to 1)
}

/** Constants representing the membrane electrochemistry of the Hodgkin-Huxley model */
export interface HHParams {
  C_m: number;   // Membrane capacitance (default: 1.0 µF/cm²)
  g_Na: number;  // Max sodium conductance (default: 120.0 mS/cm²)
  g_K: number;   // Max potassium conductance (default: 36.0 mS/cm²)
  g_L: number;   // Leak conductance (default: 0.3 mS/cm²)
  E_Na: number;  // Sodium reversal potential (default: 50.0 mV)
  E_K: number;   // Potassium reversal potential (default: -77.0 mV)
  E_L: number;   // Leak reversal potential (default: -54.4 mV)
}

/** Internal numerical integration state for Izhikevich model */
export interface IzhState {
  v: number;  // Membrane potential (mV)
  u: number;  // Membrane recovery variable
}

/** Dimensional parameters for custom Izhikevich firing types */
export interface IzhParams {
  a: number;  // Time scale of recovery variable u
  b: number;  // Sensitivity of u to subthreshold fluctuations of v
  c: number;  // After-spike reset potential of v (mV)
  d: number;  // After-spike reset of u
}

/** Detailed record of a single identified physiological burst */
export interface IdentifiedBurst {
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  duration: number; // in ms
  spikeCount: number;
  meanHz: number;
}

// ─── HODGKIN-HUXLEY MODEL WITH Q10 SCALING ─────────────────────────────────────

// The standard rate constant equations derived by Alan Hodgkin and Andrew Huxley (1952)
// scaled by the thermodynamic Q10 coefficient representing biological temperature sensitivity.

export const DEFAULT_HH_PARAMS: HHParams = {
  C_m: 1.0,
  g_Na: 120.0,
  g_K: 36.0,
  g_L: 0.3,
  E_Na: 50.0,
  E_K: -77.0,
  E_L: -54.4,
};

// Rate constants for sodium activation (m)
export function hhAlphaM(V: number): number {
  const dv = V + 40;
  if (Math.abs(dv) < 1e-6) return 1.0;
  return 0.1 * dv / (1 - Math.exp(-dv / 10));
}
export function hhBetaM(V: number): number {
  return 4.0 * Math.exp(-(V + 65.0) / 18.0);
}

// Rate constants for sodium inactivation (h)
export function hhAlphaH(V: number): number {
  return 0.07 * Math.exp(-(V + 65.0) / 20.0);
}
export function hhBetaH(V: number): number {
  return 1.0 / (1.0 + Math.exp(-(V + 35.0) / 10.0));
}

// Rate constants for potassium activation (n)
export function hhAlphaN(V: number): number {
  const dv = V + 55;
  if (Math.abs(dv) < 1e-6) return 0.1;
  return 0.01 * dv / (1 - Math.exp(-dv / 10));
}
export function hhBetaN(V: number): number {
  return 0.125 * Math.exp(-(V + 65.0) / 80.0);
}

/**
 * Calculates the thermodynamic Q10 scaling factor to adjust kinetics based on temperature.
 * The standard Q10 factor for nerve tissue is typically 3.0, with reference temp 6.3°C.
 * 
 * @param temp Biological temperature in °C
 * @param q10 Base scaling factor (default: 3.0)
 * @param refTemp Reference calibration temperature (default: 6.3°C)
 */
export function getQ10Factor(temp: number, q10 = 3.0, refTemp = 6.3): number {
  return q10 ** ((temp - refTemp) / 10.0);
}

/**
 * Performs a single forward Euler integration step for the Hodgkin-Huxley model,
 * scaling ionic gate dynamics in response to biological temperature.
 * 
 * @param state Current gating state and voltage
 * @param I External injected current (µA/cm²)
 * @param dt Time step delta (ms)
 * @param temp Temperature in °C (modulates gating variable speeds)
 * @param params Biophysical membrane parameter overrides
 */
export function stepHH(
  state: HHState,
  I: number,
  dt: number,
  temp = 37.0,
  params: HHParams = DEFAULT_HH_PARAMS
): [HHState, boolean] {
  const { V, m, h, n } = state;
  const { C_m, g_Na, g_K, g_L, E_Na, E_K, E_L } = params;

  // Temperature gating scaling (rate constants scale exponentially with temperature)
  const phi = getQ10Factor(temp);

  // Ionic current equations
  const I_Na = g_Na * (m ** 3) * h * (V - E_Na);
  const I_K  = g_K  * (n ** 4) * (V - E_K);
  const I_L  = g_L  * (V - E_L);

  // Membrane potential derivative
  const dV = (I - I_Na - I_K - I_L) / C_m;

  // Gating variable derivatives (temperature-corrected via phi)
  const dm = phi * (hhAlphaM(V) * (1.0 - m) - hhBetaM(V) * m);
  const dh = phi * (hhAlphaH(V) * (1.0 - h) - hhBetaH(V) * h);
  const dn = phi * (hhAlphaN(V) * (1.0 - n) - hhBetaN(V) * n);

  const newV = V + dV * dt;
  
  // Spikes detected via a zero-crossing indicator during numerical solving
  const spiked = V < 0.0 && newV >= 0.0;

  return [{
    V: Math.max(-90, Math.min(60, newV)),
    m: Math.max(0, Math.min(1, m + dm * dt)),
    h: Math.max(0, Math.min(1, h + dh * dt)),
    n: Math.max(0, Math.min(1, n + dn * dt)),
  }, spiked];
}

// ─── IZHIKEVICH MODEL & PRESETS ───────────────────────────────────────────────

export const IZHI_PRESETS: Record<CorticalPreset, IzhParams> = {
  RS:  { a: 0.02, b: 0.20, c: -65.0, d: 8.0 }, // Regular Spiking (excitatory)
  IB:  { a: 0.02, b: 0.20, c: -55.0, d: 4.0 }, // Intrinsically Bursting
  CH:  { a: 0.02, b: 0.20, c: -50.0, d: 2.0 }, // Chattering (high frequency bursts)
  FS:  { a: 0.10, b: 0.20, c: -65.0, d: 2.0 }, // Fast Spiking (inhibitory interneurons)
  LTS: { a: 0.02, b: 0.25, c: -65.0, d: 2.0 }, // Low-Threshold Spiking
};

/**
 * Performs a single forward Euler integration step for the Izhikevich model,
 * representing biological firing types with low computational cost.
 * 
 * @param state Current model variables [v, u]
 * @param I External stimulation current
 * @param dt Time step delta (ms)
 * @param params Reset and time scale configuration parameters
 */
export function stepIzh(
  state: IzhState,
  I: number,
  dt: number,
  params: IzhParams = IZHI_PRESETS.RS
): [IzhState, boolean] {
  const { v, u } = state;
  const { a, b, c, d } = params;

  // Numerical solvers typically run a sub-stepped or fine integration 
  // to avoid numerical stability divergence of quadratic voltage equations.
  const dv = (0.04 * v * v + 5.0 * v + 140.0 - u + I) * dt;
  const du = (a * (b * v - u)) * dt;

  const newV = v + dv;

  // Peak action potential voltage threshold is 30 mV
  if (newV >= 30.0) {
    return [{ v: c, u: u + du + d }, true];
  }

  return [{ v: Math.max(-90.0, newV), u: u + du }, false];
}

// ─── 3-PHASE MAXINTERVAL BURST DETECTION ───────────────────────────────────────

/**
 * Implementation of the standard 3-Phase MaxInterval burst detection algorithm.
 * Extracted and generalized from professional multi-electrode array (MEA) analysis packages.
 * 
 * @param spikeTimes Chronological absolute spike timestamps in milliseconds
 * @param maxBeginIsi Maximum interval between consecutive spikes to start a burst (ms)
 * @param maxEndIsi Maximum interval between consecutive spikes to maintain a burst (ms)
 * @param minIbi Minimum interval between two separate bursts. Bursts closer than this are merged (ms)
 * @param minBurstDuration Minimum duration for a burst to be considered valid (ms)
 * @param minSpikes Minimum spike count inside a burst to filter out noise
 */
export function detectBurstsMaxInterval(
  spikeTimes: number[],
  maxBeginIsi = 100,
  maxEndIsi = 200,
  minIbi = 200,
  minBurstDuration = 10,
  minSpikes = 3
): IdentifiedBurst[] {
  if (spikeTimes.length < minSpikes) return [];

  // Phase 1: Candidate Burst Detection
  const candidates: IdentifiedBurst[] = [];
  let inBurst = false;
  let burstStartIndex = 0;

  for (let i = 1; i < spikeTimes.length; i++) {
    const isi = spikeTimes[i] - spikeTimes[i - 1];

    if (!inBurst) {
      if (isi <= maxBeginIsi) {
        // Potential burst starting
        inBurst = true;
        burstStartIndex = i - 1;
      }
    } else {
      if (isi > maxEndIsi) {
        // Burst has ended at index i - 1
        const spikeCount = i - burstStartIndex;
        if (spikeCount >= minSpikes) {
          const duration = spikeTimes[i - 1] - spikeTimes[burstStartIndex];
          candidates.push({
            startIndex: burstStartIndex,
            endIndex: i - 1,
            startTime: spikeTimes[burstStartIndex],
            endTime: spikeTimes[i - 1],
            duration,
            spikeCount,
            meanHz: (spikeCount / Math.max(1, duration)) * 1000,
          });
        }
        inBurst = false;
      }
    }
  }

  // Capture trailing burst
  if (inBurst) {
    const lastIdx = spikeTimes.length - 1;
    const spikeCount = lastIdx - burstStartIndex + 1;
    if (spikeCount >= minSpikes) {
      const duration = spikeTimes[lastIdx] - spikeTimes[burstStartIndex];
      candidates.push({
        startIndex: burstStartIndex,
        endIndex: lastIdx,
        startTime: spikeTimes[burstStartIndex],
        endTime: spikeTimes[lastIdx],
        duration,
        spikeCount,
        meanHz: (spikeCount / Math.max(1, duration)) * 1000,
      });
    }
  }

  if (candidates.length === 0) return [];

  // Phase 2: Merge Bursts separated by less than minIbi
  const merged: IdentifiedBurst[] = [];
  let current = candidates[0];

  for (let i = 1; i < candidates.length; i++) {
    const next = candidates[i];
    const ibi = next.startTime - current.endTime;

    if (ibi < minIbi) {
      // Merge next into current
      const duration = next.endTime - current.startTime;
      const spikeCount = next.endIndex - current.startIndex + 1;
      current = {
        startIndex: current.startIndex,
        endIndex: next.endIndex,
        startTime: current.startTime,
        endTime: next.endTime,
        duration,
        spikeCount,
        meanHz: (spikeCount / Math.max(1, duration)) * 1000,
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  // Phase 3: Final Quality Control Filtering
  return merged.filter(
    (b) => b.duration >= minBurstDuration && b.spikeCount >= minSpikes
  );
}

// ─── SYNAPTIC NETWORK SIMULATOR CLASS ──────────────────────────────────────────

/**
 * An object-oriented biocomputing simulator representing an 8x8 MEA Grid (64 nodes).
 * Simulates cellular physics, metabolics, Spike-Timing-Dependent Plasticity (STDP),
 * and neurotransmitter chemical kinetics inside a sealed incubator bioreactor.
 */
export class SynapticNetwork {
  public electrodes: Electrode[] = [];
  public incubator: IncubatorParams;
  public vitals: SimulationVitals;
  
  // Numerical integrator states (length 64)
  private izhStates: IzhState[] = [];
  private hhStates: HHState[] = [];
  private spikeHistory: number[][] = []; // absolute ms timestamps per node
  
  // 64x64 Synaptic Weight Matrix representing biological connectivity
  // W[i][j] is the weight of the connection from electrode i to electrode j.
  public weights: number[][] = [];

  // Chronological history of spike timings for STDP calculations (ms)
  private lastSpikeTimings: number[] = [];

  // Elapsed simulation time (ms)
  public elapsedSimTime = 0;

  // Ethics variables
  private welfareLog: string[] = [];

  /**
   * Initializes a new 64-node network on a bio-cybernetic grid.
   */
  constructor() {
    this.incubator = {
      temperature: 37.0,
      glucose: 5.5,
      oxygen: 95.0,
      dopamine: 0.1,
      gaba: 0.1,
    };

    this.vitals = {
      cellCount: 250000,
      synapticDensity: 80,
      viability: 98,
      myelination: 12,
      learningProgress: 0,
      seizureActivity: false,
      isStarving: false,
    };

    this.reset();
  }

  /**
   * Resets biological, chemical, and physical states. Seeds fresh stem cells.
   */
  public reset(): void {
    this.electrodes = [];
    this.izhStates = [];
    this.hhStates = [];
    this.spikeHistory = [];
    this.weights = [];
    this.lastSpikeTimings = new Array(64).fill(-Infinity);
    this.elapsedSimTime = 0;
    this.welfareLog = [];

    // Initialize 8x8 Grid
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const id = y * 8 + x;
        let role: Electrode['role'] = 'interneuron';
        if (x === 0 && y === 2) role = 'input-a';
        else if (x === 0 && y === 5) role = 'input-b';
        else if (x === 7 && y === 1) role = 'motor-up';
        else if (x === 7 && y === 6) role = 'motor-down';

        this.electrodes.push({
          id,
          x,
          y,
          voltage: -65.0 + Math.random() * 3,
          spikeRate: 1.0 + Math.random() * 2,
          role,
          lastSpikeTime: 0,
        });

        this.izhStates.push({
          v: -65.0 + Math.random() * 2.0,
          u: -14.0 + Math.random(),
        });

        this.hhStates.push({
          V: -65.0 + Math.random() * 2.0,
          m: 0.053,
          h: 0.596,
          n: 0.318,
        });

        this.spikeHistory.push([]);
      }
    }

    // Initialize Weight Matrix with random weak connections (nearest-neighbor biased)
    for (let i = 0; i < 64; i++) {
      this.weights[i] = [];
      const nodeA = this.electrodes[i];
      for (let j = 0; j < 64; j++) {
        if (i === j) {
          this.weights[i][j] = 0;
          continue;
        }
        const nodeB = this.electrodes[j];
        const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
        // Connect nearby nodes, with a baseline weight
        if (dist <= 3.0) {
          this.weights[i][j] = Math.random() * 0.15;
        } else {
          this.weights[i][j] = Math.random() * 0.02;
        }
      }
    }

    this.vitals = {
      cellCount: 250000,
      synapticDensity: 80,
      viability: 98,
      myelination: 12,
      learningProgress: 0,
      seizureActivity: false,
      isStarving: false,
    };
  }

  /**
   * Pulses a specific electrode channel, depolarizing the internal neuron models.
   * 
   * @param id Electrode ID (0 to 63)
   * @param depolarizingVoltage Pulse peak voltage in mV (default: 30mV)
   */
  public stimulate(id: number, depolarizingVoltage = 30.0): void {
    if (id < 0 || id >= 64) return;
    this.izhStates[id].v = depolarizingVoltage;
    this.hhStates[id].V  = depolarizingVoltage;
    this.electrodes[id].voltage = depolarizingVoltage;
    this.electrodes[id].lastSpikeTime = this.elapsedSimTime;
  }

  /**
   * Run a simulation step (tick) for the biocomputer network.
   * Couples physical integration steps with metabolic resources and STDP updates.
   * 
   * @param tickMs Elapsed clock time in milliseconds
   * @param model Core simulation model to use
   */
  public tick(tickMs = 100, model: NeuronModel = 'izhikevich'): void {
    this.elapsedSimTime += tickMs;
    const now = this.elapsedSimTime;

    // ── 1. METABOLIC / BIOCHEMICAL KINETICS ──────────────────────
    const tempDev = Math.abs(this.incubator.temperature - 37.0);
    const glucDev = this.incubator.glucose < 2.0 ? (2.0 - this.incubator.glucose) : 0;
    const oxyDev  = this.incubator.oxygen  < 80  ? (80  - this.incubator.oxygen)  : 0;

    // Composite metabolic health score
    const healthScore = Math.max(0, 100 - tempDev * 15.0 - glucDev * 20.0 - oxyDev * 1.5);
    const starving = this.incubator.glucose < 3.0 || this.incubator.oxygen < 85.0;

    this.vitals.viability = Math.max(0, Math.min(100, Math.round(healthScore)));
    this.vitals.isStarving = starving;

    // Cell population growth / decay
    if (this.vitals.viability < 60) {
      this.vitals.cellCount = Math.max(2000, Math.round(this.vitals.cellCount - (60 - this.vitals.viability) * 50));
    } else if (this.vitals.viability > 90 && this.vitals.cellCount < 800000 && Math.random() > 0.8) {
      this.vitals.cellCount = Math.min(800000, this.vitals.cellCount + 100);
    }

    // Plasticity density updates
    if (this.vitals.viability > 85) {
      this.vitals.synapticDensity = Math.min(4500, this.vitals.synapticDensity + (Math.random() > 0.5 ? 2 : 0));
    } else if (this.vitals.viability < 70) {
      this.vitals.synapticDensity = Math.max(10, this.vitals.synapticDensity - 4);
    }

    // Axonal myelination updates
    if (this.vitals.viability > 90 && this.vitals.synapticDensity > 500 && Math.random() > 0.9) {
      this.vitals.myelination = Math.min(100, this.vitals.myelination + 1);
    } else if (this.vitals.viability < 65) {
      this.vitals.myelination = Math.max(0, this.vitals.myelination - 2);
    }

    // Metabolite resource depletion based on cellular activity
    const metabolicActivity = (this.vitals.cellCount / 500000.0) * 0.015;
    this.incubator.glucose = Math.max(0.0, Math.round((this.incubator.glucose - metabolicActivity) * 100) / 100);
    this.incubator.oxygen  = Math.max(0.0, Math.round((this.incubator.oxygen  - metabolicActivity * 2.0) * 10) / 10);

    // Neurotransmitter wash decay
    this.incubator.dopamine = Math.max(0.1, Math.round((this.incubator.dopamine - 0.08) * 100) / 100);
    this.incubator.gaba     = Math.max(0.1, Math.round((this.incubator.gaba     - 0.08) * 100) / 100);

    // ── 2. PHYSICS RESOLUTION & INTEGRATION ──────────────────────
    const baseI    = (this.vitals.viability / 100.0) * 6.0;
    const dopBoost = this.incubator.dopamine * 1.5;
    const gabaInh  = this.incubator.gaba * 1.2;
    const globalExcitatoryDrive = Math.max(0, baseI + dopBoost - gabaInh);

    const dt = model === 'hodgkin-huxley' ? 0.1 : 0.5; // Integration step
    const steps = Math.round(tickMs / dt);

    const activeSpikes: boolean[] = new Array(64).fill(false);

    // Solve for each node
    for (let i = 0; i < 64; i++) {
      const noise = (Math.random() - 0.5) * 2.0;

      // Integrate synaptic currents from upstream spiked connections
      let synapticI = 0.0;
      for (let j = 0; j < 64; j++) {
        if (i !== j && this.weights[j][i] > 0) {
          // If node j spiked recently, it injects current proportional to synaptic weight
          const timeSinceUpstreamSpike = now - this.lastSpikeTimings[j];
          if (timeSinceUpstreamSpike < 10.0) {
            synapticI += this.weights[j][i] * 12.0 * Math.exp(-timeSinceUpstreamSpike / 3.0);
          }
        }
      }

      const totalStimulus = globalExcitatoryDrive + synapticI + noise;
      let didSpike = false;
      let finalV = -65.0;

      if (model === 'hodgkin-huxley') {
        let s = this.hhStates[i];
        for (let step = 0; step < steps; step++) {
          const [ns, spike] = stepHH(s, totalStimulus, dt, this.incubator.temperature);
          s = ns;
          if (spike) didSpike = true;
        }
        this.hhStates[i] = s;
        finalV = s.V;
      } else {
        let s = this.izhStates[i];
        for (let step = 0; step < steps; step++) {
          const [ns, spike] = stepIzh(s, totalStimulus, dt, IZHI_PRESETS.RS);
          s = ns;
          if (spike) didSpike = true;
        }
        this.izhStates[i] = s;
        finalV = s.v;
      }

      activeSpikes[i] = didSpike;
      this.electrodes[i].voltage = Math.round(finalV * 10) / 10;
      
      const newRate = didSpike
        ? (this.electrodes[i].spikeRate * 0.8 + 20.0 * 0.2)
        : (this.electrodes[i].spikeRate * 0.95);
      this.electrodes[i].spikeRate = Math.max(0.1, Math.round(newRate * 10) / 10);

      if (didSpike) {
        this.spikeHistory[i].push(now);
        this.electrodes[i].lastSpikeTime = now;
        
        // ── 3. SPIKE-TIMING-DEPENDENT PLASTICITY (STDP) ───────────
        // Modulated heavily by Dopamine levels (plasticity factor)
        const A_pot = 0.015 * (1.0 + this.incubator.dopamine * 0.5); // Potentiation scale
        const A_dep = 0.018 / (1.0 + this.incubator.dopamine * 0.2); // Depression scale
        const tau_stdp = 20.0; // STDP window (ms)

        const t_pre = this.lastSpikeTimings[i]; // pre-synaptic time
        this.lastSpikeTimings[i] = now;

        for (let j = 0; j < 64; j++) {
          if (i === j) continue;

          // If pre-synaptic i fired, check when post-synaptic j fired:
          const t_post = this.lastSpikeTimings[j];
          if (t_post > -Infinity) {
            const timeDiff = t_post - now; // Negative if pre-fired before post
            if (timeDiff < 0 && timeDiff > -50.0) {
              // Potentiation: pre-synaptic i fired before post-synaptic j (causality)
              this.weights[i][j] = Math.min(1.5, this.weights[i][j] + A_pot * Math.exp(timeDiff / tau_stdp));
            } else if (timeDiff > 0 && timeDiff < 50.0) {
              // Depression: pre-synaptic i fired after post-synaptic j (anti-causality)
              this.weights[i][j] = Math.max(0.001, this.weights[i][j] - A_dep * Math.exp(-timeDiff / tau_stdp));
            }
          }
        }
      }
    }

    // Trim historical logs to prevent memory overflow
    const trimCutoff = now - 60000;
    for (let i = 0; i < 64; i++) {
      const hist = this.spikeHistory[i];
      const trimIdx = hist.findIndex((t) => t >= trimCutoff);
      if (trimIdx > 0) this.spikeHistory[i] = hist.slice(trimIdx);
      else if (trimIdx === -1) this.spikeHistory[i] = [];
    }
  }

  /**
   * Retrieves full analytical firing statistics for the network.
   */
  public getBurstMetrics(): BurstMetrics {
    // Phase 1: Aggregate population spikes
    const burstStats = this.spikeHistory.map((hist) =>
      detectBurstsMaxInterval(hist)
    );
    const totalBursts = burstStats.reduce((a, b) => a + b.length, 0);

    const validIBIs: number[] = [];
    burstStats.forEach((burstList) => {
      for (let i = 1; i < burstList.length; i++) {
        validIBIs.push((burstList[i].startTime - burstList[i - 1].endTime) / 1000.0);
      }
    });

    const meanIBI = validIBIs.length > 0 ? validIBIs.reduce((a, b) => a + b, 0) / validIBIs.length : 0;

    // Network Synchrony: standard deviation coefficient of firing rates
    const rates = this.electrodes.map((e) => e.spikeRate);
    const avg = rates.reduce((a, b) => a + b, 0) / 64;
    const variance = rates.reduce((a, b) => a + (b - avg) ** 2, 0) / 64;
    const synchrony = Math.min(1.0, Math.max(0.0, variance / (avg * avg + 1.0)));

    const networkBursting = synchrony > 0.45;
    this.vitals.seizureActivity = synchrony > 0.70;

    return {
      burstFrequency: Math.round((totalBursts / Math.max(1, this.elapsedSimTime / 60000)) * 10) / 10,
      meanIBI: Math.round(meanIBI * 100) / 100,
      synchronyScore: Math.round(synchrony * 100) / 100,
      networkBursting,
      totalBursts,
    };
  }

  /**
   * Evaluates bio-ethics parameters relative to cognitive complexity.
   */
  public getEthicsMetrics(): EthicsMetrics {
    const burst = this.getBurstMetrics();
    const phi = Math.round(
      burst.synchronyScore *
      Math.log(1.0 + this.vitals.cellCount / 10000.0) *
      (this.vitals.synapticDensity / 500.0) * 10.0
    ) / 10.0;

    const risk = Math.min(100, Math.round(phi * 15.0));
    const level = calcEthicsLevel(risk);

    if (level === 'Review Required' && this.welfareLog.every(l => !l.includes('Review'))) {
      this.welfareLog.push(`[Time: ${this.elapsedSimTime}ms] Complexity crossed Review threshold (Φ = ${phi}).`);
    }
    if (level === 'Halt Protocol' && this.welfareLog.every(l => !l.includes('Halt'))) {
      this.welfareLog.push(`[Time: ${this.elapsedSimTime}ms] CRITICAL HALT: Sentience risk boundary exceeded.`);
    }

    return {
      phiProxy: phi,
      sentienceRisk: risk,
      welfareLevel: level,
      welfareLog: [...this.welfareLog],
    };
  }

  /**
   * Generates a snapshot of spike timings within a specified backward-looking raster window.
   * 
   * @param windowMs Backwards interval to capture (default: 4000ms)
   */
  public getRasterEvents(windowMs = 4000): SpikeEvent[] {
    const cutoff = this.elapsedSimTime - windowMs;
    const events: SpikeEvent[] = [];

    for (let i = 0; i < 64; i++) {
      for (const t of this.spikeHistory[i]) {
        if (t >= cutoff) {
          events.push({ electrodeId: i, t: t - cutoff });
        }
      }
    }
    return events;
  }
}

/**
 * Maps a composite sentience risk score to a biological welfare action level
 * in accordance with the Baltimore Declaration on Organoid Intelligence.
 * 
 * @param risk Sentience risk index from 0 to 100
 */
export function calcEthicsLevel(risk: number): EthicsMetrics['welfareLevel'] {
  if (risk < 20.0) return 'Safe';
  if (risk < 45.0) return 'Monitor';
  if (risk < 70.0) return 'Review Required';
  return 'Halt Protocol';
}

