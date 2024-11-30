const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const readline = require("readline");

const codes = require("./codes.js");
const countries = require("./countries.js");
const getCurrency = require("./currency.js");

let results = "";

main();

function main() {
  const rl = readline.createInterface({
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
    const option = Number(input.trim());
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
  const browser = await puppeteer.launch();

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
    results = "";
    const [start, end] = sections[i];
    if ((await scrapeSection(browser, start, end)) === 1) {
      break;
    }
    fs.appendFileSync("spotify_prices.csv", results);
    console.log(`Saved results for ${countries[start]}-${countries[end - 1]}.`);
    await pause(10000);
  }

  console.log("Waiting for browser to close...");
  await browser.close();
  console.log("Browser closed.");
}

async function scrapeSection(browser, start, end) {
  console.log();
  console.log(`Scraping ${countries[start]}-${countries[end - 1]}...`);

  for (let i = start; i < end; i++) {
    const code = codes[i];
    const country = countries[i];

    let url;
    if (
      country === "Egypt" ||
      country === "Iraq" ||
      country === "Jordan" ||
      country == "Libya" ||
      country === "Saudi Arabia" ||
      country === "Oman"
    ) {
      url = `https://www.spotify.com/${code}-en/premium/`;
    } else {
      url = `https://www.spotify.com/${code}/premium/`;
    }

    let data = await scrapeCountry(browser, country, url);
    if (data === "error") {
      console.log(`Retrying ${country}...`);
      await pause(30000);
      data = await scrapeCountry(browser, country, url);
      if (data === "error") {
        return 1;
      }
    }

    if (data) {
      results += data + "\n";
    }
  }
}

function formatCommaOrDot(input) {
  // Match the main number and the decimal part (if any)
  return input.replace(/(\d+)([.,])(\d{2,3})$/, (_, p1, sep, p3) => {
    // If there are exactly three digits after the separator, use a comma
    if (p3.length === 3) {
      return p1 + "," + p3;
    }
    // If there are exactly two digits after the separator, use a dot
    else if (p3.length === 2) {
      return p1 + "." + p3;
    }
    // Default case: leave as is
    return _;
  });
}

async function scrapeCountry(browser, country, url) {
  const page = await browser.newPage();

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded" });

    if (!response.ok()) {
      console.error(`Failed to load page. HTTP status: ${response.status()}`);
    } else {
      const content = await page.content();
      const $ = cheerio.load(content);

      const text = $("#plan-premium-individual .sc-71cce616-6").text().trim();
      const priceNumber = text.match(/(\d+(?:[.,]\d+)*)/);
      const extractedPrice = priceNumber ? priceNumber[1] : null;
      const currency = getCurrency(country, text);

      if (extractedPrice) {
        // If there are three digits after a comma or dot, it becomes a comma.
        // If there are two digits after a comma or dot, it becomes a dot.
        let normalizedPrice = formatCommaOrDot(extractedPrice);
        console.log(`${country}: ${normalizedPrice} ${currency},\t"${text}"`);
        return `"${country}","${normalizedPrice}","${currency}","${text}"`;
      } else {
        return;
      }
    }
  } catch (error) {
    console.error(`${error.message} while scraping ${url} (${country}).`);
    return "error";
  }
}
