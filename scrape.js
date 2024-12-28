import fs from "fs";
import puppeteer from "puppeteer";
import codes from "./codes.js";
import countries from "./countries.js";
import scrapeSection from "./scrape/scrape-section.js";

export default async function scrape(option) {
  const browser = await puppeteer.launch();
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

    const { results, failedCountriesThisSection } = await scrapeSection(
      browser,
      start,
      end
    );

    if (results === null) {
      break;
    }

    fs.appendFileSync("spotify_prices.csv", results);
    console.log(`Saved results for ${countries[start]}-${countries[end - 1]}.`);

    failedCountries.push(...failedCountriesThisSection);

    if (failedCountries.length === 0) {
      console.log("All countries successfully scraped.");
    }
  }

  if (failedCountries.length != 0) {
    console.log(
      "Altogether, these countries failed after all retries and won't be retried:"
    );
    console.log(failedCountries.join(", "));
  }

  console.log("Waiting for browser to close...");
  await browser.close();
  console.log("Browser closed.");
}
