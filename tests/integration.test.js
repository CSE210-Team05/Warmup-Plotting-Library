import { afterEach, describe, expect, it, vi } from "vitest";
import * as MiniPlots from "../src/index.js";

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("public API", () => {
  it("exports exactly the two plotting functions", () => {
    expect(Object.keys(MiniPlots).sort()).toEqual(["plotLine", "plotScatter"]);
  });

  it("plots object data in both modes and returns SVG elements", async () => {
    document.body.innerHTML = '<div id="one"></div><div id="two"></div>';
    const data = { A: [{ x: 1, y: 2 }, { x: 2, y: 3 }] };
    const scatter = await MiniPlots.plotScatter("#one", data);
    const line = await MiniPlots.plotLine(document.querySelector("#two"), data);
    expect(scatter).toBeInstanceOf(SVGSVGElement);
    expect(scatter.querySelectorAll("circle.point")).toHaveLength(2);
    expect(line.querySelectorAll("polyline.line")).toHaveLength(1);
  });

  it("loads URL CSV with fetch", async () => {
    document.body.innerHTML = '<div id="chart"></div>';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("title,x,y\nRemote,1,2"),
    });
    vi.stubGlobal("fetch", fetchMock);
    const svg = await MiniPlots.plotScatter("#chart", { url: "/data.csv" });
    expect(fetchMock).toHaveBeenCalledWith("/data.csv");
    expect(svg.querySelectorAll("circle.point")).toHaveLength(1);
  });

  it("reports fetch failures clearly", async () => {
    document.body.innerHTML = '<div id="chart"></div>';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(MiniPlots.plotLine("#chart", { url: "/missing.csv" })).rejects.toThrow(
      "Failed to fetch CSV URL /missing.csv: HTTP 404",
    );
  });

  it("replaces only the previous MiniPlots chart", async () => {
    document.body.innerHTML = '<div id="chart"><p>Keep me</p></div>';
    const data = { A: [{ x: 1, y: 2 }] };
    await MiniPlots.plotScatter("#chart", data);
    await MiniPlots.plotLine("#chart", data);
    expect(document.querySelectorAll("#chart > svg[data-miniplots-chart]")).toHaveLength(1);
    expect(document.querySelector("#chart > p").textContent).toBe("Keep me");
  });

  it("leaves the previous chart intact when a later render fails", async () => {
    document.body.innerHTML = '<div id="chart"></div>';
    const original = await MiniPlots.plotScatter("#chart", { A: [{ x: 1, y: 2 }] });
    await expect(MiniPlots.plotLine("#chart", { A: [{ x: "bad", y: 2 }] })).rejects.toThrow("Invalid x coordinate");
    expect(document.querySelector("#chart > svg")).toBe(original);
  });

  it("reports missing and invalid containers", async () => {
    await expect(MiniPlots.plotScatter("#missing", { A: [{ x: 1, y: 2 }] })).rejects.toThrow(
      "Plot container not found: #missing",
    );
    await expect(MiniPlots.plotLine("[", { A: [{ x: 1, y: 2 }] })).rejects.toThrow(
      "Invalid plot container selector: [",
    );
  });
});
