let request = require('request');
let cheerio = require('cheerio');

let fs = require('fs');
let readline = require('readline');

let count = 0;
let startTime = new Date();

let scrapeData = (url, state) => {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) {
        console.log(error);
        reject(error);
      }

      const $ = cheerio.load(body);

      let text = $('.tabBlue.tblsort.tblsticky').text();

      let arr = text.split('\n');   // convert string to array

      // remove first and last 3 values
      arr = arr.splice(3);
      for (let i = 0; i < 3; i++)
        arr.pop();

      let urlList = [];
      for (let i = 0; i < arr.length; i++) {
        count++;

        arr[i] = arr[i].trim();

        if (arr[i].indexOf(',') > 0)
          arr[i] = arr[i].substr(0, arr[i].indexOf(','));

        // remove numbers and replace spaces with hyphens
        arr[i] = arr[i].replace(/[0-9]|\(|\)/g, "");
        arr[i] = arr[i].replace(/ |\'|\//g, "-");

        // build URL
        let divider = url.lastIndexOf("/");
        urlList.push(url.substr(0, divider + 1) + arr[i] + "-" + url.substr(divider + 1));
      }

      let newList = JSON.stringify(urlList);  // convert array back to string

      // separate URLs and remove quotes, brackets, and commas
      let finalList = newList.replace(/,/g, "\n");
      finalList = finalList.replace(/\"|\[|\]/g, "");

      // write URLs to file
      fs.writeFile("./stateLists/" + state + ".txt", finalList, (err) => {
        if (err) console.log(err);
      });

      resolve();
    });
  });
};

let loadURLs = (listFile) => {
  let urlList = [];

  return new Promise((resolve, reject) => {
    let rl = readline.createInterface({
      input: fs.createReadStream(listFile)
    });

    rl.on("line", (line) => {
      urlList.push(line);
    }).on("close", () => {
      resolve(urlList);
    }).on("error", (error) => {
      reject(error);
    });
  });
};

let run = async () => {
  let stateList = await loadURLs("./StateList.txt");

  let promises = stateList.map((state) => {
    state = state.replace(/ /g, "-");

    let url = "http://www.city-data.com/city/" + state + ".html";
    return scrapeData(url, state);
  });

  let lock = await Promise.all(promises);
  return lock;
};

run().then(() => {
  let endTime = new Date();
  let elapsed = (endTime - startTime) / 1000;
  console.log(count + " URLs generated in " + elapsed + " seconds.");
});
