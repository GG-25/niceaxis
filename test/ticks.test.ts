import { describe, it, expect } from "vitest";
import { niceTicks, tickStep } from "../src/ticks.js";

describe("niceTicks", () => {
  it("produces round 1/2/5 steps for a typical domain", () => {
    // Step is 20 (a 1/2/5 nice number); 25 = 2.5*10 is deliberately NOT nice.
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it("snaps the extent outward to cover the data", () => {
    const ticks = niceTicks(3, 97, 5);
    expect(ticks[0]).toBeLessThanOrEqual(3);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(97);
    // Every step is equal and nice.
    expect(ticks).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it("uses a step of 2 when the range calls for it", () => {
    expect(niceTicks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it("handles fractional domains without float noise", () => {
    // 0.1 + 0.2 style accumulation must not leak into the labels.
    expect(niceTicks(0, 1, 10)).toEqual([
      0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
    ]);
  });

  it("produces sub-unit ticks for small domains", () => {
    const ticks = niceTicks(0, 0.5, 5);
    expect(ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5]);
  });

  it("handles negative domains", () => {
    expect(niceTicks(-100, 0, 5)).toEqual([-100, -80, -60, -40, -20, 0]);
  });

  it("handles domains straddling zero", () => {
    const ticks = niceTicks(-30, 60, 5);
    expect(ticks[0]).toBeLessThanOrEqual(-30);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(60);
    expect(ticks).toContain(0);
  });

  it("treats reversed min/max the same as forward", () => {
    expect(niceTicks(100, 0, 5)).toEqual(niceTicks(0, 100, 5));
  });

  it("returns a single tick for a zero-width domain", () => {
    expect(niceTicks(42, 42, 5)).toEqual([42]);
  });

  it("returns a single tick for a zero-width domain at zero", () => {
    expect(niceTicks(0, 0, 5)).toEqual([0]);
  });

  it("returns the endpoints when count < 2", () => {
    expect(niceTicks(0, 100, 1)).toEqual([0, 100]);
  });

  it("never returns -0", () => {
    for (const t of niceTicks(-50, 50, 5)) {
      expect(Object.is(t, -0)).toBe(false);
    }
  });

  it("throws on non-finite input", () => {
    expect(() => niceTicks(NaN, 10, 5)).toThrow(RangeError);
    expect(() => niceTicks(0, Infinity, 5)).toThrow(RangeError);
  });

  it("scales cleanly across orders of magnitude", () => {
    expect(niceTicks(0, 1000, 5)).toEqual([0, 200, 400, 600, 800, 1000]);
    expect(niceTicks(0, 10000, 5)).toEqual([
      0, 2000, 4000, 6000, 8000, 10000,
    ]);
  });

  it("defaults to about five ticks", () => {
    const ticks = niceTicks(0, 100);
    expect(ticks.length).toBeGreaterThanOrEqual(4);
    expect(ticks.length).toBeLessThanOrEqual(7);
  });
});

describe("tickStep", () => {
  it("reports the spacing niceTicks uses", () => {
    expect(tickStep(0, 100, 5)).toBe(20);
    expect(tickStep(0, 10, 5)).toBe(2);
  });

  it("is symmetric under reversed bounds", () => {
    expect(tickStep(100, 0, 5)).toBe(tickStep(0, 100, 5));
  });

  it("falls back to a nice unit step for a zero-width domain", () => {
    expect(tickStep(5, 5, 5)).toBe(niceTicksStepFallback());
  });
});

// Documents the intended fallback: for a zero-width non-zero domain the step is
// the nice magnitude of the value (5 -> 5).
function niceTicksStepFallback(): number {
  return 5;
}
