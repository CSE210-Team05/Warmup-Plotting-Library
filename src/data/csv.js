function isBlankRecord(record) {
  return record.length === 1 && record[0].trim() === "";
}

/**
 * Parse CSV text into rows while supporting RFC-style quoted fields.
 * Empty physical rows are omitted; line breaks inside quoted fields are retained.
 */
export function parseCSVRecords(source) {
  if (typeof source !== "string") {
    throw new Error("CSV input must be a string");
  }

  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  if (text.trim() === "") {
    throw new Error("CSV input is empty");
  }

  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;
  let afterQuote = false;
  let line = 1;

  const finishRecord = () => {
    record.push(field);
    if (!isBlankRecord(record)) {
      records.push(record);
    }
    record = [];
    field = "";
    afterQuote = false;
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else if (character === "\r" && text[index + 1] === "\n") {
        field += "\n";
        index += 1;
        line += 1;
      } else {
        field += character;
        if (character === "\n" || character === "\r") {
          line += 1;
        }
      }
      continue;
    }

    if (afterQuote) {
      if (character === ",") {
        record.push(field);
        field = "";
        afterQuote = false;
      } else if (character === "\n" || character === "\r") {
        finishRecord();
        if (character === "\r" && text[index + 1] === "\n") {
          index += 1;
        }
        line += 1;
      } else if (character !== " " && character !== "\t") {
        throw new Error(`Malformed CSV at line ${line}: unexpected character after closing quote`);
      }
      continue;
    }

    if (character === '"') {
      if (field !== "") {
        throw new Error(`Malformed CSV at line ${line}: quote must begin a field`);
      }
      inQuotes = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      finishRecord();
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      line += 1;
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error(`Malformed CSV at line ${line}: unclosed quoted field`);
  }

  if (record.length > 0 || field !== "" || !afterQuote) {
    finishRecord();
  }

  if (records.length === 0) {
    throw new Error("CSV input is empty");
  }

  return records;
}

export function parseCSV(source) {
  const records = parseCSVRecords(source);
  const headers = records[0].map((header) => header.trim());

  for (const required of ["title", "x", "y"]) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required CSV column: ${required}`);
    }
    if (headers.indexOf(required) !== headers.lastIndexOf(required)) {
      throw new Error(`Duplicate CSV column: ${required}`);
    }
  }

  const seriesByTitle = new Map();
  for (let rowIndex = 1; rowIndex < records.length; rowIndex += 1) {
    const row = records[rowIndex];
    const displayRow = rowIndex + 1;
    if (row.length !== headers.length) {
      throw new Error(
        `Inconsistent CSV field count at row ${displayRow}: expected ${headers.length}, received ${row.length}`,
      );
    }

    const title = row[headers.indexOf("title")].trim();
    if (title === "") {
      throw new Error(`Series title must not be empty at row ${displayRow}`);
    }

    const point = {};
    for (const coordinate of ["x", "y"]) {
      const rawValue = row[headers.indexOf(coordinate)].trim();
      const value = rawValue === "" ? Number.NaN : Number(rawValue);
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid numeric value at row ${displayRow}, column ${coordinate}`);
      }
      point[coordinate] = value;
    }

    if (!seriesByTitle.has(title)) {
      seriesByTitle.set(title, []);
    }
    seriesByTitle.get(title).push(point);
  }

  if (seriesByTitle.size === 0) {
    throw new Error("Dataset must contain at least one series");
  }

  return Array.from(seriesByTitle, ([title, points]) => ({ title, points }));
}
