import axios from "axios";
import * as cheerio from "cheerio";

import getCurrency from "./get-currency.js";
import formatCommaOrDot from "./format-comma-or-dot.js";

export default async function scrapeCountry(country, url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

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
    if (error.response) {
      console.error(
        `Failed to load page for ${country}. HTTP status: ${error.response.status}`
      );
    } else if (error.request) {
      console.error(`No response received for ${url}.`);
    } else {
      console.error(`Unexpected error: ${error.message}`);
    }
    return "error";
  }
}
