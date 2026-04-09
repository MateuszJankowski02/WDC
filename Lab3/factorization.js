const crypto = require("crypto");
const { gcd, generateRsaKeyPair } = require("./rsa");

/**
 * Losuje BigInt z zakresu [min, max].
 * @param {bigint} min
 * @param {bigint} max
 * @returns {bigint}
 */
const randomBigIntForBenchmark = (min, max) => {
  if (min > max) {
    throw new Error("Niepoprawny zakres losowania BigInt.");
  }

  const range = max - min + 1n;
  const bits = range.toString(2).length;
  const bytes = Math.ceil(bits / 8);
  const mask = (1n << BigInt(bits)) - 1n;

  while (true) {
    const raw = crypto.randomBytes(bytes);
    const value = BigInt(`0x${raw.toString("hex")}`) & mask;
    if (value < range) {
      return min + value;
    }
  }
};

/**
 * Znajduje nietrywialny dzielnik liczby n metoda Pollard Rho.
 * @param {bigint} n
 * @param {number} maxIterations
 * @param {number} maxRestarts
 * @returns {{factor: bigint | null, iterations: number}}
 */
const pollardsRho = (n, maxIterations = 10_000_000, maxRestarts = 24) => {
  if (n % 2n === 0n) {
    return { factor: 2n, iterations: 1 };
  }

  let totalIterations = 0;

  for (let restart = 0; restart < maxRestarts; restart += 1) {
    const c = randomBigIntForBenchmark(1n, n - 1n);
    let x = randomBigIntForBenchmark(2n, n - 2n);
    let y = x;
    let d = 1n;

    const f = (v) => (v * v + c) % n;

    while (d === 1n && totalIterations < maxIterations) {
      x = f(x);
      y = f(f(y));
      const diff = x > y ? x - y : y - x;
      d = gcd(diff, n);
      totalIterations += 1;
    }

    if (d > 1n && d < n) {
      return { factor: d, iterations: totalIterations };
    }

    if (totalIterations >= maxIterations) {
      break;
    }
  }

  return { factor: null, iterations: totalIterations };
};

/**
 * Faktoryzuje semiprime n = p*q.
 * @param {bigint} n
 * @param {{maxIterations?: number, maxRestarts?: number}} [options]
 * @returns {{p: bigint | null, q: bigint | null, iterations: number, success: boolean, method: string}}
 */
const factorSemiprime = (n, options = {}) => {
  if (n < 4n) {
    return {
      p: null,
      q: null,
      iterations: 0,
      success: false,
      method: "Pollard Rho",
    };
  }

  if (n % 2n === 0n) {
    return {
      p: 2n,
      q: n / 2n,
      iterations: 1,
      success: true,
      method: "Pollard Rho",
    };
  }

  const rho = pollardsRho(
    n,
    options.maxIterations ?? 10_000_000,
    options.maxRestarts ?? 24,
  );
  if (!rho.factor) {
    return {
      p: null,
      q: null,
      iterations: rho.iterations,
      success: false,
      method: "Pollard Rho",
    };
  }

  const p = rho.factor;
  const q = n / p;

  return {
    p,
    q,
    iterations: rho.iterations,
    success: p * q === n,
    method: "Pollard Rho",
  };
};

/**
 * Oblicza parametry regresji liniowej y = a*x + b.
 * @param {number[]} x
 * @param {number[]} y
 * @returns {{a: number, b: number}}
 */
const linearFit = (x, y) => {
  const n = x.length;
  const sumX = x.reduce((acc, v) => acc + v, 0);
  const sumY = y.reduce((acc, v) => acc + v, 0);
  const sumXY = x.reduce((acc, value, idx) => acc + value * y[idx], 0);
  const sumXX = x.reduce((acc, value) => acc + value * value, 0);

  const denominator = n * sumXX - sumX * sumX;
  const a = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const b = (sumY - a * sumX) / n;

  return { a, b };
};

/**
 * Liczy wspolczynnik dopasowania R^2.
 * @param {number[]} observed
 * @param {number[]} predicted
 * @returns {number}
 */
const rSquared = (observed, predicted) => {
  const mean = observed.reduce((acc, v) => acc + v, 0) / observed.length;
  const ssTot = observed.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  const ssRes = observed.reduce((acc, v, idx) => acc + (v - predicted[idx]) ** 2, 0);

  if (ssTot === 0) {
    return 1;
  }

  return 1 - ssRes / ssTot;
};

/**
 * Dopasowuje trzy modele: liniowy, wykladniczy i potegowy.
 * @param {Array<{bits: number, timeMs: number}>} points
 * @returns {{models: Array<{name: string, r2: number, predict: (x: number) => number}>, bestModel: {name: string, r2: number, predict: (x: number) => number}}}
 */
const fitModels = (points) => {
  const x = points.map((point) => point.bits);
  const y = points.map((point) => Math.max(point.timeMs, 0.0001));

  const linear = linearFit(x, y);
  const linearPredict = (value) => linear.a * value + linear.b;
  const linearR2 = rSquared(
    y,
    x.map((value) => linearPredict(value)),
  );

  const expBase = linearFit(x, y.map((value) => Math.log(value)));
  const expA = Math.exp(expBase.b);
  const expB = expBase.a;
  const expPredict = (value) => expA * Math.exp(expB * value);
  const expR2 = rSquared(
    y,
    x.map((value) => expPredict(value)),
  );

  const powerBase = linearFit(
    x.map((value) => Math.log(value)),
    y.map((value) => Math.log(value)),
  );
  const powerA = Math.exp(powerBase.b);
  const powerB = powerBase.a;
  const powerPredict = (value) => powerA * value ** powerB;
  const powerR2 = rSquared(
    y,
    x.map((value) => powerPredict(value)),
  );

  const models = [
    {
      name: "Liniowy",
      r2: linearR2,
      predict: linearPredict,
      equation: `t(bits) = ${linear.a.toFixed(6)} * bits + ${linear.b.toFixed(6)}`,
    },
    {
      name: "Wykladniczy",
      r2: expR2,
      predict: expPredict,
      equation: `t(bits) = ${expA.toExponential(6)} * exp(${expB.toFixed(6)} * bits)`,
    },
    {
      name: "Potegowy",
      r2: powerR2,
      predict: powerPredict,
      equation: `t(bits) = ${powerA.toExponential(6)} * bits^${powerB.toFixed(6)}`,
    },
  ].sort((left, right) => right.r2 - left.r2);

  return {
    models,
    bestModel: models[0],
  };
};

/**
 * Uruchamia benchmark faktoryzacji dla wskazanych dlugosci klucza.
 * @param {number[]} keySizes
 * @param {{maxIterations?: number, maxRestarts?: number}} [options]
 * @returns {{results: Array<{bits: number, n: bigint, method: string, timeMs: number, iterations: number, success: boolean, p: bigint | null, q: bigint | null, expectedP: bigint, expectedQ: bigint}>, fit: {models: Array<{name: string, r2: number, predict: (x: number) => number, equation: string}>, bestModel: {name: string, r2: number, predict: (x: number) => number, equation: string}}, extrapolation: Array<{bits: number, predictedMs: number}>}}
 */
const benchmarkFactorization = (
  keySizes = [32, 40, 48, 56, 64, 72, 80, 88],
  options = {},
) => {
  const results = [];

  for (const bits of keySizes) {
    const { publicKey, internals } = generateRsaKeyPair(bits);

    const start = process.hrtime.bigint();
    const factorization = factorSemiprime(publicKey.n, options);
    const end = process.hrtime.bigint();

    const success =
      factorization.success &&
      factorization.p !== null &&
      factorization.q !== null &&
      factorization.p * factorization.q === publicKey.n;

    results.push({
      bits,
      n: publicKey.n,
      method: factorization.method,
      timeMs: Number(end - start) / 1_000_000,
      iterations: factorization.iterations,
      success,
      p: factorization.p,
      q: factorization.q,
      expectedP: internals.p,
      expectedQ: internals.q,
    });
  }

  const fit = fitModels(results.map((entry) => ({ bits: entry.bits, timeMs: entry.timeMs })));
  const extrapolationTargets = [96, 128, 256];
  const extrapolation = extrapolationTargets.map((bits) => ({
    bits,
    predictedMs: fit.bestModel.predict(bits),
  }));

  return {
    results,
    fit,
    extrapolation,
  };
};

module.exports = {
  pollardsRho,
  factorSemiprime,
  fitModels,
  benchmarkFactorization,
};
