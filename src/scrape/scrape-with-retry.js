import pause from "./pause.js";
import scrapeCountry from "./scrape-country.js";

export default async function scrapeWithRetry(
  country,
  code,
  url,
  failedCountriesInThisSection
) {
  const tries = 9;
  let data = "error";

  for (let i = 1; i <= tries; i++) {
    try {
      data = await scrapeCountry(country, code, url);
      console.log(`${country} (${code}) scraped successfully: ${data}`);
      return { data, failedCountriesInThisSection };
    } catch (error) {
      console.error(error.message);
      if (!error.message.includes("429")) {
        break; // Don't try again unless failure is due to rate-limiting.
      }
      const suffix = i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th";
      console.log(`Retrying ${country}... (${i}${suffix} attempt)`);
      const delay = Math.min(1000 * i, 4000);
      await pause(delay);
      continue;
    }
  }

  failedCountriesInThisSection.push(country);
  throw new Error(`Resigning attempts to scrape ${country} (${code}).`);
}
