import { normalizeData } from "./data/normalize.js";
import { validateDataset, validateOptions } from "./data/validate.js";
import { renderChart } from "./render/svg.js";

function resolveContainer(container) {
  if (typeof container === "string") {
    let element;
    try {
      element = document.querySelector(container);
    } catch (error) {
      throw new Error(`Invalid plot container selector: ${container}`, { cause: error });
    }
    if (!element) {
      throw new Error(`Plot container not found: ${container}`);
    }
    return element;
  }
  if (typeof Element !== "undefined" && container instanceof Element) {
    return container;
  }
  throw new Error("Plot container must be a CSS selector or DOM element");
}

async function createPlot(type, container, data, options) {
  const target = resolveContainer(container);
  const normalizedOptions = validateOptions(options);
  const series = validateDataset(await normalizeData(data));
  const svg = renderChart(series, normalizedOptions, type);

  for (const previousChart of target.querySelectorAll(":scope > svg[data-miniplots-chart]")) {
    previousChart.remove();
  }
  target.append(svg);
  return svg;
}

export function plotScatter(container, data, options = {}) {
  return createPlot("scatter", container, data, options);
}

export function plotLine(container, data, options = {}) {
  return createPlot("line", container, data, options);
}
