/**
 * Scale factories: map a data `domain` onto a pixel (or any numeric) `range`,
 * with an `invert` for hit-testing / brushing back the other way.
 *
 * Framework-agnostic and pure: no DOM, no state, no side effects.
 */

export type Domain = readonly [number, number];
export type Range = readonly [number, number];

export interface Scale {
  /** Map a domain value to a range value. */
  (value: number): number;
  /** Map a range value back to a domain value. */
  invert(value: number): number;
  /** The `[min, max]` domain this scale was built with. */
  readonly domain: Domain;
  /** The `[min, max]` range this scale was built with. */
  readonly range: Range;
  /** Clamp values to the domain before mapping (returns a new scale). */
  clamped(): Scale;
}

function assertFinitePair(pair: readonly [number, number], label: string): void {
  const [a, b] = pair;
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new RangeError(`${label} must be a pair of finite numbers`);
  }
}

function makeScale(
  domain: Domain,
  range: Range,
  toNormalized: (value: number) => number,
  fromNormalized: (t: number) => number,
  clamp: boolean,
): Scale {
  const [r0, r1] = range;

  const clampT = (t: number): number => {
    if (!clamp) return t;
    return t < 0 ? 0 : t > 1 ? 1 : t;
  };

  const scale = ((value: number): number => {
    const t = clampT(toNormalized(value));
    return r0 + t * (r1 - r0);
  }) as Scale;

  Object.defineProperties(scale, {
    domain: { value: domain, enumerable: true },
    range: { value: range, enumerable: true },
    invert: {
      value: (value: number): number => {
        const denom = r1 - r0;
        // Zero-width range: every pixel maps back to the domain start.
        const t = denom === 0 ? 0 : clampT((value - r0) / denom);
        return fromNormalized(t);
      },
      enumerable: true,
    },
    clamped: {
      value: (): Scale =>
        makeScale(domain, range, toNormalized, fromNormalized, true),
      enumerable: true,
    },
  });

  return scale;
}

/**
 * Linear scale: `domain -> range` by straight interpolation.
 *
 * A zero-width domain maps every input to the start of the range (and would
 * otherwise divide by zero); `invert` on it returns the domain value.
 *
 * @example
 * const x = linearScale([0, 100], [0, 640]);
 * x(50);         // 320
 * x.invert(320); // 50
 */
export function linearScale(domain: Domain, range: Range): Scale {
  assertFinitePair(domain, "domain");
  assertFinitePair(range, "range");

  const [d0, d1] = domain;
  const span = d1 - d0;

  const toNormalized = (value: number): number =>
    span === 0 ? 0 : (value - d0) / span;
  const fromNormalized = (t: number): number => d0 + t * span;

  return makeScale(domain, range, toNormalized, fromNormalized, false);
}

/**
 * Logarithmic scale: interpolates in log-space. Both domain endpoints must be
 * strictly positive and non-equal (a log scale over zero or negatives is
 * undefined). Values passed to the scale are guarded and clamped to a tiny
 * positive epsilon so mapping never returns `NaN`/`-Infinity`.
 *
 * @param base - logarithm base, default 10
 * @throws RangeError when either domain endpoint is <= 0 or the domain is zero-width
 *
 * @example
 * const y = logScale([1, 1000], [0, 300]);
 * y(10);         // 100
 * y.invert(100); // 10
 */
export function logScale(domain: Domain, range: Range, base = 10): Scale {
  assertFinitePair(domain, "domain");
  assertFinitePair(range, "range");

  const [d0, d1] = domain;
  if (d0 <= 0 || d1 <= 0) {
    throw new RangeError("logScale: domain endpoints must be strictly positive");
  }
  if (d0 === d1) {
    throw new RangeError("logScale: domain must have non-zero width");
  }
  if (base <= 1) {
    throw new RangeError("logScale: base must be greater than 1");
  }

  const logBase = Math.log(base);
  const logOf = (v: number): number => Math.log(v) / logBase;

  // Smallest positive value we will ever take a log of, to avoid -Infinity.
  const EPSILON = Number.MIN_VALUE;

  const l0 = logOf(d0);
  const l1 = logOf(d1);
  const logSpan = l1 - l0;

  const toNormalized = (value: number): number => {
    const safe = value <= 0 ? EPSILON : value;
    return (logOf(safe) - l0) / logSpan;
  };
  const fromNormalized = (t: number): number => Math.pow(base, l0 + t * logSpan);

  return makeScale(domain, range, toNormalized, fromNormalized, false);
}
