import { describe, it, expect } from "vitest";
import { linearScale, logScale } from "../src/scale.js";

describe("linearScale", () => {
  it("maps domain to range linearly", () => {
    const x = linearScale([0, 100], [0, 640]);
    expect(x(0)).toBe(0);
    expect(x(50)).toBe(320);
    expect(x(100)).toBe(640);
  });

  it("inverts back to the domain", () => {
    const x = linearScale([0, 100], [0, 640]);
    expect(x.invert(320)).toBe(50);
    expect(x.invert(0)).toBe(0);
    expect(x.invert(640)).toBe(100);
  });

  it("round-trips arbitrary values", () => {
    const x = linearScale([-20, 80], [10, 210]);
    for (const v of [-20, -5, 0, 33.3, 80]) {
      expect(x.invert(x(v))).toBeCloseTo(v, 10);
    }
  });

  it("handles an inverted (descending) range, e.g. SVG y-axis", () => {
    const y = linearScale([0, 100], [300, 0]);
    expect(y(0)).toBe(300);
    expect(y(100)).toBe(0);
    expect(y(50)).toBe(150);
    expect(y.invert(150)).toBe(50);
  });

  it("extrapolates beyond the domain by default", () => {
    const x = linearScale([0, 10], [0, 100]);
    expect(x(20)).toBe(200);
    expect(x(-5)).toBe(-50);
  });

  it("clamps when asked", () => {
    const x = linearScale([0, 10], [0, 100]).clamped();
    expect(x(20)).toBe(100);
    expect(x(-5)).toBe(0);
    expect(x(5)).toBe(50);
    expect(x.invert(500)).toBe(10);
    expect(x.invert(-500)).toBe(0);
  });

  it("survives a zero-width domain without dividing by zero", () => {
    const x = linearScale([5, 5], [0, 100]);
    expect(x(5)).toBe(0);
    expect(x(999)).toBe(0);
    expect(Number.isNaN(x(5))).toBe(false);
    // invert has no unique answer; it returns the domain start.
    expect(x.invert(50)).toBe(5);
  });

  it("survives a zero-width range", () => {
    const x = linearScale([0, 100], [50, 50]);
    expect(x(0)).toBe(50);
    expect(x(100)).toBe(50);
    expect(x.invert(50)).toBe(0);
  });

  it("exposes the domain and range it was built with", () => {
    const x = linearScale([1, 2], [3, 4]);
    expect(x.domain).toEqual([1, 2]);
    expect(x.range).toEqual([3, 4]);
  });

  it("throws on non-finite domain or range", () => {
    expect(() => linearScale([0, NaN], [0, 1])).toThrow(RangeError);
    expect(() => linearScale([0, 1], [0, Infinity])).toThrow(RangeError);
  });
});

describe("logScale", () => {
  it("maps decades to even range spacing", () => {
    const y = logScale([1, 1000], [0, 300]);
    expect(y(1)).toBeCloseTo(0, 10);
    expect(y(10)).toBeCloseTo(100, 10);
    expect(y(100)).toBeCloseTo(200, 10);
    expect(y(1000)).toBeCloseTo(300, 10);
  });

  it("inverts back to the domain", () => {
    const y = logScale([1, 1000], [0, 300]);
    expect(y.invert(0)).toBeCloseTo(1, 10);
    expect(y.invert(100)).toBeCloseTo(10, 10);
    expect(y.invert(300)).toBeCloseTo(1000, 10);
  });

  it("round-trips arbitrary positive values", () => {
    const y = logScale([1, 1000], [0, 300]);
    for (const v of [1, 3, 42, 500, 1000]) {
      expect(y.invert(y(v))).toBeCloseTo(v, 6);
    }
  });

  it("supports a custom base", () => {
    const y = logScale([1, 8], [0, 3], 2);
    expect(y(1)).toBeCloseTo(0, 10);
    expect(y(2)).toBeCloseTo(1, 10);
    expect(y(4)).toBeCloseTo(2, 10);
    expect(y(8)).toBeCloseTo(3, 10);
  });

  it("guards non-positive inputs instead of returning NaN/-Infinity", () => {
    const y = logScale([1, 1000], [0, 300]);
    expect(Number.isFinite(y(0))).toBe(true);
    expect(Number.isFinite(y(-5))).toBe(true);
    // Zero/negative map to (or below) the bottom of the range, never NaN.
    expect(Number.isNaN(y(0))).toBe(false);
  });

  it("clamps non-positive inputs when clamped()", () => {
    const y = logScale([1, 1000], [0, 300]).clamped();
    expect(y(0)).toBe(0);
    expect(y(-100)).toBe(0);
  });

  it("throws on a non-positive domain", () => {
    expect(() => logScale([0, 100], [0, 300])).toThrow(RangeError);
    expect(() => logScale([-1, 100], [0, 300])).toThrow(RangeError);
  });

  it("throws on a zero-width domain", () => {
    expect(() => logScale([10, 10], [0, 300])).toThrow(RangeError);
  });

  it("throws on an invalid base", () => {
    expect(() => logScale([1, 100], [0, 300], 1)).toThrow(RangeError);
    expect(() => logScale([1, 100], [0, 300], 0.5)).toThrow(RangeError);
  });
});
