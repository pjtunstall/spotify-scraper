import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

import codes from "../../data/codes.js";
import countries from "../../data/countries.js";
import scrapeSection from "./scrape-section.js";

export default async function scrape(option) {
  const failedCountries = [];
  const sections = [
    [0, 25],
    [25, 50],
    [50, 75],
    [75, 100],
    [100, 125],
    [125, 150],
    [150, 175],
    [176, 200],
    [200, codes.length],
  ];

  for (let i = option; i < sections.length; i++) {
    const [start, end] = sections[i];

    const { results, failedCountriesInThisSection } = await scrapeSection(
      start,
      end
    );

    if (results === null) {
      break;
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.resolve(__dirname, "../../spotify-prices.csv"); // Relative to this file.
    fs.appendFileSync(filePath, results);
    console.log(`Saved results for ${countries[start]}-${countries[end - 1]}.`);
    if (failedCountriesInThisSection.length === 0) {
      console.log("All these countries successfully scraped.");
    } else {
      failedCountries.push(...failedCountriesInThisSection);
    }
  }

  if (failedCountries.length == 0) {
    console.log("\nList finished: All countries successfully scraped.");
  } else {
    console.log("\nList finished: Altogether, the following countries failed:");
    console.log(failedCountries.join(", "));
  }
}
