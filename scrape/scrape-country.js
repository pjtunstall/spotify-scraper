import * as cheerio from "cheerio";

import getCurrency from "../currency.js";
import formatCommaOrDot from "./format.js";

export default async function scrapeCountry(browser, country, url) {
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
      return `"${country}","${normalizedPrice}","${currency}","${text}"`;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`${error.message} while scraping ${url} (${country}).`);
    return "error";
  }
}
