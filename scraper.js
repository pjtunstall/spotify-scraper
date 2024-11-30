const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

const codes = require("./codes.js");
const countries = require("./countries.js");

let results = "";

scrapeEmAll();

function getCurrency(country, text) {
  switch (country) {
    case "Argentina":
      return "ARS";

    case "Australia":
    case "Nauru":
    case "Kiribati":
    case "Tuvalu":
      return "AUD";

    case "Bangladesh":
      return "BDT";

    case "Belarus":
    case "Georgia":
    case "Kazakhstan":
    case "Kuwait":
    case "Kyrgistan":
    case "Marshall Islands":
    case "Moldova":
    case "Oman":
    case "Tajikistan":
    case "United States":
    case "Ukraine":
    case "Uzbekistan":
    case "Zambia":
      return "USD";

    case "Brazil":
      return "BRL";
    case "Bulgaria":
      return "BGN";
    case "Canada":
      return "CAD";
    case "Chile":
      return "CLP";
    case "Colombia":
      return "COP";
    case "Czech Republic":
      return "CZK";
    case "Denmark":
      return "DKK";
    case "Egypt":
      return "EGP";
    case "Ghana":
      return "GHS";
    case "Hong Kong":
      return "HKD";
    case "Hungary":
      return "HUF";
    case "Iraq":
      return "IQD";
    case "Israel":
      return "ILS";
    case "India":
      return "INR";
    case "Indonesia":
      return "IDR";
    case "Japan":
      return "JPY";
    case "Kenya":
      return "KES";
    case "Liechtenstein":
      return "CHF";
    case "Malaysia":
      return "MYR";
    case "Mexico":
      return "MXN";
    case "Morocco":
      return "MAD";
    case "New Zealand":
      return "NZD";
    case "Nigeria":
      return "NGN";
    case "Norway":
      return "NOK";
    case "Pakistan":
      return "PKR";
    case "Peru":
      return "PEN";
    case "Philippines":
      return "PHP";
    case "Poland":
      return "PLN";
    case "Qatar":
      return "QAR";
    case "Romania":
      return "RON";
    case "Saudi Arabia":
      return "SAR";
    case "Singapore":
      return "SGD";
    case "South Africa":
      return "ZAR";
    case "South Korea":
      return "KRW";
    case "Sri Lanka":
      return "LKR";
    case "Sweden":
      return "SEK";
    case "Switzerland":
      return "CHF";
    case "Taiwan":
      return "TWD";
    case "Tanzania":
      return "TZS";
    case "Thailand":
      return "THB";
    case "Tunisia":
      return "TND";
    case "Turkey":
      return "TRY";
    case "Uganda":
      return "UGX";
    case "United Arab Emirates":
      return "AED";
    case "United Kingdom":
      return "GBP";
    case "Vietnam":
      return "VND";

    default:
      if (/US\$|\$US/.test(text)) {
        return "USD";
      } else if (/€/.test(text)) {
        return "EUR";
      } else if (/£/.test(text)) {
        return "GBP";
      }
      return "";
  }
}

async function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function scrapeEmAll() {
  const browser = await puppeteer.launch();

  const sections = [
    [0, 25],
    [25, 50],
    [50, 75],
    [75, 100],
    [100, 125],
    [125, 150],
    [150, 175],
    [175, 200],
    [200, codes.length],
  ];

  for (let i = 0; i < sections.length; i++) {
    results = "";
    const [start, end] = sections[i];
    if ((await scrapeSection(browser, start, end)) === 1) {
      break;
    }
    fs.appendFileSync("spotify_prices.csv", results);
    console.log(`Results for section ${start} to ${end} saved.`);
    await pause(10000);
  }

  console.log("Waiting for browser to close...");
  await browser.close();
  console.log("Browser closed.");
}

async function scrapeSection(browser, start, end) {
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

    let count = 0;
    let result = await scrapeSpotifyPrice(browser, country, url);
    if (result === "error") {
      if (count === 0) {
        count++;
        console.log(`Retrying ${country}...`);
        await pause(30000);
        result = await scrapeSpotifyPrice(browser, country, url);
        continue;
      } else {
        console.log("Retry failed. Calling it a day.");
        return 1;
      }
    }
    if (result !== "not found") {
      results += `${country},${result}\n`;
      continue;
    }

    console.log(`${country} not found, trying with /${code}-en/..`);
    url = `https://spotify.com/${code}-en/premium/`;
    result = await scrapeSpotifyPrice(browser, country, url);
    results += `${country},${result}\n`;

    if (result === "") {
      console.log(`${country} not found even with /${code}-en/...`);
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

async function scrapeSpotifyPrice(browser, country, url) {
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
        return `${normalizedPrice},${currency},${text}`;
      } else {
        return `,,${text}`;
      }
    }
  } catch (error) {
    console.error(
      `Error occurred while navigating to the page: ${error.message}`
    );
    return "error";
  }
}
