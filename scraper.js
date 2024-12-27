import pLimit from "p-limit";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

import fs from "fs";
import readline from "readline";

import { codes } from "./codes.js";
import { countries } from "./countries.js";
import { getCurrency } from "./currency.js";

let results = "";
let failedCountries = [];
let utterlyFailedCountries = [];
let retries = 3;

main();

function main() {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (!fs.existsSync("spotify_prices.csv")) {
    menu(rl);
  } else {
    console.log("File `spotify_prices.csv` already exists!");
    console.log(
      "If you choose to proceed, the new data will be appended to the existing file."
    );
    console.log("What's it to be? (y/n)");

    rl.question("> ", (answer) => {
      answer = answer.toLowerCase();
      if (answer === "yes" || answer == "y") {
        console.log("Proceeding...");
        menu(rl);
      } else {
        console.log("Exiting...");
        rl.close();
        process.exit();
      }
    });
  }
}

function menu(rl) {
  console.log("Which country do you want to start from?");
  console.log(`0. ${countries[0]}-${countries[24]}
1. ${countries[25]}-${countries[49]}
2. ${countries[50]}-${countries[74]}
3. ${countries[75]}-${countries[99]}
4. ${countries[100]}-${countries[124]}
5. ${countries[125]}-${countries[149]}
6. ${countries[150]}-${countries[174]}
7. ${countries[175]}-${countries[199]}
8. ${countries[200]}-${countries[countries.length - 1]}`);

  console.log(
    "(We'll try to scrape the data for all listed countries, but some pages may not exist.)"
  );

  rl.question("> ", (input) => {
    let option = Number(input.trim());
    if (isNaN(option) || option < 0 || option > 8) {
      console.log("Invalid input. Please enter a number between 0 and 8.");
      menu(rl);
    } else {
      scrapeEmAll(option);
      rl.close();
    }
  });
}

async function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function scrapeEmAll(option) {
  let browser = await puppeteer.launch();

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

  for (let i = option; i < sections.length; i++) {
    results = "";
    let [start, end] = sections[i];
    if ((await scrapeSection(browser, start, end)) === 1) {
      break;
    }
    fs.appendFileSync("spotify_prices.csv", results);
    console.log(`Saved results for ${countries[start]}-${countries[end - 1]}.`);
    if (utterlyFailedCountries.length == 0) {
      console.log("All countries successfully scraped.");
    } else {
      console.log("Failed to scrape:");
      for (const utterlyFailedCountry of utterlyFailedCountries) {
        console.log(utterlyFailedCountry);
      }
    }
  }

  console.log("Waiting for browser to close...");
  await browser.close();
  console.log("Browser closed.");
}

function isEnglishVersion(country) {
  return (
    country === "Egypt" ||
    country === "Iraq" ||
    country === "Jordan" ||
    country == "Libya" ||
    country === "Saudi Arabia" ||
    country === "Oman"
  );
}

function formatCommaOrDot(input) {
  // Match the main number and the decimal part (if any).
  return input.replace(/(\d+)([.,])(\d{2,3})$/, (_, p1, sep, p3) => {
    // If there are exactly three digits after the separator, use a comma.
    if (p3.length === 3) {
      return p1 + "," + p3;
    }
    // If there are exactly two digits after the separator, use a dot.
    else if (p3.length === 2) {
      return p1 + "." + p3;
    }
    // Default case: leave as is.
    return _;
  });
}

async function scrapeSection(browser, start, end) {
  console.log();
  console.log(`Scraping ${countries[start]}-${countries[end - 1]}...`);

  let limit = pLimit(2);
  let promises = [];

  for (let i = start; i < end; i++) {
    let code = codes[i];
    let country = countries[i];

    let url = isEnglishVersion(country)
      ? `https://www.spotify.com/${code}-en/premium/`
      : `https://www.spotify.com/${code}/premium/`;

    promises.push(
      limit(() => scrapeWithRetry(browser, country, url, failedCountries))
    );
  }

  try {
    let resultsArray = await Promise.all(promises);
    resultsArray.forEach((data) => {
      if (data) {
        results += data + "\n";
      }
    });

    console.log(
      `First try completed for ${countries[start]}-${countries[end - 1]}.`
    );

    if (failedCountries.length > 0) {
      console.log("Retrying failed countries...");
      await retryFailedCountries(browser, failedCountries);
    }
  } catch (error) {
    console.error(`Scraping failed for some countries: ${error.message}`);
    return 1;
  }
}

async function scrapeWithRetry(browser, country, url) {
  try {
    let data = await scrapeCountry(browser, country, url);
    if (data === "error") {
      console.log(`Retrying ${country}...`);
      await pause(1000);
      data = await scrapeCountry(browser, country, url);
      if (data === "error") {
        utterlyFailedCountries.push(country);
        throw new Error(
          `Failed to scrape ${country} after ${retries} retries.`
        );
      }
    }
    console.log(`${country} scraped successfully: ${data}`);
    return data;
  } catch (error) {
    console.error(`Error scraping ${country}: ${error.message}`);
    return "error";
  }
}

async function retryFailedCountries(browser, failedCountries) {
  let retryPromises = [];

  for (let { country, url } of failedCountries) {
    retryPromises.push(retryCountry(browser, country, url));
  }

  let results = await Promise.all(retryPromises);
  results.forEach((data, index) => {
    if (data) {
      console.log(`Retry success for ${failedCountries[index].country}`);
      results += data + "\n";
    } else {
      console.log(`Retry failed for ${failedCountries[index].country}`);
    }
  });
}

async function retryCountry(browser, country, url) {
  let delay = 1000;
  let attempt = 0;

  while (attempt < retries) {
    try {
      let data = await scrapeCountry(browser, country, url);
      if (data !== "error") {
        return data;
      }
    } catch (error) {
      console.error(
        `Retry attempt ${attempt + 1} failed for ${country}: ${error.message}`
      );
    }

    attempt++;
    await pause(delay);
    delay *= 2;
  }

  return null;
}

async function scrapeCountry(browser, country, url) {
  let page = await browser.newPage();

  try {
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["stylesheet", "image", "font"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    let response = await page.goto(url, { waitUntil: "domcontentloaded" });

    if (!response.ok()) {
      console.error(
        `Failed to load page for ${country}. HTTP status: ${response.status()}`
      );
      return "error";
    }

    let content = await page.content();
    let $ = cheerio.load(content);

    let text = $("#plan-premium-individual .sc-71cce616-6").text().trim();
    let priceNumber = text.match(/(\d+(?:[.,]\d+)*)/);
    let extractedPrice = priceNumber ? priceNumber[1] : null;
    let currency = getCurrency(country, text);

    if (extractedPrice) {
      let normalizedPrice = formatCommaOrDot(extractedPrice);
      // console.log(`${country}: ${normalizedPrice} ${currency},\t"${text}"`);
      return `"${country}","${normalizedPrice}","${currency}","${text}"`;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`${error.message} while scraping ${url} (${country}).`);
    return "error";
  }
}
