# 🧠 Synaptic Wetware

**A state-of-the-art interactive simulator for Organoid Intelligence (OI) biocomputing — built to be both scientifically rigorous and accessible to anyone.**

> *Grew brain cells on a chip. Taught them to play Pong. Built a dashboard for it.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-00ff7f?style=for-the-badge&logo=vercel)](https://synaptic-wetware.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-ppradyoth%2Fsynaptic--wetware-181717?style=for-the-badge&logo=github)](https://github.com/ppradyoth/synaptic-wetware)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite%20%2B%20React-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev)

---

## What Is This?

Synaptic Wetware is an interactive web dashboard simulating what happens inside a real **organoid intelligence biocomputer lab** — where living human brain cells grown on silicon chips are used as biological processors.

Every number in this simulator is grounded in real neuroscience:
- The voltage traces use real **Hodgkin-Huxley** and **Izhikevich** neuron models
- Burst detection uses the **MaxInterval** algorithm (same as MEA-NAP / meaRtools)
- The Pong training loop replicates the actual **DishBrain Free Energy Principle** feedback
- The ethics panel follows the **Baltimore Declaration on Organoid Intelligence**
- Benchmark figures come from published **Nature** and **Frontiers** papers

> 🆕 **New to this topic?** Read [`EXPLAINER.md`](./EXPLAINER.md) — a plain-English guide from zero to expert, written for fresh grads and curious people.

---

## Features

### 🌱 Stem-Cell Grow Room
- L-system axon branching pathfinding on an HTML5 Canvas
- Nerve Growth Factor (NGF) injection triggers growth surges
- Live metrics: cell count, synaptic density, myelination factor

### ⚡ Electrophysiology MEA (8×8 Grid)
- 64 interactive micro-electrode channels — click to stimulate
- Real-time **burst detection** (MaxInterval): burst frequency, mean IBI, network synchrony
- Rolling oscilloscope trace
- Spike event counter (4-second rolling window)

### 🔬 Dual Neuron Physics Models (toggle in sidebar)

| Model | Equations | Accuracy | Cost |
|---|---|---|---|
| **Izhikevich** | 2 ODEs | Biologically plausible spike shapes | Fast (200 steps/tick) |
| **Hodgkin-Huxley** | 4 ODEs (Na⁺/K⁺/leak channels) | Nobel Prize-level accuracy (1963) | Full (1000 steps/tick) |

Both models run on all 64 electrodes simultaneously using Euler integration inside the simulation loop.

### 🕹️ Cognitive Conditioning (Training Playground)
- **DishBrain Pong** — biological feedback loop replicating the Cortical Labs experiment
- **Logic Gates (AND/OR/XOR)** — wetware logic learning
- Learning efficiency modulated by dopamine, GABA, and synaptic density

### 🧪 Incubator Life-Support
- Temperature, Glucose, O₂, Dopamine, GABA sliders
- Cell death triggered by starvation
- Chemical depletion from cell metabolism
- Seizure detection when network synchrony > 70%

### ⚖️ Ethics Monitor (always-visible sidebar widget)
- **IIT-Φ proxy gauge** — simplified Integrated Information Theory measurement
- **Sentience risk score** (0–100) — calibrated from synchrony × cell count × synaptic density
- **Baltimore Declaration compliance** checklist — 5 items, live-updating
- **Welfare event log** — auto-logs threshold crossings
- Welfare levels: Safe → Monitor → Review Required → Halt Protocol

### 📊 Silicon vs. Biotech Benchmarks
- Power draw comparison (organoid ~10µW vs H100 cluster ~700W)
- Synaptic density (3D biological vs 2D silicon)
- Carbon footprint
- Market projections

### 📖 About / Explainer Tab
- 11-section interactive accordion explaining the science
- Covers: organoids, MEA, DishBrain, AI vs biology, transformers vs neurons, backprop vs Hebbian learning, ethics, and where this is all going
- Written for a 15-year-old with no background

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Styling | Vanilla CSS (glassmorphism, custom animations) |
| Fonts | Google Fonts — Outfit + JetBrains Mono |
| Icons | Lucide React |
| Physics | Custom Hodgkin-Huxley + Izhikevich Euler integration |
| Deploy | Vercel |

No Tailwind. No external charting libraries. All visualisations are raw HTML5 Canvas or CSS.

---

## Run Locally

```bash
git clone https://github.com/ppradyoth/synaptic-wetware.git
cd synaptic-wetware
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
src/
├── hooks/
│   └── useWetwareSim.ts        # Core simulation engine
│                               #   — HH + Izhikevich models
│                               #   — MaxInterval burst detection
│                               #   — Ethics metrics (IIT-Φ proxy)
│                               #   — Raster plot spike events
├── components/
│   ├── GrowRoom.tsx            # Axon branching canvas
│   ├── ElectrophysiologyGrid.tsx  # MEA + oscilloscope + burst metrics
│   ├── TrainingPlayground.tsx  # Pong + logic gates
│   ├── IncubatorControls.tsx   # Life support dashboard
│   ├── Benchmarks.tsx          # Silicon vs wetware comparisons
│   ├── EthicsPanel.tsx         # Baltimore Declaration compliance widget
│   └── About.tsx               # Plain-English explainer accordion
├── App.tsx                     # Lab shell — model toggle, sidebar, routing
├── index.css                   # Bio-cybernetic design system
└── main.tsx
EXPLAINER.md                    # Deep-dive guide for fresh grads
```

---

## Scientific Basis

| Feature | Real-World Reference |
|---|---|
| DishBrain Pong training | Kagan et al., *Nature Electronics* (2022) |
| Baltimore Declaration ethics | Bhanu et al., *Nature* (2024) |
| FinalSpark neuroplatform | finalspark.com, *Frontiers in Neuroscience* (2024) |
| Hodgkin-Huxley model | Hodgkin & Huxley, *Journal of Physiology* (1952) — Nobel Prize 1963 |
| Izhikevich model | Izhikevich, *IEEE Trans Neural Networks* (2003) |
| MaxInterval burst detection | Pasquale et al., *Journal of Neuroscience Methods* (2010) |
| IIT / Φ | Tononi et al., *BMC Neuroscience* (2008) |
| Energy efficiency figures | FinalSpark whitepaper (2024), Cortical Labs CL-1 datasheet |

---

## Credits

**Conceived, researched, and built by [@ppradyoth](https://github.com/ppradyoth)** — with the assistance of Antigravity, an agentic AI coding assistant by the Google DeepMind Advanced Agentic Coding team.


---

## License

MIT — do whatever you want with it. If you publish research using this simulator, a citation would be appreciated.
