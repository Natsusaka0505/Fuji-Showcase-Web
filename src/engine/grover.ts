/**
 * Grover Adaptive Search over the 16-variable routing QUBO.
 *
 * This is real amplitude amplification, not a replay: the state vector holds all
 * 2^16 amplitudes, the oracle flips the sign of every basis state whose energy
 * beats the current threshold, and the diffusion operator reflects about the
 * mean. Iterating that pair is what concentrates probability on the marked set,
 * and the hit probability reported here is measured from the resulting
 * amplitudes rather than assumed.
 *
 * One deliberate simplification, and the reason this fits in a browser: the
 * oracle is applied straight to the 16-qubit key register using the classically
 * known energies. On hardware the same oracle is built by writing w(x) into a
 * value register with QFT arithmetic (the GWG "quantum dictionary") and reading
 * its sign bit, which is what `gas_qulacs_q9.py` does and what pushes the real
 * circuit to 16 key + 24 value = 40 qubits. That arithmetic changes the gate
 * count enormously — it is the reason one 40q round took 44 hours — but it does
 * not change which states get marked, so the amplification dynamics shown here
 * are the ones the platform run is trying to realise.
 *
 * Amplitudes stay real throughout (uniform start, sign-flip oracle, reflection
 * about the mean), so a single Float64Array is enough.
 */

export interface GasParams {
  /** Outer BBHT iterations. The platform's 40q run had budget = 1. */
  budget: number;
  /** Measurements per iteration. */
  shots: number;
  /**
   * Starting threshold. Only states with energy below this are marked, so a
   * warm start close to the optimum makes the marked set tiny and hard to find;
   * the platform used -96 against a -97.49 optimum.
   */
  warmStartY0: number | null;
  /** BBHT growth factor for the rotation-count window; the platform used 8/7. */
  mGrowth: number;
  /** Cap on that window, so a single iteration cannot run away. */
  mMax: number;
  seed: number;
}

/**
 * Defaults tuned against this instance: the rotation window grows by 8/7 per
 * failed round, so the budget has to be long enough for it to reach the ~50-200
 * rotations the tighter thresholds need. 60 rounds hits the optimum on about
 * 85% of seeds in ~150 ms; going to 100 rounds reaches 100% but costs 800 ms.
 * GAS is probabilistic, and a default that always won would be a tuned demo.
 */
export const DEFAULT_GAS_PARAMS: GasParams = {
  budget: 60,
  shots: 64,
  warmStartY0: null,
  mGrowth: 8 / 7,
  mMax: 256,
  seed: 7,
};

export interface GasStep {
  t: number;
  /** Grover rotations applied this round. */
  r: number;
  /** Threshold in force while sampling. */
  y: number;
  /** Best energy sampled this round. */
  sampled: number;
  /** Best energy found so far. */
  best: number;
  /** Total probability mass on marked states after amplification. */
  markedProb: number;
  /** Probability mass on marked states before amplification, for comparison. */
  markedProbBefore: number;
  /** How many states satisfy the threshold. */
  nMarked: number;
  improved: boolean;
}

export interface GasResult {
  bestEnergy: number;
  bestZ: number;
  trail: GasStep[];
  /** Grover rotations summed over the run — the honest cost measure. */
  totalRotations: number;
  /** Energy evaluations a classical random search would need for the same shots. */
  classicalSamples: number;
  hitOptimum: boolean;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Flip the sign of every amplitude whose state beats the threshold. */
function oracle(amp: Float64Array, energies: Float64Array, y: number): number {
  let marked = 0;
  for (let z = 0; z < amp.length; z++) {
    if (energies[z] < y) {
      amp[z] = -amp[z];
      marked++;
    }
  }
  return marked;
}

/** Grover diffusion: reflect every amplitude about the mean. */
function diffuse(amp: Float64Array): void {
  const n = amp.length;
  let sum = 0;
  for (let z = 0; z < n; z++) sum += amp[z];
  const twiceMean = (2 * sum) / n;
  for (let z = 0; z < n; z++) amp[z] = twiceMean - amp[z];
}

function markedProbability(amp: Float64Array, energies: Float64Array, y: number): number {
  let p = 0;
  for (let z = 0; z < amp.length; z++) if (energies[z] < y) p += amp[z] * amp[z];
  return p;
}

/** Sample a basis state from |amplitude|^2. */
function sample(amp: Float64Array, u: number): number {
  let acc = 0;
  for (let z = 0; z < amp.length; z++) {
    acc += amp[z] * amp[z];
    if (u <= acc) return z;
  }
  return amp.length - 1;
}

/**
 * Duerr-Hoyer / BBHT outer loop: sample under the current threshold, and every
 * time a better value turns up lower the threshold and start amplifying against
 * the smaller marked set. The rotation count is drawn from a window that grows
 * on failure, which is what lets the search adapt without knowing how many
 * states are marked.
 */
export function runGas(energies: Float64Array, params: GasParams): GasResult {
  const n = energies.length;
  const rand = rng(params.seed);
  const amp = new Float64Array(n);

  let bestEnergy = params.warmStartY0 ?? Infinity;
  let bestZ = -1;
  if (params.warmStartY0 === null) {
    // No warm start: seed the threshold with one classical draw, as BBHT does.
    bestZ = Math.floor(rand() * n);
    bestEnergy = energies[bestZ];
  }

  const trail: GasStep[] = [];
  let m = 1;
  let totalRotations = 0;
  let classicalSamples = 0;

  for (let t = 0; t < params.budget; t++) {
    const y = bestEnergy;
    const r = Math.min(params.mMax, Math.max(0, Math.floor(rand() * m)));

    const uniform = 1 / Math.sqrt(n);
    amp.fill(uniform);
    const before = markedProbability(amp, energies, y);

    let nMarked = 0;
    for (let i = 0; i < r; i++) {
      nMarked = oracle(amp, energies, y);
      diffuse(amp);
    }
    if (r === 0) nMarked = countMarked(energies, y);
    totalRotations += r;

    const after = markedProbability(amp, energies, y);

    let sampledBest = Infinity;
    let sampledZ = -1;
    for (let s = 0; s < params.shots; s++) {
      const z = sample(amp, rand());
      classicalSamples++;
      if (energies[z] < sampledBest) {
        sampledBest = energies[z];
        sampledZ = z;
      }
    }

    const improved = sampledBest < bestEnergy;
    if (improved) {
      bestEnergy = sampledBest;
      bestZ = sampledZ;
      m = 1; // new, smaller marked set: restart the window
    } else {
      m = Math.min(params.mMax, m * params.mGrowth);
    }

    trail.push({
      t, r, y,
      sampled: sampledBest,
      best: bestEnergy,
      markedProb: after,
      markedProbBefore: before,
      nMarked,
      improved,
    });
  }

  let min = Infinity;
  for (let z = 0; z < n; z++) if (energies[z] < min) min = energies[z];

  return {
    bestEnergy,
    bestZ,
    trail,
    totalRotations,
    classicalSamples,
    hitOptimum: Math.abs(bestEnergy - min) < 1e-9,
  };
}

function countMarked(energies: Float64Array, y: number): number {
  let c = 0;
  for (let z = 0; z < energies.length; z++) if (energies[z] < y) c++;
  return c;
}

/**
 * Amplification curve for a fixed threshold: probability of measuring a marked
 * state after each rotation. This is the textbook sine curve, and showing it
 * measured rather than plotted from the formula is the point — it also makes
 * over-rotation visible, where amplitude swings back off the marked set.
 */
export function amplificationCurve(
  energies: Float64Array,
  y: number,
  maxRotations: number,
): { probs: number[]; nMarked: number; optimalR: number } {
  const n = energies.length;
  const amp = new Float64Array(n).fill(1 / Math.sqrt(n));
  const nMarked = countMarked(energies, y);
  const probs = [markedProbability(amp, energies, y)];

  for (let i = 0; i < maxRotations; i++) {
    oracle(amp, energies, y);
    diffuse(amp);
    probs.push(markedProbability(amp, energies, y));
  }

  // The classic estimate: (pi/4) * sqrt(N/M) rotations to peak.
  const optimalR = nMarked > 0 ? Math.round((Math.PI / 4) * Math.sqrt(n / nMarked)) : 0;
  return { probs, nMarked, optimalR };
}
