import pause from "./pause.js";
import scrapeCountry from "./scrape-country.js";

export default async function scrapeWithRetry(
  browser,
  country,
  url,
  failedCountries
) {
  let retries = 5;
  let data = "error";

  for (let i = 0; i < retries; i++) {
    try {
      data = await scrapeCountry(browser, country, url);

      if (data === "error") {
        console.log(`Retrying ${country}...`);
        await pause(1000);
      } else {
        console.log(`${country} scraped successfully: ${data}`);
        return { data, failedCountries };
      }
    } catch (error) {
      console.error(`Error scraping ${country}: ${error.message}`);
      break;
    }
  }

  failedCountries.push(country);
  throw new Error(`Failed to scrape ${country} after ${retries} retries.`);
}
