import pause from "./pause.js";
import scrapeCountry from "./scrape-country.js";

export default async function scrapeWithRetry(country, url, failedCountries) {
  const tries = 9;
  let data = "error";

  for (let i = 1; i <= tries; i++) {
    try {
      data = await scrapeCountry(country, url);
      if (data === "error") {
        const suffix = i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th";
        console.log(`Retrying ${country}... (${i}${suffix} attempt)`);
        const delay = Math.min(1000 * i, 4000);
        await pause(delay);
        continue;
      } else {
        console.log(`${country} scraped successfully: ${data}`);
        return { data, failedCountries };
      }
    } catch (error) {
      console.error(`Error scraping ${country}: ${error.message}`);
      console.error(error.stack);
      break;
    }
  }

  failedCountries.push(country);
  throw new Error(`Failed to scrape ${country} after ${tries} tries.`);
}
