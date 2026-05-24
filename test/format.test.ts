import { describe, it, expect } from "vitest";
import { tickFormat, makeTickFormat } from "../src/format.js";
import { niceTicks } from "../src/ticks.js";

describe("tickFormat", () => {
  it("formats thousands with a k suffix", () => {
    expect(tickFormat(1200)).toBe("1.2k");
    expect(tickFormat(1000)).toBe("1k");
    expect(tickFormat(2500)).toBe("2.5k");
  });

  it("formats millions and billions", () => {
    expect(tickFormat(3.4e6)).toBe("3.4M");
    expect(tickFormat(1e6)).toBe("1M");
    expect(tickFormat(2.5e9)).toBe("2.5B");
    expect(tickFormat(1e12)).toBe("1T");
  });

  it("leaves sub-thousand values readable", () => {
    expect(tickFormat(0.05)).toBe("0.05");
    expect(tickFormat(42)).toBe("42");
    expect(tickFormat(999)).toBe("999");
    expect(tickFormat(3.14159)).toBe("3.14");
  });

  it("formats zero as a bare 0", () => {
    expect(tickFormat(0)).toBe("0");
  });

  it("preserves sign on negatives", () => {
    expect(tickFormat(-1500)).toBe("-1.5k");
    expect(tickFormat(-42)).toBe("-42");
    expect(tickFormat(-3.4e6)).toBe("-3.4M");
  });

  it("strips trailing zeros from the mantissa", () => {
    expect(tickFormat(2000)).toBe("2k");
    expect(tickFormat(2100)).toBe("2.1k");
    expect(tickFormat(2000000)).toBe("2M");
  });

  it("respects a custom precision", () => {
    expect(tickFormat(1234, { precision: 2 })).toBe("1.2k");
    expect(tickFormat(1234, { precision: 4 })).toBe("1.234k");
    expect(tickFormat(1234567, { precision: 4 })).toBe("1.235M");
  });

  it("handles values at the boundary of a prefix", () => {
    expect(tickFormat(999)).toBe("999");
    expect(tickFormat(1000)).toBe("1k");
    expect(tickFormat(999999)).toBe("1000k");
    expect(tickFormat(1000000)).toBe("1M");
  });

  it("degrades gracefully on non-finite input", () => {
    expect(tickFormat(NaN)).toBe("NaN");
    expect(tickFormat(Infinity)).toBe("∞");
    expect(tickFormat(-Infinity)).toBe("-∞");
  });

  it("composes with niceTicks for a full axis", () => {
    const labels = niceTicks(0, 10000, 5).map((v) => tickFormat(v));
    expect(labels).toEqual(["0", "2k", "4k", "6k", "8k", "10k"]);
  });
});

describe("makeTickFormat", () => {
  it("builds a reusable formatter bound to options", () => {
    const fmt = makeTickFormat({ precision: 2 });
    expect(fmt(1234)).toBe("1.2k");
    expect(fmt(56)).toBe("56");
  });

  it("maps cleanly over an array of ticks", () => {
    const fmt = makeTickFormat();
    expect(niceTicks(0, 1000000, 5).map(fmt)).toEqual([
      "0",
      "200k",
      "400k",
      "600k",
      "800k",
      "1M",
    ]);
  });
});
