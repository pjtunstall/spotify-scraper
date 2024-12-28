export default async function retryFailedCountries(browser, failedCountries) {
  let retryPromises = [];

  for (let { country, url } of failedCountries) {
    retryPromises.push(retryCountry(browser, country, url));
  }

  let results = await Promise.all(retryPromises);
  results.forEach((data, index) => {
    if (data) {
      console.log(`Retry success for ${failedCountries[index].country}`);
      results += data + "\n";
    } else {
      console.log(`Retry failed for ${failedCountries[index].country}`);
    }
  });
}

async function retryCountry(browser, country, url) {
  let delay = 1000;
  let attempt = 0;

  while (attempt < retries) {
    try {
      let data = await scrapeCountry(browser, country, url);
      if (data !== "error") {
        return data;
      }
    } catch (error) {
      console.error(
        `Retry attempt ${attempt + 1} failed for ${country}: ${error.message}`
      );
    }

    attempt++;
    await pause(delay);
    delay *= 2;
  }

  return null;
}
