import assert from 'node:assert';
import test from 'node:test';
import {
  IZHI_PRESETS,
  stepIzh,
  getQ10Factor,
  stepHH,
  detectBurstsMaxInterval,
  SynapticNetwork,
} from '../src/index.js';

test('Izhikevich Presets and Solver Physics', async (t) => {
  await t.test('Standard presets exist with correct biological constants', () => {
    assert.strictEqual(IZHI_PRESETS.RS.a, 0.02);
    assert.strictEqual(IZHI_PRESETS.RS.b, 0.20);
    assert.strictEqual(IZHI_PRESETS.RS.c, -65.0);
    assert.strictEqual(IZHI_PRESETS.RS.d, 8.0);

    assert.strictEqual(IZHI_PRESETS.FS.a, 0.10);
    assert.strictEqual(IZHI_PRESETS.FS.b, 0.20);
    assert.strictEqual(IZHI_PRESETS.FS.c, -65.0);
    assert.strictEqual(IZHI_PRESETS.FS.d, 2.0);
  });

  await t.test('stepIzh sub-threshold current does not spike', () => {
    let state = { v: -65.0, u: -13.0 }; // resting u = b * v
    let didSpike = false;
    
    // Inject weak sub-threshold stimulus (I = 0.5) for 20ms
    for (let step = 0; step < 40; step++) {
      const [nextState, spike] = stepIzh(state, 0.5, 0.5, IZHI_PRESETS.RS);
      state = nextState;
      if (spike) didSpike = true;
    }
    
    assert.strictEqual(didSpike, false, 'Sub-threshold stimulus should not spike');
    assert.ok(state.v < -50.0, 'Voltage should remain close to rest');
  });

  await t.test('stepIzh depolarizing current triggers action potential', () => {
    let state = { v: -65.0, u: -13.0 };
    let didSpike = false;
    
    // Inject strong excitatory stimulus (I = 15.0)
    for (let step = 0; step < 40; step++) {
      const [nextState, spike] = stepIzh(state, 15.0, 0.5, IZHI_PRESETS.RS);
      state = nextState;
      if (spike) didSpike = true;
    }
    
    assert.strictEqual(didSpike, true, 'Sufficiently strong stimulus must trigger action potential reset');
  });
});

test('Hodgkin-Huxley Q10 Thermodynamics scaling', async (t) => {
  await t.test('getQ10Factor scales exponentially with temperature relative to reference', () => {
    // Reference temperature is 6.3°C, where Q10 factor must be 1.0
    const factorRef = getQ10Factor(6.3);
    assert.ok(Math.abs(factorRef - 1.0) < 1e-5);

    // Warm temperature (37.0°C) must speed up gating rates (phi > 1.0)
    const factorWarm = getQ10Factor(37.0);
    assert.ok(factorWarm > 1.0);
    
    // Mathematical calculation: 3^((37.0 - 6.3) / 10) = 3^3.07 = ~29.17
    assert.ok(Math.abs(factorWarm - 29.17) < 0.1);
  });

  await t.test('stepHH integration handles depolarization', () => {
    let state = { V: -65.0, m: 0.05, h: 0.6, n: 0.3 };
    
    // Test a single integration step under stimulus (I = 10.0) at 37°C
    const [nextState, spiked] = stepHH(state, 10.0, 0.1, 37.0);
    
    assert.notDeepStrictEqual(nextState, state);
    assert.ok(nextState.V > state.V, 'Depolarizing current must increase membrane voltage V');
  });
});

test('3-Phase MaxInterval Burst Detection Accuracy', async (t) => {
  await t.test('Groups tight spike train clusters and filters isolated spikes', () => {
    // Mock spike train:
    // Cluster 1 (Burst): Spikes at 10ms, 20ms, 30ms, 40ms, 50ms (interval 10ms <= maxBeginIsi=100)
    // Isolated spike: Spike at 500ms (interval 450ms > maxEndIsi=200)
    // Cluster 2 (Burst): Spikes at 1000ms, 1015ms, 1030ms (interval 15ms)
    const mockSpikes = [10, 20, 30, 40, 50, 500, 1000, 1015, 1030];
    
    const bursts = detectBurstsMaxInterval(
      mockSpikes,
      100, // maxBeginIsi
      200, // maxEndIsi
      200, // minIbi
      10,  // minBurstDuration
      3    // minSpikes
    );
    
    assert.strictEqual(bursts.length, 2, 'Should identify exactly two bursts');
    
    // Verify first burst details
    assert.strictEqual(bursts[0].startTime, 10);
    assert.strictEqual(bursts[0].endTime, 50);
    assert.strictEqual(bursts[0].spikeCount, 5);
    
    // Verify second burst details
    assert.strictEqual(bursts[1].startTime, 1000);
    assert.strictEqual(bursts[1].endTime, 1030);
    assert.strictEqual(bursts[1].spikeCount, 3);
  });

  await t.test('Merges bursts closer than minIbi', () => {
    // Burst A: Spikes at 10, 20, 30 (duration 20ms)
    // Burst B: Spikes at 100, 110, 120 (duration 20ms)
    // Interval between Burst A end (30) and Burst B start (100) is 70ms.
    // If minIbi is set to 150ms, these bursts must be merged!
    const mockSpikes = [10, 20, 30, 100, 110, 120];
    
    const bursts = detectBurstsMaxInterval(mockSpikes, 100, 200, 150, 10, 3);
    
    assert.strictEqual(bursts.length, 1, 'Two close candidate bursts must be merged into one');
    assert.strictEqual(bursts[0].startTime, 10);
    assert.strictEqual(bursts[0].endTime, 120);
    assert.strictEqual(bursts[0].spikeCount, 6);
  });
});

test('SynapticNetwork Simulator Class Integration', async (t) => {
  await t.test('Initializes with 64 electrodes and healthy bioreactor conditions', () => {
    const net = new SynapticNetwork();
    
    assert.strictEqual(net.electrodes.length, 64);
    assert.strictEqual(net.incubator.temperature, 37.0);
    assert.strictEqual(net.vitals.viability, 98);
    assert.strictEqual(net.vitals.cellCount, 250000);
    
    // Check role assignment on the 8x8 MEA Grid
    const inputA = net.electrodes.find(e => e.role === 'input-a');
    assert.ok(inputA);
    assert.strictEqual(inputA.x, 0);
    assert.strictEqual(inputA.y, 2);
  });

  await t.test('Ticking network depletes glucose and propagates simulation time', () => {
    const net = new SynapticNetwork();
    const initialGlucose = net.incubator.glucose;
    
    // Run 5 integration ticks (500ms simulation time)
    for (let i = 0; i < 5; i++) {
      net.tick(100, 'izhikevich');
    }
    
    assert.strictEqual(net.elapsedSimTime, 500);
    assert.ok(net.incubator.glucose < initialGlucose, 'Incubator metabolic glucose must be consumed');
  });

  await t.test('Manual stimulation triggers spike and updates timing metrics', () => {
    const net = new SynapticNetwork();
    
    net.stimulate(0, 30.0);
    
    assert.strictEqual(net.electrodes[0].voltage, 30.0);
    assert.strictEqual(net.electrodes[0].lastSpikeTime, 0);
  });
});
