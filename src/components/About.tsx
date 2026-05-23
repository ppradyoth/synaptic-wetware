import React, { useState } from 'react';
import {
  Brain,
  Zap,
  FlaskConical,
  Cpu,
  HeartPulse,
  Gamepad2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Leaf,
  Microscope,
  Network,
  GitBranch,
  Sigma,
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const concepts = [
  {
    icon: Brain,
    color: 'var(--accent-green)',
    glow: 'var(--accent-green-glow)',
    title: 'What even IS an "organoid"?',
    emoji: '🧠',
    short: 'A tiny, pea-sized brain grown in a lab dish — from your own skin cells.',
    long: `Imagine scientists take a small sample of your skin. They use special chemicals to "rewind" those skin cells back to a blank slate — kind of like undoing 15 years of decisions in one step. Then they nudge those blank cells to become brain cells — neurons — and let them grow together.

After a few weeks, those neurons clump into a tiny 3D ball barely the size of a lentil. This ball is called a **brain organoid**. It's not a full brain — it has no eyes, no ears, no ability to think thoughts or feel feelings — but the individual cells behave exactly like real brain cells do. They talk to each other using tiny electrical sparks called **action potentials**.

Scientists at places like Johns Hopkins and Harvard grow thousands of these organoids every year to study how diseases like Alzheimer's start, or to test new drugs without using animals.`,
  },
  {
    icon: Zap,
    color: 'var(--accent-cyan)',
    glow: 'var(--accent-cyan-glow)',
    title: 'What is a Multi-Electrode Array (MEA)?',
    emoji: '⚡',
    short: 'A tiny electric keyboard that lets scientists "talk" to neurons — and listen back.',
    long: `Picture a silicon chip about the size of your thumbnail. Instead of transistors, it's covered in a grid of 64 ultra-thin platinum wires, each just 10 micrometers wide — thinner than a human hair.

When you place a brain organoid on top of this chip, those tiny wires (called **electrodes**) nestle right up against individual neurons. Each electrode can do two things:

**Send:** Flash a tiny electrical pulse into a neuron, like tapping it on the shoulder to get its attention — this is called **stimulation**.

**Receive:** Listen for the microsecond electrical spike that the neuron fires back — this is called **recording**.

So the MEA is basically a two-way walkie-talkie between a computer and living brain cells. The 8×8 grid you see in the "Electrophysiology MEA" tab is an exact visual replica of what this chip looks like.`,
  },
  {
    icon: FlaskConical,
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.3)',
    title: 'Why grow a brain in a dish?',
    emoji: '🔬',
    short: 'Because living neurons learn faster and use a million times less energy than any computer chip ever made.',
    long: `Here's the mind-blowing part: your brain right now is solving problems — reading these words, making memories, processing emotions — while using about **12 Watts** of power. That's less than a dim light bulb.

A modern AI like ChatGPT, meanwhile, runs on data centres that can consume **500,000 Watts** or more just to answer a single question. Entire power plants are being built just to run AI.

Neurons are also *plastic* — they physically rewire themselves as they learn. Each time two neurons fire together, the connection between them literally gets stronger. This is the biology behind every skill you've ever learned: riding a bike, solving equations, recognising a friend's face. No computer chip can do this yet.

A Swiss company called **FinalSpark** has already built an internet-connected "Neuroplatform" where universities around the world can remotely run experiments on living human brain organoids sitting in a lab in Switzerland. They call it **Wetware-as-a-Service** — biology in the cloud.`,
  },
  {
    icon: Gamepad2,
    color: 'var(--accent-amber)',
    glow: 'var(--accent-amber-glow)',
    title: 'The Pong Experiment: neurons that learned to play a video game',
    emoji: '🕹️',
    short: 'In 2022, an Australian company grew brain cells on a chip and — seriously — taught them to play Pong.',
    long: `This is the experiment that made headlines worldwide. A company called **Cortical Labs** in Melbourne placed human cortical neurons (350,000 of them) on an MEA chip they called **DishBrain**.

They connected the chip to a simulation of the classic video game Pong. Here's how the communication worked:

- **Input (sensing):** The MEA fired electrical pulses into the neurons telling them where the ball was. Pulses on the left side of the chip if the ball was left, right side if right.
- **Output (acting):** The researchers measured which neurons fired in response, and used that spiking pattern to move the game paddle.

When the neurons moved the paddle correctly and hit the ball: the chip sent a **predictable, structured** electrical pulse back — a reward signal.
When they missed: the chip fired a **random, chaotic** burst of electricity — unpredictable noise that neurons apparently "dislike" because it gives them no useful information.

Within **5 minutes**, the neurons started hitting the ball more often. Within an hour, they were playing measurably better than before. The neurons were learning — not because anyone programmed them to, but because biological cells naturally try to find patterns and reduce chaos.

The "Training Playground" tab in this simulator lets you watch exactly this happen.`,
  },
  // ─── AI / ML BRIDGE SECTIONS ─────────────────────────────────────────────
  {
    icon: Network,
    color: '#818cf8',
    glow: 'rgba(129, 140, 248, 0.3)',
    title: 'Wait — isn\'t AI already "inspired by the brain"?',
    emoji: '🤖',
    short: 'Sort of — but artificial neural networks are about as similar to real neurons as a toy plane is to a real jet.',
    long: `You've probably heard that AI — especially "neural networks" — was inspired by the brain. That's true! But here's the twist: the inspiration happened in the **1940s–1980s**, when we barely understood neurons at all. Since then, real neuroscience has raced ahead while AI went in its own direction.

Here's a side-by-side reality check:

**Artificial Neuron (like in ChatGPT):**
- Takes a list of numbers as input
- Multiplies each by a weight
- Adds them up, passes through a simple math function (like ReLU or sigmoid)
- That's it — one line of code

**Real Biological Neuron (like in this organoid):**
- Receives input from **up to 10,000 other neurons** simultaneously
- Each input arrives at a different time, from a different location on the neuron's surface
- The cell integrates all of this over time, doing complex electrochemical math
- If the total crosses a threshold, it fires a sharp electrical spike — an **action potential** — that travels down the axon at up to 100 m/s
- The strength of each connection **physically changes** every time it fires

So artificial neurons are a *cartoon sketch* of real neurons. Useful, powerful, but massively simplified. Organoid intelligence tries to use the **real thing**.`,
  },
  {
    icon: GitBranch,
    color: 'var(--accent-cyan)',
    glow: 'var(--accent-cyan-glow)',
    title: 'Transformers, Attention & GPT — how do they compare?',
    emoji: '🔀',
    short: 'ChatGPT uses attention to weigh which words matter. Neurons do something similar — but in 3D, in real-time, using electricity.',
    long: `The **Transformer** architecture (the "T" in ChatGPT, the tech behind Gemini, Claude, etc.) works like this:

Given a sequence of words, it asks for every word: *"How relevant is every other word to understanding this one?"* It scores those relevances (called **attention weights**), takes a weighted average, and passes that forward. Do this millions of times across many layers and you get language understanding.

This is actually not that far from what real neurons do! Here's the parallel:

| Transformer Concept | Biological Equivalent |
|---|---|
| **Attention weight** | Synaptic strength (how hard one neuron pulls on another) |
| **Token (word)** | Spike train pattern from one electrode |
| **Layer** | Cortical layer (the brain has 6 distinct layers of neurons) |
| **Training on data** | Synaptic plasticity — connections strengthen with use |
| **Context window** | Working memory — how many recent inputs a neuron "remembers" |

But here's where biology totally destroys transformers:

- **Time**: Transformers process everything in parallel, with no real concept of time. Real neurons are fundamentally *temporal* — the *timing* of spikes (milliseconds apart) encodes meaning.
- **Energy**: GPT-4 runs on ~$700,000 of H100 GPUs using megawatts of power. The equivalent biological computation happens in your skull using 12 watts.
- **Adaptability**: Transformers are frozen after training — their weights never change again. Biological synapses never stop changing. Every time you recall this explanation, the relevant neurons slightly rewrite themselves.

The big dream of organoid computing is to build something with transformer-level intelligence but with biological-level energy efficiency.`,
  },
  {
    icon: Sigma,
    color: 'var(--accent-amber)',
    glow: 'var(--accent-amber-glow)',
    title: 'Backpropagation vs. how neurons actually learn',
    emoji: '🎓',
    short: 'AI learns by calculating blame mathematically and spreading it backwards. Neurons do it chemically, locally, and in real-time.',
    long: `The magic behind all modern AI — from image classifiers to large language models — is an algorithm called **backpropagation** ("backprop"). Here's how it works:

1. Make a prediction
2. Measure how wrong it was (the "loss")
3. Use calculus (chain rule) to figure out how much each weight in the entire network contributed to that error
4. Nudge all the weights slightly in the direction that reduces error
5. Repeat millions of times

This works incredibly well — but it has two massive problems from a biology standpoint:

**Problem 1: It's not local.** To update a weight deep in the network, backprop needs to know the final error — which means information has to travel backwards through the entire network. Real neurons have no such "global messenger." Each synapse can only know about its own local activity.

**Problem 2: It's not online.** Backprop needs many passes over the same data ("epochs"). Real brains often learn from a **single experience** — you touch a hot stove once and immediately and permanently update your behaviour.

**What real neurons do instead:**

- **Hebbian learning**: "Neurons that fire together, wire together." If neuron A consistently fires just before neuron B, the connection from A→B gets stronger. No global error signal needed.
- **Spike-Timing Dependent Plasticity (STDP)**: A more precise version — if A fires just *before* B, strengthen the connection. If A fires just *after* B, weaken it. The window is ~20 milliseconds.
- **Free Energy Principle (FEP)**: The theory used in DishBrain's Pong experiment. Neurons are said to minimise "surprise" — they build an internal model of their environment and update it to make incoming signals as predictable as possible. It's a biological version of Bayesian inference.

Wetware computers learn through these real biological mechanisms — no gradients, no loss functions, no epochs. Just cells, electricity, and chemistry.`,
  },
  {
    icon: HeartPulse,
    color: 'var(--accent-green)',
    glow: 'var(--accent-green-glow)',
    title: 'What is this simulator actually showing me?',
    emoji: '💻',
    short: 'A real-time virtual replica of a working organoid lab — every number is based on real biology.',
    long: `Every panel in this app maps directly to something happening in actual research labs:

**🌱 Stem-Cell Grow Room** — Simulates the 90-day journey from stem cell to active neural network. The branching lines you see are modelled on how real axons grow toward chemical signals (called Nerve Growth Factors). The numbers — cell density, myelination % — are calibrated to published neuroscience data.

**⚡ Electrophysiology MEA** — Each of the 64 electrodes shows its real-time voltage (in microvolts, µV) and firing rate (in Hertz, Hz). The oscilloscope trace is generated using a mathematical model (the **Izhikevich neuron model**) that faithfully reproduces real action potential shapes.

**🧪 Incubator Controls** — In a real lab, organoids are kept alive in a CO₂ incubator at exactly 37°C with precisely controlled glucose (food) and oxygen. Disturbing these causes cell death — just like in the simulator. Real researchers accidentally kill organoids by forgetting to refill the growth media.

**🕹️ Training Playground** — Implements the actual DishBrain learning algorithm: structured rewards for hits, chaotic stimulation for misses.

**📊 Silicon vs Biotech** — The benchmarks use real published figures from Nature and Frontiers in Science papers.`,
  },
  {
    icon: Cpu,
    color: 'var(--accent-cyan)',
    glow: 'var(--accent-cyan-glow)',
    title: 'Silicon vs. Wetware: why it matters',
    emoji: '🔋',
    short: "AI is running out of electricity. Biology might be the only solution that scales.",
    long: `There is a genuine crisis brewing in AI right now. Training a single large language model (like GPT-4) uses roughly **50,000 megawatt-hours** of electricity — equivalent to the power consumed by 5,000 American homes for an entire year.

As AI gets smarter, this number grows. By 2030, AI data centres are projected to consume more electricity than entire countries. New nuclear power plants are being planned specifically to power AI.

Biological organoids offer a radically different path:
- **Energy**: A real organoid uses ~10 microwatts. That's 70 *billion* times less than an NVIDIA H100 GPU cluster.
- **Self-assembly**: You don't need a $15 billion semiconductor fabrication plant — you grow them in a test tube.
- **3D architecture**: Silicon chips are flat (2D). Neurons connect in all directions through a 3D volume, giving them vastly more connection density.
- **Self-repair**: Chips can't fix themselves. Biological tissue can — within limits.

None of this means organoids will replace your laptop any time soon. But for specific tasks — pattern recognition, adaptive learning, complex signal processing — biocomputers may solve tomorrow's energy problem in a way silicon fundamentally cannot.`,
  },
  {
    icon: ShieldAlert,
    color: 'var(--accent-amber)',
    glow: 'var(--accent-amber-glow)',
    title: 'The Big Ethical Question: could they feel anything?',
    emoji: '⚖️',
    short: "Scientists genuinely don't know — and they're taking it seriously.",
    long: `This is the part that keeps neuroscientists up at night. Current organoids are nowhere near complex enough to have conscious experience — they have no sensory systems, no integrated perception, no self-model. A mature organoid contains roughly 2–3 million neurons. Your brain has 86 *billion*.

But the field is moving fast. And because we don't fully understand what generates consciousness even in humans, we can't rule anything out with certainty. In 2022, leading scientists signed the **Baltimore Declaration on Organoid Intelligence**, which explicitly commits the field to:

- **Monitor** organoids for any indicators of sentience as they grow more complex
- **Minimise** any possibility of suffering (keeping environments stable, avoiding unnecessary stimulation)
- **Maintain** ongoing public dialogue and ethics review boards
- **Respect** the rights of cell donors

A theory called **Integrated Information Theory (IIT)** tries to measure consciousness mathematically using a value called Φ (phi). Higher Φ = more integrated, more "conscious-like" information processing. The Ethics panel in this simulator displays a simplified Φ proxy — and triggers a review alert when thresholds are crossed, exactly as the Baltimore Declaration recommends.

The honest answer is: we're playing at the frontier of what's possible, and we're trying hard to be responsible about it.`,
  },
  {
    icon: Leaf,
    color: 'var(--accent-green)',
    glow: 'var(--accent-green-glow)',
    title: "Where is this all going?",
    emoji: '🚀',
    short: "FinalSpark plans bio-servers accessible from the cloud by 2026. CL-1, a commercial hybrid chip, launched in 2025.",
    long: `The field is moving from "proof of concept" to "can we actually scale this?"

**Right now (2025):**
- **FinalSpark** in Switzerland runs the world's first internet-connected neuroplatform, with 16 live human organoids available 24/7 to researchers globally via a Python API. Organoids now survive 100+ days.
- **Cortical Labs** released the **CL-1** chip — a commercial hybrid that integrates human neurons directly onto silicon, packaged and shipped like a conventional processor.
- Researchers demonstrated organoids performing **Braille pattern recognition** — feeding letter patterns electrically and reading out classification signals.

**Horizon 2027–2030:**
- FinalSpark's roadmap targets bio-server farms providing cloud compute for generative AI tasks.
- Research groups are exploring **personalised drug testing** — growing an organoid from a patient's own cells, exposing it to drugs, and measuring neural toxicity before the patient takes anything.
- **Disease modelling**: Organoids from people with Alzheimer's or Parkinson's show disease-related misfiring patterns years before symptoms appear. They could become the ultimate early-warning system.

The goal isn't to grow a full human brain in a vat — it's to harness what evolution perfected over 500 million years of nervous system development, and use it responsibly to solve 21st century problems.`,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export const About: React.FC = () => {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(0,255,127,0.2), rgba(0,240,255,0.1))',
            border: '1px solid rgba(0,255,127,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Microscope size={26} style={{ color: 'var(--accent-green)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              What is Synaptic Wetware?
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', marginTop: '8px', lineHeight: 1.6, maxWidth: '720px' }}>
              A plain-English guide to the science of growing brain cells on a chip — no biology degree required.
              Click any question below to dig in.
            </p>
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: '20px',
            background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
            fontSize: '0.7rem', fontWeight: 700, color: '#a855f7',
            textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0
          }}>
            Beginner Friendly
          </div>
        </div>

        {/* Quick-stat badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px' }}>
          {[
            { icon: '🧠', label: 'Brain cells in a dish', value: '~2M neurons' },
            { icon: '⚡', label: 'Power used', value: '10 microwatts' },
            { icon: '🕹️', label: 'First learned Pong', value: '2022 (DishBrain)' },
            { icon: '🌍', label: 'Online neuroplatform', value: 'FinalSpark 2024' },
            { icon: '⚖️', label: 'Ethics framework', value: 'Baltimore Declaration' },
          ].map((b) => (
            <div key={b.label} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px', padding: '10px 14px',
            }}>
              <span style={{ fontSize: '1.25rem' }}>{b.icon}</span>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{b.label}</div>
                <div className="font-telemetry" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{b.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'rgba(0,255,127,0.04)', border: '1px solid rgba(0,255,127,0.12)',
        borderRadius: '12px', padding: '12px 18px',
      }}>
        <Lightbulb size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--accent-green)' }}>Pro tip:</strong> After reading, explore each tab in the left sidebar — the Grow Room, MEA Grid, and Training Playground all have tooltips that connect back to the science explained here.
        </p>
      </div>

      {/* Accordion sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
        {concepts.map((c, i) => {
          const Icon = c.icon;
          const isOpen = expanded === i;
          return (
            <div
              key={i}
              className="glass-panel"
              style={{
                border: isOpen ? `1px solid ${c.color}33` : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isOpen ? `0 0 20px ${c.glow}` : 'none',
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                overflow: 'hidden',
              }}
            >
              {/* Accordion header */}
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '18px 22px', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: `${c.color}18`,
                  border: `1px solid ${c.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  ...(isOpen ? { boxShadow: `0 0 14px ${c.glow}` } : {}),
                }}>
                  <Icon size={18} style={{ color: c.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
                    <span style={{ fontSize: '0.975rem', fontWeight: 700, color: '#fff' }}>{c.title}</span>
                  </div>
                  {!isOpen && (
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
                      {c.short}
                    </p>
                  )}
                </div>
                <div style={{
                  flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}>
                  {isOpen
                    ? <ChevronUp size={14} style={{ color: c.color }} />
                    : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  }
                </div>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div style={{ padding: '0 22px 22px 22px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '12px', padding: '20px 22px',
                    borderLeft: `3px solid ${c.color}`,
                  }}>
                    {c.long.split('\n\n').map((para, pi) => (
                      <p
                        key={pi}
                        style={{
                          fontSize: '0.9rem',
                          color: 'rgba(255,255,255,0.72)',
                          lineHeight: '1.75',
                          marginBottom: pi < c.long.split('\n\n').length - 1 ? '14px' : '0',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: para
                            .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;font-weight:700">$1</strong>')
                            .replace(/\n/g, '<br />')
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer card */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(0,255,127,0.04), rgba(0,240,255,0.02))',
        border: '1px solid rgba(0,255,127,0.1)',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <Lightbulb size={22} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
          <strong style={{ color: '#fff' }}>Want to learn more?</strong>&nbsp; Search for{' '}
          <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>"DishBrain Pong Nature Electronics 2022"</span>,{' '}
          <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>"FinalSpark Neuroplatform"</span>, and{' '}
          <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>"Baltimore Declaration Organoid Intelligence"</span>{' '}
          — they're all freely readable and form the direct scientific basis for this simulator.
        </p>
      </div>
    </div>
  );
};
