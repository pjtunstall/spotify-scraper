import countries from "../data/countries.js";
import scrape from "./scrape/scrape.js";

export function menu(rl) {
  console.log("Which country do you want to start from?");
  console.log(`0. ${countries[0]}-${countries[24]}
  1. ${countries[25]}-${countries[49]}
  2. ${countries[50]}-${countries[74]}
  3. ${countries[75]}-${countries[99]}
  4. ${countries[100]}-${countries[124]}
  5. ${countries[125]}-${countries[149]}
  6. ${countries[150]}-${countries[174]}
  7. ${countries[175]}-${countries[199]}
  8. ${countries[200]}-${countries[countries.length - 1]}`);

  console.log(
    "(We'll try to scrape the data for all listed countries, but some pages may not exist.)"
  );

  rl.question("> ", (input) => {
    const option = Number(input.trim());
    if (isNaN(option) || option < 0 || option > 8) {
      console.log("Invalid input. Please enter a number between 0 and 8.");
      menu(rl);
    } else {
      scrape(option);
      rl.close();
    }
  });
}
