import { formatPriceData } from "../src/scrape/scrape-country.js";

describe("formatPriceData", () => {
  it("formats price data", () => {
    const priceData = formatPriceData("2,99 $US/mois ensuite", "Comoros");
    expect(priceData).toBe('"Comoros","2.99","USD","2,99 $US/mois ensuite"');
  });

  it("handles missing price data", () => {
    const priceData = formatPriceData("", "country");
    expect(priceData).toBeNull();
  });
});
