/**
 * "Nice" tick generation using the classic 1/2/5 * 10^n algorithm.
 *
 * These are the same round numbers a human would pick for an axis:
 * ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...
 */

/**
 * Round a raw range to the nearest "nice" number.
 *
 * @param range - a strictly positive span
 * @param round - when true, snap to the nearest nice number; when false, snap up
 *                to the smallest nice number >= range (used to bound the extent).
 */
function niceNum(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const pow = Math.pow(10, exponent);
  const fraction = range / pow;

  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * pow;
}

/**
 * Count the decimal places needed to represent a step without float noise.
 * A step of 0.05 needs 2, a step of 2 needs 0.
 */
function decimalsForStep(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  const exponent = Math.floor(Math.log10(step));
  return exponent < 0 ? -exponent : 0;
}

/**
 * Snap a value to a fixed number of decimals, killing accumulated float error
 * (e.g. 0.1 + 0.2 -> 0.30000000000000004 becomes 0.3).
 */
function roundTo(value: number, decimals: number): number {
  // `+0` collapses a possible `-0` back to `0`.
  return Number(value.toFixed(decimals)) + 0;
}

/** The step size that {@link niceTicks} would use, exposed on its own. */
export function tickStep(min: number, max: number, count: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const targetCount = Math.max(1, Math.floor(count));

  if (lo === hi || targetCount < 2) {
    // Degenerate: no meaningful spacing. Fall back to a unit step (or the
    // magnitude of the value for a zero-width non-zero domain).
    const magnitude = Math.abs(lo);
    return magnitude === 0 ? 1 : niceNum(magnitude, true);
  }

  const span = niceNum(hi - lo, false);
  return niceNum(span / (targetCount - 1), true);
}

/**
 * Generate "nice" tick values covering `[min, max]`.
 *
 * The returned ticks are rounded, evenly spaced, and the extent is expanded
 * outward so the first tick is <= min and the last is >= max.
 *
 * Edge cases handled:
 * - `min > max` is treated the same as `max > min` (the pair is sorted).
 * - A zero-width domain (`min === max`) yields a single tick at that value.
 * - `count < 2` yields the two endpoints (or a single tick if zero-width).
 *
 * @param min   - low end of the data domain
 * @param max   - high end of the data domain
 * @param count - desired approximate number of ticks (the actual count may
 *                differ slightly because ticks are forced onto round numbers)
 * @returns ascending array of tick values
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError("niceTicks: min and max must be finite numbers");
  }

  const lo = Math.min(min, max);
  const hi = Math.max(min, max);

  if (lo === hi) {
    // Zero-width domain: a single tick is the only honest answer.
    return [lo + 0];
  }

  const targetCount = Math.max(1, Math.floor(count));
  if (targetCount < 2) {
    return [lo + 0, hi + 0];
  }

  const step = tickStep(lo, hi, targetCount);
  const decimals = decimalsForStep(step);

  const niceMin = Math.floor(lo / step) * step;
  const niceMax = Math.ceil(hi / step) * step;

  const ticks: number[] = [];
  // Guard against a pathological non-terminating loop from float error.
  const maxIterations = Math.round((niceMax - niceMin) / step) + 1;
  for (let i = 0; i < maxIterations; i++) {
    ticks.push(roundTo(niceMin + i * step, decimals));
  }

  return ticks;
}
