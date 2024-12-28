# Spotify Scraper

## Contents

- [What is it?](#what-is-it?)
- [Usage](#usage)
- [Structure](#structure)
  - [Internal call graph](#internal-call-graph)
  - [File structure](#file-structure)
- [A note on concurency](#a-note-on-concurrency)
- [Further](#further)
  - [Extend to other streaming services](#extend-to-other-streaming-services)
  - [Error report](#error-report)
  - [Trim list of countries](#trim-list-of-countries)
  - [Store country names and codes together](#store-country-names-and-codes-together)
  - [Tests](#tests)
  - [Compiled language](#compiled-language)
  - [Benchmarking](#benchmarking)
  - [Respect the Robots](#respect-the-robots)

## What is it?

A program for scraping Spotify premium individual plan price data for all countries.

## Usage

Preliminaries: you need to have [Node.js](https://nodejs.org/en/download) installed. This is an environment that will let you run JavaScript outside of a browser. To start the program, follow these steps: open a terminal and navigate into the folder where you want to download the project using `cd` (e.g. `cd Desktop/spotify-scraper`). Download it with the command

```
git clone https://github.com/pjtunstall/spotify-scraper
```

Now navigate into the `spotify-scraper` folder with `cd spotify-scraper`, install 3rd-party dependencies with `npm install`, run the program with `node src/main.js`, and follow the prompts.

At the moment, it saves the data in blocks of 25 countries. The resulting file is called `spotify-prices.csv` and can be found in this folder (`spotify-scraper`), the root directory of the project.

If anything goes wrong (such as extreme delays), you can run the program again and choose which block of countries to start from when prompted. To stop the program, press Ctrl+C. Try Ctrl+C a few times if it's not responding.

If you want to start afresh, delete or remove any existing `spotify-prices.cvs` file before running the script.

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

## A note on concurrency

The variable `pLimit` in the function `scrapeSection` (in `src/scrape/scrape-section.js`) determines the number of concurrent (simultaneous) requests being made to the website. Low values seem to do best, e.g. 1-3. A response of HTTP 429 (too-many requests) indicates that we're being rate-limited. It's not clear to me whether concurrency offers any gain in speed overall. As `pLimit` is raised, such errors proliferate.

The number of retries per country is determined by the variable `retries` in the function `scrapeWithRetry` (in `src/scrape/scrape-with-retry.js`). This can be adjusted together with `pLimit`.

They're currently set to `pLimit = 2` and `retries = 5`.

## Further

### Extend to other streaming services

See how they present price data and how the program could be generalized. At present, many individual quirks of Spotify are dealt with as special cases, but some of could be parametrized; e.g. if every provider has its own list of which countries use USD, those lists could be imported and applied at the relevant place.

Of course, if a company provided an API to access the data directly, this would simplify things.

### Error report

A log file could be saved with a more detailed error report, showing whether the data for each country was obtained, if not, whether that was because the page was not found or the price or currency couldn't be parsed.

### Trim list of countries

If some countries are never needed, they could be removed from the list to speed up the search.

### Store country names and codes together

Store them in one object to make it easier to catch discrepancies.

### Tests

Unit tests, some basic reality checks, etc., especially before making any modifications.

### Compiled language

The program could be rewritten in a compiled language, such as Go or Rust, for better performance (speed) and for the convenience of being able to share it by just sharing an executable file. (Python is an interpreted language, like JavaScript, so it needs a runtime environment too.)

Go is generally faster that JavaScript and Python, and Rust fastest of all.

That said, the main limiting factor seems to be the network and how many requests Spotify's own server is able and willing to process per unit of time.

### Benchmarking

Benchmark before and after any performance-related experiment.

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
