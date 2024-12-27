# Spotify Scraper

## Overview

A program for scraping Spotify premium individual plan price data for all countries.

Preliminaries: you need to have [Node.js](https://nodejs.org/en/download) installed. This is an environment that will let you run JavaScript outside of a browser. To run, open a terminal and navigate to the folder that you want to download Spotify Scraper to. Clone this repo with `git clone https://github.com/pjtunstall/spotify-scraper`, navigate into the `spotify-scraper` folder, install the dependencies with `npm install`, then run `node scraper.js` and follow the prompts.

At the moment, it saves the data in blocks of 25 countries.

If anything goes wrong, you can run the program again and choose which block of countries to start from when prompted. To stop the program, press Ctrl+C. Try Ctrl+C a few times if it's not responding.

If you want to start afresh, delete or remove any existing `spotify_prices.cvs` file in this folder before running the script.

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

### Add tests

Unit tests, some basic reality checks, etc., especially before making any modifications.

### Compiled language

The program could be rewritten in a compiled language, such as Go or Rust, for better performance (speed) and for the convenience of being able to share it by just sharing an executable file. (Python is an interpreted language, like JavaScript, so it needs a runtime environment too.)

Go is generally faster that JavaScript and Python, and Rust fastest of all.

That said, the main limiting factor seems to be the network and how many requests Spotify's own server is able and willing to process per unit of time.

### Concurrency

The variable `pLimit` determines the number of concurrent (simultaneous) requests being made to the website. Low values seem to do best. A response of HTTP 429 (too-many requests) indicates that we're being rate-limited. It's not clear to me whether concurrency gains us any speed overall. As `pLimit` is raised, such errors proliferate.

### Benchmarking

Benchmark before and after any performance-related experiment.

### Respect the Robots

Whether repeating with Spotify or extending to other sites, continue to respect the guidelines for scraping, as laid out in the robots.txt. In [Spotify](https://www.spotify.com/robots.txt)'s case:

```
Disallow: /*/about-us/contact/contact-spotify-password/
Disallow: /*/about-us/contact/contact-spotify-account/
Disallow: /*/get-spotify/*
Disallow: /*/xhr/*
Disallow: /*/external/*
Disallow: /*/legal/*?ets=
Disallow: /*/legal/advertiser-terms-and-conditions/
Disallow: /*/legal/gdpr-article-15-information/
Disallow: /*/legal/spotify-controller-data-processing-terms/
Disallow: /*/account/cls/*
Disallow: /*/starbuckspartners
Disallow: /starbuckspartners
Disallow: /ppt/*?
Disallow: /partner/*?
Sitemap: https://www.spotify.com/sitemap.xml
```
