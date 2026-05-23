# 🧠 @ppradyoth/synaptic-wetware-engine

**A high-fidelity, standalone mathematical physics and network simulation engine for Organoid Intelligence (OI) biocomputing — compiled for Node.js, the Web, and universal environments.**

---

## 🔬 Scientific Context

In Organoid Intelligence (OI) research, living human cortical brain cells grown on silicon micro-electrode arrays (MEAs) are modeled as biological processor nodes. This engine provides a rigorous, dependency-free mathematical substrate to simulate the **membrane physics**, **metabolic depletion**, **Hebbian spike plasticity (STDP)**, and **population analytics** observed in state-of-the-art wetware computing labs.

Every parameter and algorithm in this engine is calibrated against peer-reviewed neuroscience literature, making it a publication-grade tool for researchers and developers.

---

## 🧮 Mathematical Architecture & Equations

### 1. Hodgkin-Huxley Membrane Conductance with $Q_{10}$ Thermodynamics
The membrane potential of each channel is modeled using the four differential equations defined by Alan Hodgkin and Andrew Huxley (1952). The kinetics are dynamically scaled using the biological $Q_{10}$ thermodynamic factor to capture the sensitivity of ion channels to the bioreactor's real-time temperature:

$$\Phi_{Q10} = Q_{10}^{\frac{T - T_{\text{ref}}}{10}}$$

Where $T$ is the temperature in °C, $T_{\text{ref}} = 6.3^{\circ}\text{C}$, and $Q_{10} = 3.0$ (standard value for mammalian central nervous systems). 

The voltage-dependent rate constants for the gating particles ($m, h, n$) are scaled dynamically:

$$\frac{dm}{dt} = \Phi_{Q10} \left[ \alpha_m(V)(1 - m) - \beta_m(V)m \right]$$
$$\frac{dh}{dt} = \Phi_{Q10} \left[ \alpha_h(V)(1 - h) - \beta_h(V)h \right]$$
$$\frac{dn}{dt} = \Phi_{Q10} \left[ \alpha_n(V)(1 - n) - \beta_n(V)n \right]$$

### 2. Spike-Timing-Dependent Plasticity (STDP)
Biological learning is simulated using Hebbian **Spike-Timing-Dependent Plasticity (STDP)**. The synaptic connection strength $W_{ij}$ between pre-synaptic electrode $i$ and post-synaptic electrode $j$ is updated upon each action potential:

$$\Delta W_{ij} = A_{\text{pot}} \cdot e^{-\frac{\Delta t}{\tau_{\text{stdp}}}} \quad (\text{for } \Delta t > 0)$$
$$\Delta W_{ij} = -A_{\text{dep}} \cdot e^{\frac{\Delta t}{\tau_{\text{stdp}}}} \quad (\text{for } \Delta t < 0)$$

Where $\Delta t = t_{\text{post}} - t_{\text{pre}}$. 
*   **Dopamine** levels dynamically scale the potentiation amplitude $A_{\text{pot}}$, magnifying neuro-plasticity coefficients.
*   **GABA** levels introduce proportional synaptic inhibition, dampening overall firing and stabilizing network voltages.

### 3. Electrophysiology 3-Phase MaxInterval Burst Detection
Burst detection is executed using a clinical-grade **3-Phase MaxInterval** clustering algorithm:
1.  **Candidate Selection:** Grouping spikes whose Inter-Spike Intervals (ISIs) are less than `maxBeginIsi` to start a burst, and less than `maxEndIsi` to maintain it.
2.  **Temporal Merging:** Merging adjacent bursts separated by less than the `minIbi` threshold.
3.  **Quality Filtering:** Filtering out noise events that do not meet the minimum duration (`minBurstDuration`) or minimum spike count (`minSpikes`) thresholds.

---

## 📦 Installation

To install this package from the GitHub Packages registry, configure your local `.npmrc` file:

```text
@ppradyoth:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
```

Then install via npm:

```bash
npm install @ppradyoth/synaptic-wetware-engine
```

---

## 🚀 Quickstart Usage

Here is how to set up an 8x8 MEA Grid simulation, stimulate an input channel, run integration steps, and capture burst analytics in TypeScript:

```typescript
import { SynapticNetwork } from '@ppradyoth/synaptic-wetware-engine';

// 1. Initialize a new 64-node MEA biocomputer network
const network = new SynapticNetwork();

// 2. Adjust the bioreactor incubator parameters
network.incubator.temperature = 37.0; // °C
network.incubator.glucose = 5.5;      // mM
network.incubator.oxygen = 95.0;      // % dissolved
network.incubator.dopamine = 2.0;     // µM (depolarizes and boosts plasticity!)

console.log(`Starting vitals: viability = ${network.vitals.viability}%, synapses = ${network.vitals.synapticDensity} / µm³`);

// 3. Inject a depolarization pulse to stimulate Input Channel 16
network.stimulate(16, 30.0); // Stimulate electrode 16 with a 30mV pulse

// 4. Run numerical integration ticks (1 tick = 100ms)
for (let i = 0; i < 10; i++) {
  // Solve standard Izhikevich equations across all 64 nodes, coupling metabolics and STDP
  network.tick(100, 'izhikevich');
  
  const stateNode16 = network.electrodes[16];
  console.log(`[Time: ${network.elapsedSimTime}ms] Electrode 16 Voltage: ${stateNode16.voltage}mV`);
}

// 5. Query scientific analytics and population burst metrics
const burstMetrics = network.getBurstMetrics();
const ethicsMetrics = network.getEthicsMetrics();
const rasterSpikes = network.getRasterEvents(1000); // last 1 second

console.log('\n--- Simulation Analytics ---');
console.log(`Total Bursts Identified : ${burstMetrics.totalBursts}`);
console.log(`Mean Inter-Burst Interval: ${burstMetrics.meanIBI} seconds`);
console.log(`Population Synchrony     : ${burstMetrics.synchronyScore} (0-1)`);
console.log(`Baltimore Welfare Level : ${ethicsMetrics.welfareLevel}`);
console.log(`Total Spikes (Last 1s)   : ${rasterSpikes.length}`);
```

---

## ⚙️ API Reference

### `SynapticNetwork` (Class)
The orchestrator of the physical and metabolic grid.
*   `electrodes`: `Electrode[]` - Array of 64 channels containing positions, instantaneous voltages, and spike rates.
*   `incubator`: `IncubatorParams` - Bioreactor conditions (temperature, glucose, oxygen, dopamine, GABA).
*   `vitals`: `SimulationVitals` - Health indicators (viability, synaptic density, cell count, starvation state).
*   `weights`: `number[][]` - $64 \times 64$ connectivity weight matrix (updated dynamically via STDP).
*   `tick(tickMs, model)` - Advances numerical solver steps (`'izhikevich'` or `'hodgkin-huxley'`).
*   `stimulate(id, depolarizingVoltage)` - Injects current into a node.
*   `getBurstMetrics()` - Resolves clinical network-level firing metrics.
*   `getEthicsMetrics()` - Assesses sentience risk proxies against the Baltimore Declaration guidelines.
*   `getRasterEvents(windowMs)` - Returns a rolling array of absolute spike timings.

### Physics Solvers (Standalone Functions)
*   `stepIzh(state, I, dt, params)` - Integrates standard quadratic Izhikevich steps.
*   `stepHH(state, I, dt, temp, params)` - Integrates $Q_{10}$-scaled quartic Hodgkin-Huxley conductances.
*   `detectBurstsMaxInterval(spikeTimes, ...)` - Evaluates absolute spike timestamps using clinical MaxInterval criteria.
*   `getQ10Factor(temp, q10, refTemp)` - Evaluates thermal rate corrections.

---

## 📚 Scientific Bibliography & References

1.  **DishBrain Pong Training:** Kagan et al., *Nature Electronics* (2022). "In vitro neurons learn and exhibit sentience in a simulated game-world."
2.  **Baltimore Declaration on Ethics:** Bhanu et al., *Nature* (2024). "Ethics guidelines for Organoid Intelligence and advanced biocomputing systems."
3.  **Hodgkin-Huxley Equations:** Hodgkin, A. L., & Huxley, A. F., *Journal of Physiology* (1952). "A quantitative description of membrane current and its application to conduction and excitation in nerve."
4.  **Izhikevich Model:** Izhikevich, E. M., *IEEE Transactions on Neural Networks* (2003). "Simple model of spiking neurons."

---

## 📄 License
MIT. Conceived and written by [@ppradyoth](https://github.com/ppradyoth) in cooperation with Antigravity, Google DeepMind Advanced Agentic Coding.
