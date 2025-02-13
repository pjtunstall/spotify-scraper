# Spotify Scraper

## Contents

- [What is it?](#what-is-it?)
- [Usage](#usage)
- [Structure](#structure)
  - [Internal call graph](#internal-call-graph)
  - [File structure](#file-structure)
- [A note on concurency](#a-note-on-concurrency)
- [Possible further developments](#possible-further-developments)
  - [Tests](#tests)
  - [Error handling](#error-handling)
  - [Reduce dependencies](#reduce-dependencies)
  - [Countries](#countries)
    - [Trim list of countries](#trim-list-of-countries)
    - [Store country names and codes together](#store-country-names-and-codes-together)
  - [Tidy CLI](#tidy-cli)
  - [Tidy writes](#tidy-writes)
  - [Performance](#performance)
    - [Tinker with concurrency parameters](#tinker-with-concurrency-parameters)
    - [Rewrite in a compiled language](#rewrite-in-a-compiled-language)
    - [Benchmark](#benchmark)
  - [Extend to other streaming services](#extend-to-other-streaming-services)
  - [Respect the Robots](#respect-the-robots)

## What is it?

A program for scraping Spotify premium individual plan price data for all countries.

## Usage

Make sure you have [Node.js](https://nodejs.org/en/download) installed. Then follow these steps: open a terminal and navigate into the folder where you want to download the project using `cd` (e.g. `cd Desktop/spotify-scraper`). Download it with the command

```
git clone https://github.com/pjtunstall/spotify-scraper
```

Now navigate into the `spotify-scraper` folder with `cd spotify-scraper`, install 3rd-party dependencies with `npm install`, and follow further instructions to fix any vulnerabilities found in the dependencies if possible. Run the program with `node src/main.js`, and follow the prompts.

At the moment, it saves the data in blocks of 25 countries. The resulting file is called `spotify-prices.csv` and can be found in this folder (`spotify-scraper`), the root directory of the project. (An previously-made example is provided as `spotify-prices-example.csv` to illustrate the format without being overwritten.)

If anything goes wrong while scraping a block, you can run the program again and choose which block of countries to start from when prompted. (In earlier versions, it would sometimes stall, but this hasn't been an issue since switching dependencies from Puppeteer to the lighter-weight Axios.) To stop the program, press Ctrl+C. Try Ctrl+C a few times if it doesn't respond at first.

If you want to start afresh, delete or remove any existing `spotify-prices.cvs` file before running the script.

To run the tests, enter `npm test`.

## Structure

### Internal call graph

```
main
└── menu
    └── scrape
            scrapeSection
                └── scrapeWithRetry
                        ├── scrapeCountry
                        |       ├── getCurrency
                        |       └── formatCommaOrDot
                        └── pause
```

### File structure

```
spotify-scraper/
├── data/
│   ├── codes.js
│   └── countries.js
└── src/
    ├── main.js
    ├── menu.js
    └──scrape/
        ├── format-comma-or-dot.js
        ├── get-currency.js
        ├── pause.js
        ├── scrape-country.js
        ├── scrape-section.js
        ├── scrape-with-retry.js
        └── scrape.js
```

## Possible further developments

### Tests

Add more tests, including some basic reality checks, especially before making any modifications: unit tests. This could mean splitting up some functions so that individual actions can be isolated for testing.

Currently there are just two unit tests, both of which check formatting functions, and one integration test, which calls `scrape(0)` to scrape all countries, then compares the results against reference results, scraped previously.

### Error handling

Switch to TypeScript to spot bugs sooner.

Handle file-system errors, especially errors associated with writing the results.

A log file could be saved with a more detailed error report, showing whether the data for each country was obtained, if not, whether that was because the page was not found or the price or currency couldn't be parsed.

Note that, although I do defensively check for various HTTP status codes indicating an error, Spotify doesn't actually return a 404 HTTP response when no page for a particular country exists. Instead, it redirects to a placeholder page with a URL that includes some default or previously-tried country's code, along with the searched-for code. Thus, here is the URL that results when we're redirected from the non-existent Cayman Island's page to a placeholder in Azerbaijani:

```
https://www.spotify.com/az-az/ky/premium/
```

Compare this format to the URL that results when we're redirected from `https://www.spotify.com/az/premium/` to the to the useful page with Azerbaijan's price data in Azerbaijani:

```
https://www.spotify.com/az-az/premium/
```

The `az-az` is to distinguish it from `az-en` in `https://www.spotify.com/az-en/premium/` (the English-language page for Azerbaijan).

As these examples illustrate, redirect target pages that contain actual price data include the searched-for country code, followed by a dash, then a two-letter code code indicating the language, all between a pair of forward slashes. Placeholder pages, by contrast, put the searched-for code on its own between forward slashes. This is how I'm identifying when no page for the country was found.

In fact, the only HTTP error code I've seen so far is 429 (too many requests). See `scrape-country.js`.

### Reduce dependencies

Replace `p-limit` with a custom queue of Promise-returning functions, carefully respecting the subtleties of timing mentioned in their comments.

### Countries

#### Trim list of countries

If some countries are never needed, they could be removed from the list to speed up the search.

#### Store country names and codes together

Store them in one object to make it easier to catch discrepancies.

### Tidy CLI

We could probably dispense with the menu of options for where to restart scraping. This is a holdover from early versions when I was using Puppeteer and the scraping process was lengthy prone to crashes.

### Tidy writes

If dispensing with the menu, the scraping could be done all in one go. There could be an option to rewrite any pre-existing `spotify-prices.csv`, first writing to a temprary file, then renaming it after confirmation that it worked.

### Performance

#### Tinker with concurrency parameters

The variable `pLimit` in the function `scrapeSection` (in `src/scrape/scrape-section.js`) determines the number of concurrent (simultaneous) requests being made to the website. A HTTP status code of 429 (too-many requests) indicates that we're being rate-limited. As `pLimit` is increased, such errors proliferate.

The number of attempts per country is determined by the variable `tries` in the function `scrapeWithRetry` (in `src/scrape/scrape-with-retry.js`). This can be adjusted together with `pLimit`.

They're currently set to `pLimit = 2` and `tries = 9`. This has always successfully scraped all countries and typically results in between one and five 429 errors per section of 25 countries. Increasing `pLimit` to 9, for example, is perfectly viable, and makes the whole process satisfyingly faster, but results in significantly more 429s.

You can also adjust the pause delay between retries in `scrapeWithRetry`. It's currently set to `const delay = Math.min(1000 * i, 4000);`, which means try again after 1s, then 2s, ... , up to a maximum of 4s for all remaining attempts.

So as not to cause further disruption, I'll leave these experiments for now. In the future, I could investigate test servers, public APIs, and sandboxed environments designed for learning purposes. Wikipedia has been suggested as a scraper-friendly website that encourages experimentation, with clear rate-limiting guidelines.

#### Rewrite in a compiled language

The program could be rewritten in Go or Rust, for the better performance, type-safety, thread-safety, error handling, and for the convenience of being able to share it by just sharing an executable file.

That said, the main limiting factor seems to be how many requests Spotify's own server is able and willing to process per unit of time.

#### Benchmark

Benchmark before and after any performance-related experiment. (Less relevant now I've realized that, as mentioned in the previous section, the main speed bump comes from Spotify's own rate-limiting.)

### Extend to other streaming services

See how they present price data and how the program could be generalized. At present, many individual quirks of Spotify are dealt with as special cases, but some of could be parametrized; e.g. if every provider has its own list of which countries use USD, those lists could be imported and applied at the relevant place.

Of course, if a company provided an API to access the data directly, this would simplify things.

### Respect the Robots

Whether repeating with Spotify or extending to other sites, continue to scrape ethically and respect the guidelines as laid out in the robots.txt. In [Spotify](https://www.spotify.com/robots.txt)'s case:

```
User-agent: *
Disallow: /_/about-us/contact/contact-spotify-password/
Disallow: /_/about-us/contact/contact-spotify-account/
Disallow: /_/get-spotify/_
Disallow: /_/xhr/_
Disallow: /_/external/_
Disallow: /_/legal/_?ets=
Disallow: /_/legal/advertiser-terms-and-conditions/
Disallow: /_/legal/gdpr-article-15-information/
Disallow: /_/legal/spotify-controller-data-processing-terms/
Disallow: /_/account/cls/_
Disallow: /_/starbuckspartners
Disallow: /starbuckspartners
Disallow: /ppt/_?
Disallow: /partner/_?
Sitemap: https://www.spotify.com/sitemap.xml
```
