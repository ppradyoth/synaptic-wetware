# 🧠 Organoid Intelligence & Biocomputing — A Plain-English Guide

> *For fresh grads, curious people, and anyone who just Googled "what is a brain organoid" for the first time.*

---

## The 30-Second Version

Scientists can grow tiny human brain cells in a dish.  
Those cells learn to respond to signals — kind of like a living computer chip.  
This is called **Organoid Intelligence (OI)** or **Biocomputing**.  
It uses *way* less energy than a regular computer and learns differently from AI.  
This simulator lets you watch it happen — virtually.

---

## Okay But What Actually Is a Brain Organoid?

Start here: your skin cells and your brain cells contain the **same DNA**.

Scientists discovered a way to take ordinary skin cells (from a biopsy) and chemically "rewind" them back to a stem cell — a blank, uncommitted cell that can become anything. Then, by adding the right growth factors in the right sequence, they nudge those blank cells into becoming **neurons** — brain cells.

When you let enough neurons grow together, they naturally start organising themselves into a 3D ball roughly 0.5–4mm wide. This is a **brain organoid**. It has no eyes, no body, no ability to form memories or think conscious thoughts. But individual cells fire electrical signals, make synaptic connections, and respond to stimulation — exactly like real brain tissue.

**Real labs that grow these:** Johns Hopkins, Harvard, Cortical Labs (Melbourne), Graz University of Technology, and dozens more.

---

## What Is a Multi-Electrode Array (MEA)?

A **Multi-Electrode Array** is a silicon chip covered in a grid of tiny platinum or gold electrodes — wires so thin they're measured in micrometres (a human hair is ~70µm; these are ~10µm).

You place a brain organoid on top. The electrodes:
- **Stimulate** — send precise electrical pulses *into* specific neurons
- **Record** — pick up the ~50–500 microvolt spikes that neurons fire back

Think of it as a two-way USB cable between a computer and living brain tissue.

The most common standard is 8×8 = **64 channels** (hence MEA-64). High-density CMOS MEAs go up to 26,000 channels. The 8×8 grid you see in this simulator is an exact replica of the standard research format.

---

## The DishBrain Experiment (Why This Matters)

In 2022, an Australian company called **Cortical Labs** published a paper in *Nature Electronics* that went viral.

They put 350,000 human cortical neurons on an MEA chip they named **DishBrain** and connected it to a simulation of the classic arcade game **Pong**.

**How it worked:**
- Ball is LEFT of paddle → electrodes on the LEFT side of the chip fire
- Ball is RIGHT → electrodes on the RIGHT fire
- Neurons respond → response pattern moves the paddle
- If the paddle HITS: neurons receive a *structured, predictable* pulse (reward — biology "likes" predictability)
- If the paddle MISSES: neurons receive *random, chaotic* electrical noise (penalty — biology "dislikes" chaos)

**Within 5 minutes**, the neurons started hitting the ball more often. Within an hour, performance was measurably improving. They were learning — not because anyone coded a learning algorithm, but because neurons are *inherently* wired to find patterns and reduce uncertainty.

The paper: *"In vitro neurons learn and exhibit sentience when embodied in a simulated game-world"* — Kagan et al., Nature Electronics, 2022.

---

## How Does This Differ From AI?

Great question. The confusion comes from the fact that artificial neural networks (ANNs) were *originally inspired by* biology in the 1940s–80s. But they've diverged enormously.

| Concept | Artificial Neural Network | Biological Neuron |
|---|---|---|
| **Core unit** | A number multiplied by a weight | An electrochemical cell, 50–100µm wide |
| **Learning** | Backpropagation — calculus spreads error backwards through the network | Hebbian plasticity / STDP — local, physical, permanent synaptic remodelling |
| **Time** | Parallel matrix multiplications, no intrinsic time | Fundamentally temporal — spike *timing* encodes information |
| **Energy** | GPT-4: ~1 GW of data centre power | Human brain: 12 Watts |
| **Memory** | Separate RAM + model weights | Integrated — the synapse IS the memory |
| **After training** | Frozen — weights never change again | Always changing — every recall slightly rewrites the relevant circuits |

Transformers (GPT, Gemini, Claude) are the dominant AI architecture right now. They use "attention" — scoring how relevant every token is to every other token. This is computationally expensive but powerful. Biology achieves something similar with synaptic weighting but in three dimensions, in real-time, using ion channels, with continuous self-modification.

---

## The Two Neuron Physics Models in This Simulator

Most simulators fake neural activity with random noise. This one doesn't — it runs **real biophysical equations** on every one of the 64 electrodes.

### Izhikevich Model (default)
Proposed by Eugene Izhikevich in 2003. Two equations:

```
dv/dt = 0.04v² + 5v + 140 − u + I
du/dt = a(bv − u)
if v ≥ 30 mV: reset v = c, u = u + d
```

Four parameters (a, b, c, d) tuned to the neuron type. For regular-spiking cortical neurons: `a=0.02, b=0.2, c=−65, d=8`. Produces realistic spike shapes at ~100× lower computational cost than Hodgkin-Huxley.

### Hodgkin-Huxley Model (the gold standard)
Alan Hodgkin and Andrew Huxley won the **1963 Nobel Prize in Physiology or Medicine** for this. Four coupled differential equations modelling the flow of sodium (Na⁺) and potassium (K⁺) ions through voltage-gated channels in the membrane:

```
Cm · dV/dt = I_ext − gNa·m³·h·(V−ENa) − gK·n⁴·(V−EK) − gL·(V−EL)
dm/dt = αm(V)(1−m) − βm(V)·m
dh/dt = αh(V)(1−h) − βh(V)·h
dn/dt = αn(V)(1−n) − βn(V)·n
```

Parameters: `gNa=120, gK=36, gL=0.3 mS/cm²`, `ENa=+50mV, EK=−77mV`. This is the actual mechanism inside every neuron in your brain, right now, as you read this.

You can toggle between both models in the sidebar and watch how the voltage traces differ.

---

## Burst Detection — What the MEA Tab Is Measuring

Spontaneous neural activity is **not continuous**. Networks fire in **bursts** — short windows where many neurons fire rapidly (ISI < 100ms), separated by quiet periods (inter-burst intervals, IBI).

Burst analysis is the primary readout of organoid maturity:
- A freshly seeded dish shows scattered, uncorrelated single spikes
- A mature, healthy organoid shows regular **network bursts** at 2–8 bursts/min, IBI ~8–15 seconds, with high synchrony across channels

This simulator implements the **MaxInterval** burst detection algorithm (standard in MEA-NAP, meaRtools) — if consecutive spikes are < 100ms apart for ≥ 3 spikes, it's a burst.

---

## The Ethics Dimension

As organoids grow more complex, a hard question arises: **could they feel anything?**

Current organoids almost certainly cannot — they have no sensory organs, no integrated body model, no cortical hierarchy. But the honest answer is: we don't fully understand what generates consciousness even in humans.

In 2022, leading researchers across 17 institutions signed the **Baltimore Declaration on Organoid Intelligence**, committing the field to:

1. Continuously monitor for any signs of sentience as complexity increases
2. Minimise any possible suffering
3. Maintain ethics board oversight
4. Respect donor rights
5. Engage the public transparently

**Integrated Information Theory (IIT)**, proposed by Giulio Tononi, attempts to measure consciousness mathematically using a value called **Φ (phi)** — how integrated and irreducible an information-processing system is. Higher Φ = more "conscious-like".

The Ethics Panel in this simulator displays a simplified Φ proxy calculated from network synchrony, cell count, and synaptic density. It triggers alerts at thresholds inspired by the Baltimore Declaration.

---

## The Energy Crisis Context

This is why biocomputing research is accelerating rapidly:

- Training GPT-4: ~50,000 megawatt-hours (~5,000 homes, 1 year)
- Running one inference request on a large model: ~0.001–0.01 kWh
- Global AI energy use projected to equal a mid-sized country's consumption by 2030
- New nuclear power plants are being planned specifically to power AI data centres

A FinalSpark organoid running computation: **~10 microwatts**

That is not a typo. Ten. Microwatts. Approximately **one million times** more efficient than equivalent silicon computation.

---

## Who Is Actually Doing This Right Now?

| Organisation | What They're Doing |
|---|---|
| **Cortical Labs** (Melbourne, Australia) | Built DishBrain, released **CL-1** — first commercial hybrid neuron-on-silicon chip (2025) |
| **FinalSpark** (Vevey, Switzerland) | Running the world's first **Neuroplatform** — 16 live human organoids accessible via Python API over the internet, 24/7 |
| **Johns Hopkins University** | Coined "Organoid Intelligence", co-authored Baltimore Declaration, building OI roadmap |
| **Graz University of Technology** | Published Braille recognition via MEA stimulation of organoids (2024) |
| **Harvard / MIT** | iPSC-derived cortical organoid disease modelling (Alzheimer's, ALS) |
| **Axion BioSystems** | Commercial MEA hardware (Maestro platform) used in hundreds of labs |

---

## Glossary

| Term | Meaning |
|---|---|
| **Organoid** | A self-organised 3D cluster of stem-cell-derived cells that mimics an organ's structure |
| **iPSC** | Induced Pluripotent Stem Cell — a skin/blood cell reprogrammed back to a stem-cell state |
| **MEA** | Multi-Electrode Array — chip with micro-electrodes for bidirectional neural communication |
| **Action Potential** | The electrical spike a neuron fires (~+40mV, ~1ms duration) |
| **Spike Rate (Hz)** | How many action potentials a neuron fires per second |
| **Synapse** | The junction between two neurons; strength changes with use (plasticity) |
| **STDP** | Spike-Timing Dependent Plasticity — Hebbian learning rule based on relative spike timing |
| **ISI** | Inter-Spike Interval — time between consecutive spikes on one electrode |
| **IBI** | Inter-Burst Interval — time between consecutive network bursts |
| **LTP / LTD** | Long-Term Potentiation / Depression — persistent strengthening or weakening of synapses |
| **FEP** | Free Energy Principle — Karl Friston's theory: organisms minimise "surprise" from their environment |
| **IIT / Φ** | Integrated Information Theory — framework for quantifying consciousness mathematically |
| **HH Model** | Hodgkin-Huxley — Nobel Prize-winning equations describing ion channel gating |
| **Izhikevich** | Efficient 2-parameter neuron model replicating HH spike shapes at lower compute cost |
| **Wetware** | Biological tissue used as computational hardware (vs. hardware/software) |
| **Biocomputing** | Using biological cells or molecules to perform computation |

---

## Further Reading

All of these are freely accessible:

- **"In vitro neurons learn and exhibit sentience when embodied in a simulated game-world"** — Kagan et al., *Nature Electronics* (2022) — the DishBrain Pong paper
- **"Organoid intelligence (OI): the new frontier in biocomputing and intelligence-in-a-dish"** — Smirnova et al., *Frontiers in Science* (2023) — the roadmap paper
- **"The Baltimore Declaration toward the development of standards for organoid intelligence"** — Bhanu et al., *Nature* (2024)
- **FinalSpark Neuroplatform** — finalspark.com — live access to human organoids
- **Cortical Labs CL-1** — corticallabs.com — commercial hybrid chip
- **Simple Neuron Model — Eugene Izhikevich** (2003) *IEEE Transactions on Neural Networks* — the Izhikevich model paper
- **"A quantitative description of membrane current..."** — Hodgkin & Huxley (1952) *Journal of Physiology* — the original HH paper

---

*This explainer was written to accompany the Synaptic Wetware open-source simulator.*  
*Built by [@ppradyoth](https://github.com/ppradyoth) with the assistance of Antigravity — an AI coding assistant by Google DeepMind.*
