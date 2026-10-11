const DEFAULT_OPTIONS = Object.freeze({
  width: 640,
  height: 400,
  title: "",
  xLabel: "X",
  yLabel: "Y",
});

export function validateDataset(series) {
  if (!Array.isArray(series) || series.length === 0) {
    throw new Error("Dataset must contain at least one series");
  }

  for (let seriesIndex = 0; seriesIndex < series.length; seriesIndex += 1) {
    const entry = series[seriesIndex];
    if (!entry || typeof entry.title !== "string" || entry.title.trim() === "") {
      throw new Error(`Series ${seriesIndex + 1} must have a nonempty title`);
    }
    if (!Array.isArray(entry.points) || entry.points.length === 0) {
      throw new Error(`Series "${entry.title}" must contain at least one point`);
    }
    for (let pointIndex = 0; pointIndex < entry.points.length; pointIndex += 1) {
      const point = entry.points[pointIndex];
      for (const coordinate of ["x", "y"]) {
        if (!point || !Object.prototype.hasOwnProperty.call(point, coordinate)) {
          throw new Error(
            `Point ${pointIndex + 1} in series "${entry.title}" is missing ${coordinate}`,
          );
        }
        if (typeof point[coordinate] !== "number" || !Number.isFinite(point[coordinate])) {
          throw new Error(
            `Invalid ${coordinate} coordinate at point ${pointIndex + 1} in series "${entry.title}"`,
          );
        }
      }
    }
  }
  return series;
}

export function validateOptions(options = {}) {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("Plot options must be an object");
  }
  if (Object.prototype.hasOwnProperty.call(options, "type")) {
    throw new Error("Plot type is selected by plotScatter() or plotLine(), not options.type");
  }

  const normalized = { ...DEFAULT_OPTIONS, ...options };
  for (const dimension of ["width", "height"]) {
    if (typeof normalized[dimension] !== "number" || !Number.isFinite(normalized[dimension]) || normalized[dimension] <= 0) {
      throw new Error(`${dimension[0].toUpperCase()}${dimension.slice(1)} must be a positive finite number`);
    }
  }
  for (const label of ["title", "xLabel", "yLabel"]) {
    if (typeof normalized[label] !== "string") {
      throw new Error(`${label} must be a string`);
    }
  }
  return normalized;
}

export { DEFAULT_OPTIONS };
