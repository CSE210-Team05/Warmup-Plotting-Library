# MiniPlots Agent Guide

All agents must read this file completely before inspecting, editing, testing, or building the project.

## Project purpose

MiniPlots is a dependency-free-at-runtime browser plotting library. It accepts CSV text, a CSV URL, or a title-keyed JavaScript dataset and renders accessible SVG scatter or line charts.

## Public API contract

The package exposes exactly two public functions from `src/index.js`:

- `plotScatter(container, data, options)`
- `plotLine(container, data, options)`

Both functions are asynchronous and return `Promise<SVGSVGElement>`. `container` is a CSS selector or DOM element. `data` is one of `{ csv: string }`, `{ url: string }`, or an object mapping nonempty series titles to arrays of `{ x, y }` points. `options` supports `width`, `height`, `title`, `xLabel`, and `yLabel`. Plot type is selected by the function, not an option. Do not add a public generic `plot()` export.

## Architecture

- `src/index.js`: the only public entry point; resolves the container and orchestrates loading, validation, rendering, and atomic chart replacement.
- `src/data/csv.js`: strict lightweight CSV record parsing and CSV-to-series conversion.
- `src/data/normalize.js`: asynchronous input loading and conversion to canonical series.
- `src/data/validate.js`: canonical dataset and options validation.
- `src/render/scales.js`: numeric domains, ticks, and linear scales.
- `src/render/svg.js`: shared SVG frame, axes, labels, legends, and mark rendering.
- `tests/`: Vitest/jsdom unit and integration coverage.
- `index.html`, `demo.js`, `styles.css`, `public/example.csv`: Vite demo.
- `vite.lib.config.js`: standalone ESM library build to `dist/mini-plots.js`.
- `vite.demo.config.js`: static demo build to `site/`.
- `scripts/prepare-site.js`: copies the standalone library into the demo output.
- `scripts/verify-build.js`: verifies expected build artifacts and public exports.
- `.github/workflows/ci.yml`: Node 24 verification and GitHub Pages deployment.

## Implementation constraints

- Use plain JavaScript ES modules and native browser SVG APIs.
- Keep runtime dependencies empty. Vite, Vitest, and jsdom are development-only.
- Keep CSV/object inputs on one normalization, validation, scaling, and rendering pipeline.
- Do not mutate caller-provided data or inject user content with `innerHTML`.
- Build a replacement SVG completely before removing an existing MiniPlots SVG.
- Keep `dist/`, `site/`, `node_modules/`, coverage, and caches untracked.
- Do not expose internal modules through package exports.
- Preserve stable ascending-x ordering for line marks; equal-x points retain input order.

## Verification workflow

Use Node.js 24. Before handing off changes, run:

1. `npm ci` (or `npm install` only when intentionally updating the lockfile)
2. `npm test`
3. `npm run build`

The build must produce `dist/mini-plots.js`, `site/index.html`, `site/mini-plots.js`, and `site/example.csv`. When changing behavior, update tests, README documentation, and this file if the architecture or agent guidance changes.

## Deployment boundary

CI deploys `site/` only on successful pushes to `main`. Repository owners must separately enable GitHub Actions and select GitHub Actions as the Pages source. Never claim the public Pages deployment is live without checking it.
