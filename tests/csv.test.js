import { describe, expect, it } from "vitest";
import { parseCSV, parseCSVRecords } from "../src/data/csv.js";

describe("CSV parsing", () => {
  it("parses valid data and groups multiple titles", () => {
    expect(parseCSV("title,x,y\nA,1,2\nB,3,4\nA,5,6")).toEqual([
      { title: "A", points: [{ x: 1, y: 2 }, { x: 5, y: 6 }] },
      { title: "B", points: [{ x: 3, y: 4 }] },
    ]);
  });

  it("supports quoted commas, escaped quotes, and quoted newlines", () => {
    const records = parseCSVRecords('title,notes,x,y\n"A, one","said ""hello""\non two lines",1,2');
    expect(records[1]).toEqual(["A, one", 'said "hello"\non two lines', "1", "2"]);
    expect(parseCSV('title,x,y\n"A, one",1,2')[0].title).toBe("A, one");
  });

  it("handles a BOM, CRLF, empty lines, reordered columns, and numeric whitespace", () => {
    expect(parseCSV("\uFEFFy,title,x\r\n\r\n 2 ,A, -1 \r\n")).toEqual([
      { title: "A", points: [{ x: -1, y: 2 }] },
    ]);
  });

  it.each([
    ["title,x\nA,1", "Missing required CSV column: y"],
    ['title,x,y\n"A,1,2', "unclosed quoted field"],
    ['title,x,y\nA"bad,1,2', "quote must begin a field"],
    ["title,x,y\nA,nope,2", "Invalid numeric value at row 2, column x"],
    ["title,x,y\nA,1", "Inconsistent CSV field count at row 2"],
    ["", "CSV input is empty"],
  ])("rejects invalid CSV %#", (input, message) => {
    expect(() => parseCSV(input)).toThrow(message);
  });
});
