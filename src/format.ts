/**
 * SI-ish tick formatting: turn raw axis values into short, human labels.
 *
 * 1200      -> "1.2k"
 * 3_400_000 -> "3.4M"
 * 0.05      -> "0.05"
 * -1500     -> "-1.5k"
 */

export interface TickFormatOptions {
  /**
   * Maximum number of significant digits to keep for the mantissa.
   * @default 3
   */
  precision?: number;
}

const PREFIXES: ReadonlyArray<{ readonly value: number; readonly symbol: string }> = [
  { value: 1e12, symbol: "T" },
  { value: 1e9, symbol: "B" },
  { value: 1e6, symbol: "M" },
  { value: 1e3, symbol: "k" },
];

/**
 * Trim trailing zeros from a decimal string: "1.20" -> "1.2", "3.00" -> "3".
 */
function trimZeros(s: string): string {
  if (s.indexOf(".") === -1) return s;
  return s.replace(/\.?0+$/, "");
}

/**
 * Format a number with at most `precision` significant digits, then strip any
 * trailing zeros the rounding introduced.
 */
function toSignificant(value: number, precision: number): string {
  // toPrecision can emit exponential notation for very small/large values; we
  // only call it on the already-scaled mantissa (roughly 1..1000) so it stays
  // in fixed notation.
  const fixed = value.toPrecision(precision);
  // Normalise away any exponent form just in case, then trim zeros.
  return trimZeros(Number(fixed).toString());
}

/**
 * Format a single tick value into a compact label.
 *
 * @param value - the tick value
 * @param options - formatting options (see {@link TickFormatOptions})
 * @returns a short human-readable string
 *
 * @example
 * tickFormat(1200);     // "1.2k"
 * tickFormat(3.4e6);    // "3.4M"
 * tickFormat(0.05);     // "0.05"
 * tickFormat(-1_500);   // "-1.5k"
 */
export function tickFormat(value: number, options: TickFormatOptions = {}): string {
  const precision = Math.max(1, Math.floor(options.precision ?? 3));

  if (Number.isNaN(value)) return "NaN";
  if (!Number.isFinite(value)) return value > 0 ? "∞" : "-∞";
  if (value === 0) return "0";

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  for (const { value: threshold, symbol } of PREFIXES) {
    if (abs >= threshold) {
      return sign + toSignificant(abs / threshold, precision) + symbol;
    }
  }

  // Below 1000: show as-is with significant-digit rounding.
  return sign + toSignificant(abs, precision);
}

/**
 * Build a reusable formatter bound to a set of options.
 *
 * @example
 * const fmt = makeTickFormat({ precision: 2 });
 * ticks.map(fmt); // ["0", "2.5k", "5k", ...]
 */
export function makeTickFormat(
  options: TickFormatOptions = {},
): (value: number) => string {
  return (value: number): string => tickFormat(value, options);
}
