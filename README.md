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
  - [Countries](#countries)
    - [Trim list of countries](#trim-list-of-countries)
    - [Store country names and codes together](#store-country-names-and-codes-together)
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

Now navigate into the `spotify-scraper` folder with `cd spotify-scraper`, install 3rd-party dependencies with `npm install`, run the program with `node src/main.js`, and follow the prompts.

At the moment, it saves the data in blocks of 25 countries. The resulting file is called `spotify-prices.csv` and can be found in this folder (`spotify-scraper`), the root directory of the project. (An previously-made example is provided as `spotify-prices-example.csv` to illustrate the format without being overwritten.)

If anything goes wrong while scraping a block, you can run the program again and choose which block of countries to start from when prompted. (In earlier versions, it would sometimes stall, but this hasn't been an issue since switching dependencies from Puppeteer to the lighter-weight Axios.) To stop the program, press Ctrl+C. Try Ctrl+C a few times if it's not responding.

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

## Possible further developments

### Tests

Write tests, including some basic reality checks, especially before making any modifications: unit tests, an integration test that diffs the resulting file against against some reference data, ...

### Error handling

Switch to TypeScript to spot bugs sooner.

Make error handling more thorough and more consistent: maybe use try/catch throughout instead of sometimes returning the string "error". Maybe log `error.stack` to print a stack trace by default for all errors except known, acceptable sorts of error, such as a HTTP response of 429 (too many requests). Consider whether to print errors in place and/or on being caught. Perhaps write a panic function to exit with a stack trace unless there's a good reason not to. Add asserts.

Handle file-system errors, especially errors associated with writing the results.

A log file could be saved with a more detailed error report, showing whether the data for each country was obtained, if not, whether that was because the page was not found or the price or currency couldn't be parsed.

### Countries

#### Trim list of countries

If some countries are never needed, they could be removed from the list to speed up the search.

#### Store country names and codes together

Store them in one object to make it easier to catch discrepancies.

### Performance

#### Tinker with concurrency parameters

The variable `pLimit` in the function `scrapeSection` (in `src/scrape/scrape-section.js`) determines the number of concurrent (simultaneous) requests being made to the website. A HTTP status code of 429 (too-many requests) indicates that we're being rate-limited. As `pLimit` is raised, such errors proliferate.

The number of attempts per country is determined by the variable `tries` in the function `scrapeWithRetry` (in `src/scrape/scrape-with-retry.js`). This can be adjusted together with `pLimit`.

They're currently set to `pLimit = 4` and `tries = 9`.

You can also adjust the pause delay between retries in `scrapeWithRetry`. It's currently set to `const delay = Math.min(1000 * i, 4000);`, which means try again after 1s, then 2s, ... , up to a maximum of 4s for all remaining attempts.

These parameters generally result in a handful of 429s per 25-country section. Increasing `plimit` to 9, for example, is perfectly viable, and makes the whole process satisfyingly faster, but results in significantly more 429s.

So as not to cause further disruption, I'll leave these experiments for now. In the future, I could investigate test servers, public APIs, and sandboxed environments designed for learning purposes. Wikipedia has been suggested as a scraper-friendly website that encourages experimentation, with clear rate-limiting guidelines.

#### Rewrite in a compiled language

The program could be rewritten in Go or Rust, for the better performance, type-safety, thread-safety, error handling, and for the convenience of being able to share it by just sharing an executable file.

That said, the main limiting factor may be the network and how many requests Spotify's own server is able and willing to process per unit of time.

#### Benchmark

Benchmark before and after any performance-related experiment.

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
