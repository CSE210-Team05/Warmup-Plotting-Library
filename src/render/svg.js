import { createTicks, extent, formatTick, linearScale } from "./scales.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const COLORS = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#be185d", "#4d7c0f"];
let chartSequence = 0;

function svgElement(name, attributes = {}, text = null) {
  const element = document.createElementNS(SVG_NAMESPACE, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  if (text !== null) {
    element.textContent = text;
  }
  return element;
}

function append(parent, name, attributes = {}, text = null) {
  const child = svgElement(name, attributes, text);
  parent.append(child);
  return child;
}

function renderAxes(svg, layout, domains, scales, options) {
  const axes = append(svg, "g", { class: "axes", fill: "none", stroke: "#64748b" });
  append(axes, "line", {
    class: "x-axis",
    x1: layout.left,
    y1: layout.bottom,
    x2: layout.right,
    y2: layout.bottom,
  });
  append(axes, "line", {
    class: "y-axis",
    x1: layout.left,
    y1: layout.top,
    x2: layout.left,
    y2: layout.bottom,
  });

  const xTicks = append(svg, "g", { class: "x-ticks", fill: "#475569", "font-size": 11 });
  for (const tick of createTicks(domains.x)) {
    const x = scales.x(tick);
    append(xTicks, "line", { x1: x, y1: layout.bottom, x2: x, y2: layout.bottom + 5, stroke: "#64748b" });
    append(xTicks, "text", { x, y: layout.bottom + 18, "text-anchor": "middle" }, formatTick(tick));
  }

  const yTicks = append(svg, "g", { class: "y-ticks", fill: "#475569", "font-size": 11 });
  for (const tick of createTicks(domains.y)) {
    const y = scales.y(tick);
    append(yTicks, "line", { x1: layout.left - 5, y1: y, x2: layout.left, y2: y, stroke: "#64748b" });
    append(yTicks, "text", { x: layout.left - 9, y: y + 4, "text-anchor": "end" }, formatTick(tick));
  }

  append(svg, "text", {
    class: "x-label",
    x: (layout.left + layout.right) / 2,
    y: options.height - options.height * 0.025,
    "text-anchor": "middle",
    fill: "#0f172a",
    "font-size": 13,
  }, options.xLabel);

  append(svg, "text", {
    class: "y-label",
    x: -((layout.top + layout.bottom) / 2),
    y: options.width * 0.025,
    transform: "rotate(-90)",
    "text-anchor": "middle",
    fill: "#0f172a",
    "font-size": 13,
  }, options.yLabel);
}

function renderLegend(svg, series, layout, options) {
  if (series.length < 2) {
    return;
  }
  const legend = append(svg, "g", { class: "legend", transform: `translate(${layout.right + options.width * 0.035} ${layout.top})` });
  series.forEach((entry, index) => {
    const y = index * 20;
    append(legend, "rect", { x: 0, y: y - 9, width: 11, height: 11, rx: 2, fill: COLORS[index % COLORS.length] });
    append(legend, "text", { x: 17, y, fill: "#334155", "font-size": 11 }, entry.title);
  });
}

function renderScatter(marks, series, scales) {
  series.forEach((entry, seriesIndex) => {
    const group = append(marks, "g", { class: "series scatter-series", "data-series": entry.title });
    for (const point of entry.points) {
      append(group, "circle", {
        class: "point",
        cx: scales.x(point.x),
        cy: scales.y(point.y),
        r: 4,
        fill: COLORS[seriesIndex % COLORS.length],
      });
    }
  });
}

function renderLines(marks, series, scales) {
  series.forEach((entry, seriesIndex) => {
    const color = COLORS[seriesIndex % COLORS.length];
    const sortedPoints = entry.points
      .map((point, index) => ({ point, index }))
      .sort((left, right) => left.point.x - right.point.x || left.index - right.index)
      .map(({ point }) => point);
    const group = append(marks, "g", { class: "series line-series", "data-series": entry.title });

    if (sortedPoints.length === 1) {
      append(group, "circle", {
        class: "line-point",
        cx: scales.x(sortedPoints[0].x),
        cy: scales.y(sortedPoints[0].y),
        r: 4,
        fill: color,
      });
      return;
    }

    append(group, "polyline", {
      class: "line",
      points: sortedPoints.map((point) => `${scales.x(point.x)},${scales.y(point.y)}`).join(" "),
      fill: "none",
      stroke: color,
      "stroke-width": 2.5,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    });
  });
}

export function renderChart(series, options, type) {
  const allPoints = series.flatMap((entry) => entry.points);
  const domains = {
    x: extent(allPoints.map((point) => point.x)),
    y: extent(allPoints.map((point) => point.y)),
  };

  const layout = {
    left: options.width * 0.13,
    right: options.width * (series.length > 1 ? 0.72 : 0.94),
    top: options.height * (options.title ? 0.16 : 0.08),
    bottom: options.height * 0.82,
  };
  const scales = {
    x: linearScale(domains.x, [layout.left, layout.right]),
    y: linearScale(domains.y, [layout.bottom, layout.top]),
  };

  const titleId = `mini-plots-title-${chartSequence += 1}`;
  const accessibleTitle = options.title || `${type === "scatter" ? "Scatter" : "Line"} plot`;
  const svg = svgElement("svg", {
    "data-miniplots-chart": "",
    class: `mini-plots mini-plots-${type}`,
    width: options.width,
    height: options.height,
    viewBox: `0 0 ${options.width} ${options.height}`,
    role: "img",
    "aria-labelledby": titleId,
    preserveAspectRatio: "xMidYMid meet",
    style: "max-width:100%;height:auto;font-family:system-ui,sans-serif",
  });
  append(svg, "title", { id: titleId }, accessibleTitle);
  append(svg, "rect", { width: options.width, height: options.height, fill: "#ffffff", rx: 8 });

  if (options.title) {
    append(svg, "text", {
      class: "chart-title",
      x: options.width / 2,
      y: options.height * 0.075,
      "text-anchor": "middle",
      fill: "#0f172a",
      "font-size": 17,
      "font-weight": 650,
    }, options.title);
  }

  renderAxes(svg, layout, domains, scales, options);
  const marks = append(svg, "g", { class: "marks" });
  if (type === "scatter") {
    renderScatter(marks, series, scales);
  } else if (type === "line") {
    renderLines(marks, series, scales);
  } else {
    throw new Error(`Unsupported plot type: ${type}`);
  }
  renderLegend(svg, series, layout, options);
  return svg;
}
