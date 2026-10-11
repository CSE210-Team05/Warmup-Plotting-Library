import { describe, expect, it } from "vitest";
import { normalizeData } from "../src/data/normalize.js";
import { validateDataset, validateOptions } from "../src/data/validate.js";

describe("normalization and validation", () => {
  it("normalizes CSV and title-keyed objects equivalently without mutation", async () => {
    const objectData = { A: [{ x: 1, y: 2 }], B: [{ x: -3, y: 4 }, { x: -3, y: 5 }] };
    const snapshot = structuredClone(objectData);
    const objectResult = await normalizeData(objectData);
    const csvResult = await normalizeData({ csv: "title,x,y\nA,1,2\nB,-3,4\nB,-3,5" });
    expect(objectResult).toEqual(csvResult);
    expect(objectData).toEqual(snapshot);
    expect(objectResult[0].points).not.toBe(objectData.A);
  });

  it("keeps series independent", async () => {
    const normalized = await normalizeData({ A: [{ x: 1, y: 2 }], B: [{ x: 3, y: 4 }] });
    normalized[0].points[0].x = 99;
    expect(normalized[1].points[0].x).toBe(3);
  });

  it.each([
    [{}, "Dataset must contain at least one series"],
    [{ A: [] }, 'Series "A" must contain at least one point'],
    [{ "": [{ x: 1, y: 2 }] }, "must have a nonempty title"],
    [{ A: [{ y: 2 }] }, "is missing x"],
    [{ A: [{ x: "1", y: 2 }] }, "Invalid x coordinate"],
    [{ A: [{ x: 1, y: Number.POSITIVE_INFINITY }] }, "Invalid y coordinate"],
  ])("rejects invalid object data %#", async (input, message) => {
    await expect(normalizeData(input).then(validateDataset)).rejects.toThrow(message);
  });

  it("accepts negative and duplicate coordinates", async () => {
    const series = await normalizeData({ A: [{ x: -1, y: -2 }, { x: -1, y: 3 }] });
    expect(validateDataset(series)).toEqual(series);
  });

  it("applies option defaults and validates dimensions", () => {
    expect(validateOptions()).toMatchObject({ width: 640, height: 400, xLabel: "X", yLabel: "Y" });
    expect(() => validateOptions({ width: 0 })).toThrow("Width must be a positive finite number");
    expect(() => validateOptions({ height: Number.NaN })).toThrow("Height must be a positive finite number");
    expect(() => validateOptions({ type: "scatter" })).toThrow("Plot type is selected by");
  });
});
