import * as cheerio from "cheerio";

import getCurrency from "./get-currency.js";
import formatCommaOrDot from "./format-comma-or-dot.js";

export default async function scrapeCountry(browser, country, url) {
  const page = await browser.newPage();

  try {
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["stylesheet", "image", "font"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const response = await page.goto(url, { waitUntil: "domcontentloaded" });

    if (!response.ok()) {
      console.error(
        `Failed to load page for ${country}. HTTP status: ${response.status()}`
      );
      return "error";
    }

    const content = await page.content();
    const $ = cheerio.load(content);

    const text = $("#plan-premium-individual .sc-71cce616-6").text().trim();
    const priceNumber = text.match(/(\d+(?:[.,]\d+)*)/);
    const extractedPrice = priceNumber ? priceNumber[1] : null;
    const currency = getCurrency(country, text);

    if (extractedPrice) {
      let normalizedPrice = formatCommaOrDot(extractedPrice);
      return `"${country}","${normalizedPrice}","${currency}","${text}"`;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`${error.message} while scraping ${url} (${country}).`);
    return "error";
  }
}
