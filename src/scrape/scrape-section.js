import pLimit from "p-limit";
import codes from "../../data/codes.js";
import countries from "../../data/countries.js";
import scrapeWithRetry from "./scrape-with-retry.js";

export default async function scrapeSection(start, end) {
  console.log();
  console.log(`Scraping ${countries[start]}-${countries[end - 1]}...`);

  const limit = pLimit(5); // Limit to 5 concurrent requests.
  const promises = [];
  const failedCountriesThisSection = [];

  for (let i = start; i < end; i++) {
    const code = codes[i];
    const country = countries[i];

    let url = isEnglishVersion(country)
      ? `https://www.spotify.com/${code}-en/premium/`
      : `https://www.spotify.com/${code}/premium/`;

    promises.push(
      limit(() => scrapeWithRetry(country, url, failedCountriesThisSection))
    );
  }

  try {
    const resultsArray = await Promise.allSettled(promises);

    let results = "";
    resultsArray.forEach(({ status, value, reason }) => {
      if (status === "fulfilled" && value.data) {
        results += value.data + "\n";
      }
      if (status === "rejected") {
        console.error(`Error processing: ${reason.message}`);
      }
    });

    console.log(
      `Completed scraping ${countries[start]}-${countries[end - 1]}.`
    );

    if (failedCountriesThisSection.length > 0) {
      console.log(
        "These countries failed after all retries and won't be retried:"
      );
      console.log(failedCountriesThisSection.join(", "));
    }

    return { results, failedCountriesThisSection };
  } catch (error) {
    console.error(`Scraping failed unexpectedly: ${error.message}`);
    return { results: null, failedCountriesThisSection };
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
