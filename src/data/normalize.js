import { parseCSV } from "./csv.js";

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeObjectDataset(data) {
  return Object.entries(data).map(([title, points]) => {
    if (!Array.isArray(points)) {
      throw new Error(`Series "${title}" must be an array of points`);
    }
    return {
      title,
      points: points.map((point, index) => {
        if (!isPlainObject(point)) {
          throw new Error(`Point ${index + 1} in series "${title}" must be an object`);
        }
        const normalizedPoint = {};
        if (Object.prototype.hasOwnProperty.call(point, "x")) {
          normalizedPoint.x = point.x;
        }
        if (Object.prototype.hasOwnProperty.call(point, "y")) {
          normalizedPoint.y = point.y;
        }
        return normalizedPoint;
      }),
    };
  });
}

export async function normalizeData(data) {
  if (!isPlainObject(data)) {
    throw new Error("Plot data must be a CSV input object or a title-keyed dataset");
  }

  const hasCsv = Object.prototype.hasOwnProperty.call(data, "csv");
  const hasUrl = Object.prototype.hasOwnProperty.call(data, "url");

  if (hasCsv || hasUrl) {
    if (hasCsv && hasUrl) {
      throw new Error('Provide exactly one CSV source: "csv" or "url"');
    }
    const allowedKey = hasCsv ? "csv" : "url";
    if (Object.keys(data).some((key) => key !== allowedKey)) {
      throw new Error(`CSV ${allowedKey} input cannot include dataset series`);
    }

    if (hasCsv) {
      return parseCSV(data.csv);
    }

    if (typeof data.url !== "string" || data.url.trim() === "") {
      throw new Error("CSV URL must be a nonempty string");
    }

    let response;
    try {
      response = await fetch(data.url);
    } catch (error) {
      throw new Error(`Failed to fetch CSV URL ${data.url}: ${error.message}`, { cause: error });
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV URL ${data.url}: HTTP ${response.status}`);
    }
    return parseCSV(await response.text());
  }

  return normalizeObjectDataset(data);
}
