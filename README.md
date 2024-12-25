# Spotify Scraper

## Overview

A program for scraping Spotify premium individual plan price data for all countries.

Preliminaries: you need to have [Node.js](https://nodejs.org/en/download) installed. This is an environment that will let you run JavaScript outside of a browser. To run, open a terminal and navigate to the folder that you want to download Spotify Scraper to. Clone this repo with `git clone https://github.com/pjtunstall/spotify-scraper`, navigate into the `spotify-scraper` folder, install the dependencies with `npm install`, then run `node scraper.js` and follow the prompts.

At the moment, it saves the data in blocks of 25 countries, pausing for a few seconds in between in the hope that this will evade rate limiting better. If it times out while trying to get the data for a country, i.e. takes longer than 30s, then it waits for another 30s before trying one more time. This usually works.

If anything goes wrong, e.g. the program crashes, or if you just need to stop the program for some reason, then you can run it again and choose which block of countries to start from when prompted. To stop the program, press Ctrl+C. Try it a few times if it's not responding.

If you want to start afresh, delete or remove any existing `spotify_prices.cvs` file in this folder before running the script.

An alternative, shown below, would be to save each line as the data is fetched. This would make it convenient to just name the individual country you want to restart from if it didn't managed to get them all in one go. But it is significantly slower. A country that takes about 3s might take 6s. To try it, replace these two functions in the existing version.

```javascript
async function scrapeSpotifyPrice(browser, country, url) {
  const page = await browser.newPage();

  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded" });

    if (!response.ok()) {
      console.error(`Failed to load page. HTTP status: ${response.status()}`);
      await page.close();
      return "error";
    }

    const content = await page.content();
    const $ = cheerio.load(content);

    const text = $("#plan-premium-individual .sc-71cce616-6").text().trim();
    const priceNumber = text.match(/(\d+(?:[.,]\d+)*)/);
    const extractedPrice = priceNumber ? priceNumber[1] : null;
    const currency = getCurrency(country, text);

    await page.close();

    if (extractedPrice) {
      let normalizedPrice = formatCommaOrDot(extractedPrice);
      console.log(`${country}: ${normalizedPrice} ${currency},\t"${text}"`);

      // Immediately write to CSV file
      const csvLine = `"${country}","${normalizedPrice}","${currency}","${text.replace(
        /"/g,
        '""'
      )}"\n`;
      fs.appendFileSync("spotify_prices.csv", csvLine);

      return `${normalizedPrice},${currency},${text}`;
    } else {
      return `,,${text}`;
    }
  } catch (error) {
    console.error(
      `Error occurred while navigating to the page: ${error.message}`
    );
    await page.close();
    return "error";
  }
}

async function scrapeEmAll() {
  const browser = await puppeteer.launch();

  try {
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      const country = countries[i];

      let url;
      if (
        country === "Egypt" ||
        country === "Iraq" ||
        country === "Jordan" ||
        country == "Libya" ||
        country === "Saudi Arabia" ||
        country === "Oman"
      ) {
        url = `https://www.spotify.com/${code}-en/premium/`;
      } else {
        url = `https://www.spotify.com/${code}/premium/`;
      }

      let result = await scrapeSpotifyPrice(browser, country, url);

      if (result === "error") {
        console.log(`Retrying ${country}...`);
        await pause(30000);
        result = await scrapeSpotifyPrice(browser, country, url);
      }

      if (result === "not found") {
        console.log(`${country} not found, trying with /${code}-en/..`);
        url = `https://spotify.com/${code}-en/premium/`;
        await scrapeSpotifyPrice(browser, country, url);
      }

      // Small pause between countries to avoid overwhelming the server
      await pause(2000);
    }
  } catch (error) {
    console.error("An error occurred during scraping:", error);
  } finally {
    console.log("Waiting for browser to close...");
    await browser.close();
    console.log("Browser closed.");
  }
}
```

## Further

### Extend to other streaming services

See how they present price data and how the program could be generalized. At present, many individual quirks of Spotify are dealt with as special cases, but some of could be parametrized; e.g. if every provider has its own list of which countries use USD, those lists could be imported and applied at the relevant place.

### Error report

A log file could be saved with a more detailed error report, showing whether a country was successfully scraped and, if not, whether the page was not found, or the price or currency not parsed.

### Trim list of countries

If some countries are never needed, they could be removed from the list to speed up the search.

### Store country names and codes together

... in one object to make it easier to catch discrepancies.

### Add tests

Unit tests, some basic reality checks, etc., especially before making any modifications.

### Compiled language

The program could be rewritten in a compiled language, such as Go or Rust, for better performance (speed) and for the convenience of being able to share it by just sharing an executable file. (Python is an interpreted language, like JavaScript, so it needs a runtime environment too.)

Go is generally faster that JavaScript and Python, and Rust fastest of all.

### Concurrency

At the risk of being rate-limited, the program could scrape multiple blocks of countries at the same time as each other, save each in a separate file as it's completed, then combine the files at the end. If the process is aborted, the next attempt could be restricted to just the remaining blocks. If done right, this should give some improvement in speed, unless network delays are the main limiting factor.

This can be done in JavaScript, Go, or Rust.

### Mitigation of rate-limiting

At present, the program has a 10s pause between blocks of coutries, and a 30s pause in case of error. We could experiment with different delays between blocks. Instead of treating all errors the same, it could respond to HTTP 429 (too-many request) errors by waiting, and trying again after a delay.
