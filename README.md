# niceaxis

**The axis math every chart reinvents, as a tiny, pure, zero-dependency library.**

Every charting stack (D3, Chart.js, your hand-rolled `<svg>`) needs the same
three things before it can draw an axis:

1. **Nice tick values** - round numbers a human would actually pick (`0, 25, 50, 75, 100`), not `0, 23.75, 47.5, ...`.
2. **A scale** - map data values to pixels, and pixels back to data (for tooltips, brushing, hit-testing).
3. **Compact labels** - `1.2k`, `3.4M`, `0.05` instead of `1200`, `3400000`, `0.05000`.

`niceaxis` is those three things and nothing else. No runtime dependencies, no
DOM, no framework. It works in React, Vue, Svelte, Node, a Web Worker, or a
canvas render loop, anywhere numbers turn into charts.

- **Pure & deterministic** - same inputs, same outputs, always. Easy to test, safe to memoize.
- **Framework-agnostic** - the functions return plain numbers and arrays.
- **TypeScript-first** - strict types, full inference, `invert()` typed.
- **Edge-case hardened** - zero-width domains, descending ranges, log guards, single ticks.

## Install

```bash
npm install niceaxis
```

Requires Node 20+ (or any modern bundler). Ships ESM only.

## Usage

```ts
import { niceTicks, linearScale, logScale, tickFormat } from "niceaxis";

// 1. Pick nice tick values for a data domain.
const ticks = niceTicks(0, 9200, 5);
// -> [0, 2000, 4000, 6000, 8000, 10000]

// 2. Build a scale from data -> pixels.
const y = linearScale([0, 10000], [300, 0]); // note: SVG y grows downward
y(5000);        // -> 150   (data -> pixel)
y.invert(150);  // -> 5000  (pixel -> data, e.g. for a tooltip)

// 3. Turn tick values into short labels.
ticks.map((t) => tickFormat(t));
// -> ["0", "2k", "4k", "6k", "8k", "10k"]
```

Putting it together to render an SVG y-axis:

```ts
import { niceTicks, linearScale, makeTickFormat } from "niceaxis";

const data = [1200, 3400, 5100, 8800, 9200];
const max = Math.max(...data);

const ticks = niceTicks(0, max, 5);          // [0, 2000, 4000, 6000, 8000, 10000]
const y = linearScale([0, ticks.at(-1)!], [300, 0]);
const fmt = makeTickFormat();

const marks = ticks.map((t) => ({
  value: t,
  y: y(t),          // pixel position
  label: fmt(t),    // "2k"
}));

console.log(marks);
// [
//   { value: 0,     y: 300, label: "0"   },
//   { value: 2000,  y: 240, label: "2k"  },
//   { value: 4000,  y: 180, label: "4k"  },
//   { value: 6000,  y: 120, label: "6k"  },
//   { value: 8000,  y: 60,  label: "8k"  },
//   { value: 10000, y: 0,   label: "10k" },
// ]
```

### Logarithmic axes

```ts
import { logScale } from "niceaxis";

const y = logScale([1, 1000], [300, 0]); // three decades
y(1);    // 300
y(10);   // 200
y(100);  // 100
y(1000);   // 0
y.invert(200); // -> 10
```

Non-positive inputs are guarded (never `NaN`/`-Infinity`); a non-positive or
zero-width domain throws a clear `RangeError`.

## API

| Export | Signature | Notes |
|---|---|---|
| `niceTicks` | `(min, max, count?) => number[]` | 1/2/5·10ⁿ ticks; extent snapped outward. Default `count = 5`. |
| `tickStep` | `(min, max, count) => number` | The step size `niceTicks` uses. |
| `linearScale` | `(domain, range) => Scale` | Straight interpolation with `.invert()`. |
| `logScale` | `(domain, range, base?) => Scale` | Log-space interpolation; default `base = 10`. |
| `tickFormat` | `(value, opts?) => string` | SI-ish label: `1.2k`, `3.4M`, `0.05`. |
| `makeTickFormat` | `(opts?) => (value) => string` | Reusable formatter for `.map()`. |

Every `Scale` is callable and also exposes `.invert(v)`, `.domain`, `.range`,
and `.clamped()` (returns a scale that clamps out-of-domain inputs).

### Edge cases, by design

- `niceTicks(42, 42, 5)` → `[42]` (a zero-width domain has one honest tick).
- `niceTicks(100, 0, 5)` === `niceTicks(0, 100, 5)` (reversed bounds are sorted).
- `linearScale([5, 5], [0, 100])(5)` → `0` (no divide-by-zero).
- `linearScale([0, 100], [300, 0])` → descending range for SVG y-axes.
- `logScale([0, 100], ...)` → throws (`RangeError`), because log of ≤ 0 is undefined.
- No `-0` ever leaks into tick output.

## Develop

```bash
npm install
npm run typecheck   # tsc --noEmit, strict
npm test            # vitest run
npm run build       # emit dist/ (js + .d.ts)
```

## What I'd build next

- **`niceTimeTicks`** - the same 1/2/5 idea but on the calendar (1s, 5s, 15s, 1m, 1h, 1d, 1w, 1mo...), the other axis charts always need.
- **`bandScale` / `pointScale`** - ordinal scales for bar charts (categories → bands with padding).
- **Tick *count* honouring** - currently the extent is snapped and the count can drift by one; add a mode that returns exactly `count` ticks by clamping to the data extent.
- **Locale-aware `tickFormat`** - thin wrapper over `Intl.NumberFormat` for grouping separators and currency, keeping the SI compaction.
- **Log ticks** - `logTicks(min, max)` returning `1, 2, 5, 10, 20, 50, ...` to pair with `logScale`.

## License

MIT

## Maintainer

Maintained by **Gayathri Gurram**, NPI & Supply Chain Program Manager.

- Email: [ggurram.work@gmail.com](mailto:ggurram.work@gmail.com)
- LinkedIn: [linkedin.com/in/gayathri-g-b86207348](https://linkedin.com/in/gayathri-g-b86207348/)