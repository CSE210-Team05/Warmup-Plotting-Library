import { describe, expect, it } from "vitest";
import { renderChart } from "../src/render/svg.js";
import { validateOptions } from "../src/data/validate.js";

const options = validateOptions({ title: "Results", xLabel: "Input", yLabel: "Output" });

describe("SVG rendering", () => {
  it("renders one scatter circle for every point, axes, and labels", () => {
    const svg = renderChart([
      { title: "A", points: [{ x: -1, y: 2 }, { x: 2, y: 4 }] },
      { title: "B", points: [{ x: 0, y: -3 }] },
    ], options, "scatter");
    expect(svg.querySelectorAll("circle.point")).toHaveLength(3);
    expect(svg.querySelectorAll("polyline")).toHaveLength(0);
    expect(svg.querySelector(".x-axis")).not.toBeNull();
    expect(svg.querySelector(".y-axis")).not.toBeNull();
    expect(svg.querySelector(".x-label").textContent).toBe("Input");
    expect(svg.querySelector(".y-label").textContent).toBe("Output");
  });

  it("renders one polyline per multi-point series with distinct colors", () => {
    const svg = renderChart([
      { title: "A", points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] },
      { title: "B", points: [{ x: 1, y: 2 }, { x: 2, y: 3 }] },
    ], options, "line");
    const lines = [...svg.querySelectorAll("polyline.line")];
    expect(lines).toHaveLength(2);
    expect(lines[0].getAttribute("stroke")).not.toBe(lines[1].getAttribute("stroke"));
  });

  it("sorts line points by ascending x with stable ties", () => {
    const svg = renderChart([
      { title: "A", points: [{ x: 3, y: 30 }, { x: 1, y: 10 }, { x: 1, y: 20 }, { x: 2, y: 25 }] },
    ], options, "line");
    const coordinates = svg.querySelector("polyline").getAttribute("points").split(" ").map((pair) => pair.split(",").map(Number));
    expect(coordinates.map(([x]) => x)).toEqual([...coordinates.map(([x]) => x)].sort((a, b) => a - b));
    expect(coordinates[0][1]).toBeGreaterThan(coordinates[1][1]);
  });

  it("renders constant-value data and single-point line series visibly", () => {
    const svg = renderChart([{ title: "A", points: [{ x: 4, y: -2 }] }], options, "line");
    const point = svg.querySelector("circle.line-point");
    expect(point).not.toBeNull();
    expect(Number.isFinite(Number(point.getAttribute("cx")))).toBe(true);
    expect(Number.isFinite(Number(point.getAttribute("cy")))).toBe(true);
  });

  it("places malicious-looking titles into text nodes, not markup", () => {
    const unsafe = '<script data-attack="true">bad()</script>';
    const svg = renderChart([{ title: unsafe, points: [{ x: 1, y: 2 }] }], validateOptions({ title: unsafe }), "scatter");
    expect(svg.querySelector("script")).toBeNull();
    expect(svg.querySelector("title").textContent).toBe(unsafe);
  });
});
