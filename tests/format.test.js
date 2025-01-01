import formatCommaOrDot from "../src/scrape/format-comma-or-dot.js";

describe("formatCommaOrDot function", () => {
  test("expect 1,000 to be 1,000", () => {
    expect(formatCommaOrDot("1,000")).toBe("1,000");
  });

  test("expect 1.000 to be 1,000", () => {
    expect(formatCommaOrDot("1.000")).toBe("1,000");
  });

  test("expect 1.00 to be 1.00", () => {
    expect(formatCommaOrDot("1.00")).toBe("1.00");
  });

  test("expect 1,00 to be 1.00", () => {
    expect(formatCommaOrDot("1,00")).toBe("1.00");
  });
});
