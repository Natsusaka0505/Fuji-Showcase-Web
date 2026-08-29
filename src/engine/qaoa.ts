/**
 * QAOA and simulated annealing over the 16-variable routing QUBO.
 *
 * Both are real solvers run in the browser, not replays. QAOA holds the full
 * 2^16 complex state vector; because the cost Hamiltonian is diagonal in the
 * computational basis, applying exp(-i*gamma*C) is an elementwise phase and the
 * only real work is the mixer, which is 16 single-qubit rotations. One circuit
 * evaluation is therefore about a million flops — fast enough to put a classical
 * optimizer around it and watch the energy converge live.
 *
 * The energies are the same ones the map and ranking views use, so the optimum
 * QAOA is chasing is exactly the -97.4936 the platform run hit.
 */

export interface QaoaParams {
  /** Circuit depth. Each layer adds one cost phase and one mixer. */
  p: number;
  /** Nelder-Mead iterations. */
  maxIter: number;
  seed: number;
}

export const DEFAULT_QAOA_PARAMS: QaoaParams = { p: 2, maxIter: 60, seed: 7 };

export interface QaoaResult {
  /** Expectation value at each optimizer step — the convergence curve. */
  convergence: number[];
  bestExpectation: number;
  /** Optimized angles, gamma then beta per layer. */
  angles: number[];
  /** Lowest energy among the most probable states, i.e. what sampling returns. */
  bestSampledEnergy: number;
  bestSampledZ: number;
  /** Probability of measuring the true optimum. */
  optimumProbability: number;
  /** The 8 most probable basis states, for the outcome chart. */
  topStates: { z: number; prob: number; energy: number }[];
  evaluations: number;
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

/**
 * Run the QAOA circuit and return <psi|C|psi> along with the final state.
 *
 * Energies are rescaled by their spread before entering the phase, so that a
 * gamma of order 1 produces a meaningful rotation regardless of how the QUBO
 * happens to be scaled — without it the optimizer would have to discover a step
 * size of 1e-3 by itself.
 */
function evaluate(
  energies: Float64Array,
  nQubits: number,
  angles: number[],
  p: number,
  re: Float64Array,
  im: Float64Array,
  scale: number,
): number {
  const n = energies.length;
  const uniform = 1 / Math.sqrt(n);
  re.fill(uniform);
  im.fill(0);

  for (let layer = 0; layer < p; layer++) {
    const gamma = angles[layer];
    const beta = angles[p + layer];

    // Cost layer: diagonal, so just a phase per basis state.
    for (let z = 0; z < n; z++) {
      const phi = -gamma * energies[z] * scale;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      const r = re[z];
      const i = im[z];
      re[z] = r * c - i * s;
      im[z] = r * s + i * c;
    }

    // Mixer layer: Rx(2*beta) on every qubit.
    const c = Math.cos(beta);
    const s = Math.sin(beta);
    for (let q = 0; q < nQubits; q++) {
      const bit = 1 << q;
      for (let z = 0; z < n; z++) {
        if (z & bit) continue;
        const w = z | bit;
        const ar = re[z];
        const ai = im[z];
        const br = re[w];
        const bi = im[w];
        // [[cos, -i sin], [-i sin, cos]]
        re[z] = ar * c + bi * s;
        im[z] = ai * c - br * s;
        re[w] = br * c + ai * s;
        im[w] = bi * c - ar * s;
      }
    }
  }

  let exp = 0;
  for (let z = 0; z < n; z++) exp += (re[z] * re[z] + im[z] * im[z]) * energies[z];
  return exp;
}

/** Nelder-Mead: derivative-free, like the COBYLA used on the platform. */
function nelderMead(
  f: (x: number[]) => number,
  x0: number[],
  maxIter: number,
  step: number,
  onStep: (best: number) => void,
): { x: number[]; fx: number; evaluations: number } {
  const n = x0.length;
  let evaluations = 0;
  const call = (x: number[]) => {
    evaluations++;
    return f(x);
  };

  const simplex: { x: number[]; fx: number }[] = [{ x: [...x0], fx: call(x0) }];
  for (let i = 0; i < n; i++) {
    const x = [...x0];
    x[i] += step;
    simplex.push({ x, fx: call(x) });
  }

  for (let iter = 0; iter < maxIter; iter++) {
    simplex.sort((a, b) => a.fx - b.fx);
    onStep(simplex[0].fx);

    const best = simplex[0];
    const worst = simplex[n];
    const secondWorst = simplex[n - 1];

    const centroid = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) centroid[j] += simplex[i].x[j] / n;
    }

    const reflect = centroid.map((c, j) => c + (c - worst.x[j]));
    const fr = call(reflect);

    if (fr < best.fx) {
      const expand = centroid.map((c, j) => c + 2 * (c - worst.x[j]));
      const fe = call(expand);
      simplex[n] = fe < fr ? { x: expand, fx: fe } : { x: reflect, fx: fr };
    } else if (fr < secondWorst.fx) {
      simplex[n] = { x: reflect, fx: fr };
    } else {
      const contract = centroid.map((c, j) => c + 0.5 * (worst.x[j] - c));
      const fc = call(contract);
      if (fc < worst.fx) {
        simplex[n] = { x: contract, fx: fc };
      } else {
        for (let i = 1; i <= n; i++) {
          const x = simplex[i].x.map((v, j) => best.x[j] + 0.5 * (v - best.x[j]));
          simplex[i] = { x, fx: call(x) };
        }
      }
    }
  }

  simplex.sort((a, b) => a.fx - b.fx);
  return { x: simplex[0].x, fx: simplex[0].fx, evaluations };
}

export function runQaoa(energies: Float64Array, nQubits: number, params: QaoaParams): QaoaResult {
  const n = energies.length;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  const rand = rng(params.seed);

  let min = Infinity;
  let max = -Infinity;
  for (let z = 0; z < n; z++) {
    if (energies[z] < min) min = energies[z];
    if (energies[z] > max) max = energies[z];
  }
  const scale = 1 / (max - min || 1);

  const p = params.p;
  const x0 = Array.from({ length: 2 * p }, () => rand() * 0.6 + 0.2);
  const convergence: number[] = [];

  const { x, fx, evaluations } = nelderMead(
    (angles) => evaluate(energies, nQubits, angles, p, re, im, scale),
    x0,
    params.maxIter,
    0.35,
    (best) => convergence.push(best),
  );

  // Re-run at the optimum so `re`/`im` hold the final state to read out.
  evaluate(energies, nQubits, x, p, re, im, scale);

  let bestSampledEnergy = Infinity;
  let bestSampledZ = -1;
  let optimumProbability = 0;
  const probs = new Float64Array(n);
  for (let z = 0; z < n; z++) {
    const pr = re[z] * re[z] + im[z] * im[z];
    probs[z] = pr;
    if (Math.abs(energies[z] - min) < 1e-9) optimumProbability += pr;
  }

  // What sampling would return: the lowest energy among states with real weight.
  const order = Array.from({ length: n }, (_, z) => z).sort((a, b) => probs[b] - probs[a]);
  const topStates = order.slice(0, 8).map((z) => ({ z, prob: probs[z], energy: energies[z] }));
  for (const z of order.slice(0, 1024)) {
    if (energies[z] < bestSampledEnergy) {
      bestSampledEnergy = energies[z];
      bestSampledZ = z;
    }
  }

  return {
    convergence,
    bestExpectation: fx,
    angles: x,
    bestSampledEnergy,
    bestSampledZ,
    optimumProbability,
    topStates,
    evaluations,
  };
}

export interface SaParams {
  iterations: number;
  startTemp: number;
  endTemp: number;
  seed: number;
}

export const DEFAULT_SA_PARAMS: SaParams = {
  iterations: 4000,
  startTemp: 40,
  endTemp: 0.05,
  seed: 7,
};

export interface SaResult {
  bestEnergy: number;
  bestZ: number;
  /** Best-so-far energy sampled along the run, for the trace chart. */
  trace: number[];
  accepted: number;
}

/** Single-bit-flip simulated annealing with a geometric cooling schedule. */
export function runSa(energies: Float64Array, nQubits: number, params: SaParams): SaResult {
  const rand = rng(params.seed);
  const n = energies.length;
  let z = Math.floor(rand() * n);
  let e = energies[z];
  let bestZ = z;
  let bestEnergy = e;
  let accepted = 0;

  const trace: number[] = [];
  const every = Math.max(1, Math.floor(params.iterations / 120));
  const cooling = Math.pow(params.endTemp / params.startTemp, 1 / params.iterations);
  let temp = params.startTemp;

  for (let i = 0; i < params.iterations; i++) {
    const flip = 1 << Math.floor(rand() * nQubits);
    const zNew = z ^ flip;
    const eNew = energies[zNew];
    const delta = eNew - e;
    if (delta <= 0 || rand() < Math.exp(-delta / temp)) {
      z = zNew;
      e = eNew;
      accepted++;
      if (e < bestEnergy) {
        bestEnergy = e;
        bestZ = z;
      }
    }
    temp *= cooling;
    if (i % every === 0) trace.push(bestEnergy);
  }
  trace.push(bestEnergy);

  return { bestEnergy, bestZ, trace, accepted };
}
