import fs from "fs";
import puppeteer from "puppeteer";
import codes from "./codes.js";
import countries from "./countries.js";
import scrapeSection from "./scrape/scrape-section.js";

export default async function scrape(option) {
  let browser = await puppeteer.launch();
  let results = "";

  let sections = [
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

  let failedCountries = [];

  for (let i = option; i < sections.length; i++) {
    results = "";
    let [start, end] = sections[i];

    const { combinedResults, failedCountries: failed } = await scrapeSection(
      browser,
      start,
      end
    );

    if (combinedResults === null) {
      break;
    }

    results += combinedResults;
    fs.appendFileSync("spotify_prices.csv", results);
    console.log(`Saved results for ${countries[start]}-${countries[end - 1]}.`);

    failedCountries.push(...failed);

    if (failedCountries.length === 0) {
      console.log("All countries successfully scraped.");
    }
  }

  console.log("Waiting for browser to close...");
  await browser.close();
  console.log("Browser closed.");
}
