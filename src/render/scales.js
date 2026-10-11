export function extent(values) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Scale values must be a nonempty array of finite numbers");
  }
  let minimum = values[0];
  let maximum = values[0];
  for (const value of values.slice(1)) {
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  if (minimum === maximum) {
    const padding = Math.max(Math.abs(minimum) * 0.05, 0.5);
    return [minimum - padding, maximum + padding];
  }
  return [minimum, maximum];
}

export function linearScale([domainMinimum, domainMaximum], [rangeMinimum, rangeMaximum]) {
  const domainSpan = domainMaximum - domainMinimum;
  const rangeSpan = rangeMaximum - rangeMinimum;
  return (value) => rangeMinimum + ((value - domainMinimum) / domainSpan) * rangeSpan;
}

export function createTicks([minimum, maximum], count = 5) {
  return Array.from({ length: count }, (_, index) => minimum + ((maximum - minimum) * index) / (count - 1));
}

export function formatTick(value) {
  if (Object.is(value, -0) || Math.abs(value) < 1e-12) {
    return "0";
  }
  const magnitude = Math.abs(value);
  if (magnitude >= 1e6 || magnitude < 1e-4) {
    return value.toExponential(2);
  }
  return Number(value.toPrecision(5)).toString();
}
