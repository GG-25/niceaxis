/**
 * niceaxis — tiny framework-agnostic axis/scale utilities for charts.
 *
 * Pure, deterministic, zero runtime dependencies. The math that charting
 * libraries reinvent: nice ticks, linear/log scales, and compact tick labels.
 */

export { niceTicks, tickStep } from "./ticks.js";
export { linearScale, logScale } from "./scale.js";
export type { Scale, Domain, Range } from "./scale.js";
export { tickFormat, makeTickFormat } from "./format.js";
export type { TickFormatOptions } from "./format.js";
