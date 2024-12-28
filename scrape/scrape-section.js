import pLimit from "p-limit";
import codes from "../codes.js";
import countries from "../countries.js";
import scrapeWithRetry from "./scrape-with-retry.js";

export default async function scrapeSection(browser, start, end) {
  console.log();
  console.log(`Scraping ${countries[start]}-${countries[end - 1]}...`);

  let limit = pLimit(2); // Limit to 2 concurrent requests.
  let promises = [];
  let failedCountries = [];

  for (let i = start; i < end; i++) {
    const code = codes[i];
    const country = countries[i];

    let url = isEnglishVersion(country)
      ? `https://www.spotify.com/${code}-en/premium/`
      : `https://www.spotify.com/${code}/premium/`;

    promises.push(
      limit(() => scrapeWithRetry(browser, country, url, failedCountries))
    );
  }

  try {
    let resultsArray = await Promise.allSettled(promises);

    let combinedResults = "";
    resultsArray.forEach(({ status, value, reason }) => {
      if (status === "fulfilled" && value.data) {
        combinedResults += value.data + "\n";
      }
      if (status === "rejected") {
        console.error(`Error processing: ${reason.message}`);
      }
    });

    console.log(
      `Completed scraping ${countries[start]}-${countries[end - 1]}.`
    );

    if (failedCountries.length > 0) {
      console.log(
        "These countries failed after all retries and won't be retried:"
      );
      console.log(failedCountries.join(", "));
    }

    return { combinedResults, failedCountries };
  } catch (error) {
    console.error(`Scraping failed unexpectedly: ${error.message}`);
    return { combinedResults: null, failedCountries };
  }
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
