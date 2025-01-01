import axios from "axios";
import * as cheerio from "cheerio";

import getCurrency from "./get-currency.js";
import formatCommaOrDot from "./format-comma-or-dot.js";

export default async function scrapeCountry(country, code, url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const finalUrl = response.request.res.responseUrl;
    if (finalUrl !== url) {
      const regex = new RegExp(`\/${code}\/`);
      const match = finalUrl.match(regex);
      if (match) {
        console.warn(
          `No page for ${country} (${code}): Redirected from ${url} to ${finalUrl}`
        );
        return null;
      }
    }

    const data = response.data;
    const $ = cheerio.load(data);

    const text = $("#plan-premium-individual .sc-71cce616-6").text().trim();
    return formatPriceData(text, country);
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        throw new Error(
          `${error.message} (too many requests) while scraping ${url} (${country}).`
        );
      } else if (status === 404) {
        throw new Error(
          `${error.message} (resource not found) while scraping ${url} (${country}).`
        );
      } else if (status === 500) {
        throw new Error(
          `${error.message} (server error) while scraping ${url} (${country}).`
        );
      } else if (status === 502) {
        throw new Error(
          `${error.message} (bad gateway) while scraping ${url} (${country}).`
        );
      } else if (status === 503) {
        throw new Error(
          `${error.message} (service unavailable) while scraping ${url} (${country}).`
        );
      } else if (status === 401 || status === 403) {
        throw new Error(
          `${error.message} (unauthorized/forbidden access) while scraping ${url} (${country}).`
        );
      }
    } else if (error.request) {
      throw new Error(`No response received for ${url} (${country})`);
    } else {
      console.error(
        `Unexpected error: ${error.message} while scraping ${url} (${country})`
      );
      console.error(error.stack);
      process.exit(1);
    }
  }
}

export function formatPriceData(text, country) {
  const priceNumber = text.match(/(\d+(?:[.,]\d+)*)/);
  const extractedPrice = priceNumber ? priceNumber[1] : null;
  const currency = getCurrency(country, text);

  if (extractedPrice) {
    let normalizedPrice = formatCommaOrDot(extractedPrice);
    return `"${country}","${normalizedPrice}","${currency}","${text}"`;
  } else {
    return null;
  }
}
