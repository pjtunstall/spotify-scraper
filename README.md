# Spotify Scraper

A program for scraping Spotify premium individual plan price data for all countries.

At the moment, it saves the data in blocks of 25 countries, pausing for a few seconds in between in the hope that this will evade rate limiting better. If it times out while trying to get the data for a country, i.e. takes longer than 30s, then it waits for another 30s before trying one more time. This usually works.

If you want to start afresh, delete or remove any existing `spotify_prices.cvs` file in this folder before running the script. The reason I haven't automated this yet is so that you can restart the program if it times out, commenting out the `sections` (blocks) that have already been completed. You may need to manually place add a new line between the previously completed section and the new ones. Eventually all of that can be automated.

An alternative, shown below, would be to save each line as the data is fetched. This might be slower--I'm not sure by how much--but would make it convenient to just name the country you want to restart from if it didn't managed to get them all in one go. But this is significantly slower. A country that takes about 3s might take 6s. To try it, replace these two functions in the existing version.

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
