import pLimit from "p-limit";
import codes from "../../data/codes.js";
import countries from "../../data/countries.js";
import scrapeWithRetry from "./scrape-with-retry.js";

export default async function scrapeSection(start, end) {
  console.log();
  console.log(`Scraping ${countries[start]}-${countries[end - 1]}...`);

  const limit = pLimit(2); // Limit to 2 concurrent requests.
  const promises = [];
  const failedCountriesInThisSection = [];
  const countriesInThisSection = countries.slice(start, end);

  countriesInThisSection.forEach((country, i) => {
    const code = codes[start + i];

    let url = isEnglishVersion(country)
      ? `https://www.spotify.com/${code}-en/premium/`
      : `https://www.spotify.com/${code}/premium/`;

    promises.push(
      limit(() =>
        scrapeWithRetry(country, code, url, failedCountriesInThisSection)
      )
    );
  });

  try {
    const resultsArray = await Promise.allSettled(promises);

    let results = "";
    resultsArray.forEach(({ status, value, reason_ }, i_) => {
      if (status === "fulfilled" && value.data) {
        results += value.data + "\n";
      }
    });

    console.log(
      `Completed scraping ${countries[start]}-${countries[end - 1]}.`
    );

    if (failedCountriesInThisSection.length > 0) {
      console.log(
        "For this section, the following countries failed and won't be tried again:"
      );
      console.log(failedCountriesInThisSection.join(", "));
    }

    return { results, failedCountriesInThisSection };
  } catch (error) {
    console.error(`Scraping failed unexpectedly: ${error.message}`);
    console.error(error.stack);
    return { results: null, failedCountriesInThisSection };
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
