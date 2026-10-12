# MiniPlots

MiniPlots is a small browser plotting library for accessible scatter and line charts. It uses plain JavaScript, native SVG, and no runtime dependencies. CSV text, CSV URLs, and title-keyed JavaScript datasets all pass through the same parsing, validation, scaling, and rendering pipeline.

The reusable library and the demo website are separate build outputs:

- `dist/mini-plots.js` is the standalone ES module.
- `site/` is the deployable demo, including its own copy at `site/mini-plots.js`.

## Public API

MiniPlots exports exactly two asynchronous functions:

```js
plotScatter(container, data, options): Promise<SVGSVGElement>
plotLine(container, data, options): Promise<SVGSVGElement>
```

`container` can be a CSS selector or an existing DOM element. Each call returns the generated SVG. The selected function determines the plot type; do not pass `options.type`.

### CSV text

```html
<div id="chart"></div>
<script type="module">
  import { plotScatter } from "./dist/mini-plots.js";

  const csv = `title,x,y
Experiment A,1,3
Experiment A,2,5
Experiment B,1,2
Experiment B,2,6`;

  await plotScatter("#chart", { csv }, {
    title: "Experiment observations",
    xLabel: "Trial",
    yLabel: "Reading"
  });
</script>
```

### CSV URL

```js
import { plotLine } from "./dist/mini-plots.js";

await plotLine(document.querySelector("#chart"), { url: "./results.csv" }, {
  width: 720,
  height: 420,
  title: "Experiment trend"
});
```

CSV URL loading uses the browser's native `fetch()`. External CSV hosts must permit the request through their CORS policy.

### JavaScript dataset

```js
import { plotScatter, plotLine } from "./dist/mini-plots.js";

const dataset = {
  "Experiment A": [{ x: 1, y: 3 }, { x: 2, y: 5 }],
  "Experiment B": [{ x: 1, y: 2 }, { x: 2, y: 6 }]
};

await plotScatter("#scatter", dataset);
await plotLine("#line", dataset, { xLabel: "Trial", yLabel: "Reading" });
```

MiniPlots copies normalized point data and does not mutate the input object.

## Data format and validation

CSV requires a header row containing `title`, `x`, and `y`. Column order may vary and additional columns are ignored.

```csv
title,x,y
Experiment A,1,3
Experiment A,2,5
Experiment B,1,2
Experiment B,2,6
```

The parser supports standard double-quoted fields, embedded commas and line breaks, doubled-quote escapes, UTF-8 BOMs, CRLF/LF line endings, and blank lines. It rejects malformed quoting, inconsistent row widths, missing columns, empty titles, and nonnumeric coordinates.

For JavaScript data, each property name is a nonempty series title. Its value must be a nonempty point array. Every `x` and `y` must already be a finite number; numeric strings are rejected. Negative values and duplicate x-coordinates are valid. Line plots stably sort each series by ascending x without changing the source array. Constant-coordinate datasets are expanded to a visible numeric domain.

Errors reject the returned promise with a descriptive `Error`. Parsing, validation, and SVG construction finish before the existing MiniPlots chart is replaced, so a failed update leaves the previous chart intact.

## Options

| Option | Type | Default | Meaning |
|---|---|---:|---|
| `width` | number | `640` | Positive finite SVG design width |
| `height` | number | `400` | Positive finite SVG design height |
| `title` | string | `""` | Optional chart and accessible title |
| `xLabel` | string | `"X"` | Horizontal axis label |
| `yLabel` | string | `"Y"` | Vertical axis label |

The SVG includes a `viewBox`, an accessible name, axes, numeric ticks, and a legend when more than one series is present. Rendering a new MiniPlots chart in a container replaces its previous MiniPlots SVG while preserving unrelated children.

## Development

Use Node.js 24 and npm. The first install creates or refreshes the lockfile; routine clean installs use the lockfile.

```sh
npm ci
npm run dev
```

Vite prints the local demo URL. Open it over HTTP rather than using `file://`, because module imports and CSV fetching require a web origin.

Available commands:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite demo development server |
| `npm test` | Run all Vitest/jsdom tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build:lib` | Build `dist/mini-plots.js` |
| `npm run build:demo` | Build the library and complete static site |
| `npm run build` | Build and verify every artifact |
| `npm run preview` | Serve the production demo locally |

Tests cover CSV edge cases, normalization, validation, scaling, SVG safety, both plot modes, URL fetching, rerender behavior, and failed-update atomicity.

## Production build

```sh
npm ci
npm test
npm run build
```

The standalone `dist/mini-plots.js` file is a self-contained ES module with no unresolved imports, code chunks, companion CSS, or runtime package dependencies. The build verifier confirms that its only exports are `plotScatter` and `plotLine` and that the Pages output contains all required files.

## GitHub Pages deployment

The tracked workflow at `.github/workflows/ci.yml` runs for pull requests to `main` and pushes to `main`. It uses Node.js 24, installs with `npm ci`, tests, builds, verifies artifacts, and—only after a successful push build—deploys `site/` with the official Pages actions. Failed tests or builds prevent a new deployment, leaving the prior successful Pages version in place.

The repository owner must perform this one-time setup:

1. In **Settings → Actions → General**, ensure GitHub Actions and the official actions used by the workflow are allowed.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push or merge the implementation into `main`.
4. Inspect **Actions → Verify and deploy** and confirm both jobs succeed.

Once deployed, the expected URLs are:

- Demo: `https://cse210-team05.github.io/Warmup-Plotting-Library/`
- ES module: `https://cse210-team05.github.io/Warmup-Plotting-Library/mini-plots.js`

A separate HTTP-served browser project can then import it directly:

```js
import { plotLine } from "https://cse210-team05.github.io/Warmup-Plotting-Library/mini-plots.js";

await plotLine("#chart", {
  "Series A": [{ x: 1, y: 2 }, { x: 2, y: 4 }]
});
```

Verify the public module URL returns JavaScript rather than an HTML error page before depending on it. GitHub Pages deployment is not live merely because this workflow exists.

## Known MVP limitations

- Numeric linear axes only; date/time and categorical axes are not supported.
- No animation, zooming, interaction, live updates, or multiple axes.
- The fixed palette repeats after eight series.
- Legends do not currently wrap very long names or large series counts.
- CSV is loaded from text or URL; there is no upload widget.
- No automated npm publishing or versioned CDN release is configured.

## Remaining repository-owner tasks

1. Install Node.js 24 and confirm `git --version`, `node --version`, and `npm --version`.
2. Run `npm ci`, `npm test`, `npm run build`, and `npm run dev`; visually inspect both demo plots.
3. Commit the project on a feature branch where practical, push it, and open a pull request to `main`.
4. Enable permitted GitHub Actions and select GitHub Actions as the Pages source.
5. Confirm verification and deployment jobs succeed after merge/push to `main`.
6. Visit both public URLs above and test the hosted module from a separate HTTP-served page.
7. Recommended: protect `main`, require the successful verification check, and prevent force pushes.
8. Optional after verification: create a `v0.1.0` tag. Do not configure npm publishing yet.