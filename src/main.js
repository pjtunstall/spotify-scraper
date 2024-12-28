import fs from "fs";
import readline from "readline";

import { menu } from "./menu.js";

main();

function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (!fs.existsSync("spotify-prices.csv")) {
    menu(rl);
  } else {
    console.log("File `spotify-prices.csv` already exists!");
    console.log(
      "If you choose to proceed, the new data will be appended to the existing file."
    );
    console.log("What's it to be? (y/n)");

    rl.question("> ", (answer) => {
      answer = answer.toLowerCase();
      if (answer === "yes" || answer == "y") {
        console.log("Proceeding...");
        menu(rl);
      } else {
        console.log("Exiting...");
        rl.close();
        process.exit();
      }
    });
  }
}
