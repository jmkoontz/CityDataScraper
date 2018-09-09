let request = require('request');
let cheerio = require('cheerio');
let mysql = require('mysql');

let fs = require('fs');
let readline = require('readline');

let DAO = require('./dao');
let Repository = require('./repository');
let ScraperUtils = require('./scraperUtils');

let listFile = "stateLists/active.txt";
let delay = 3000;   // milliseconds
let proxyNum = 1;

let proxies = [''];

let userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
];

let dao = new DAO();
let repo;
dao.connect().then(() => {
  repo = new Repository(dao);
  let startTime = new Date();

  repo.createTable().then(() => {
    console.log("Table created!");

    run(repo).then(() => {
      let endTime = new Date();
      let elapsed = (endTime - startTime) / 1000;
      console.log("Job complete in " + elapsed + " seconds.");

      dao.close();
      process.exit(1);
    });
  });
});

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

let scrapeData = (url) => {
  let options = {
      method: 'GET',
      url: url,
      headers: {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)]
      },
      timeout: 10000,
      proxy: proxies[proxyNum]
  };

  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response || (response && response.statusCode === 404)) {
        reject(error, "Page not found: " + url);
        return;
      }

      const $ = cheerio.load(body);

      try {
        let nameAndState = $('.city').text();
        let county = $('.breadcrumb')[0].childNodes[5].childNodes[0].childNodes[0].nodeValue;
        let population = $('#city-population')[0].childNodes[1].nodeValue;
        let medianIncome = '';
        let costOfLiving = $('#cost-of-living-index')[0].childNodes[1].nodeValue;
        let landArea = $('.population-density').text();
        let crimeIndex = $('.norm').text();

        // deals with rare case of no median income
        if ($('#median-income')[0].childNodes[1] != null)
          medianIncome = $('#median-income')[0].childNodes[1].nodeValue;

        let name = ScraperUtils.getName(nameAndState);
        let state = ScraperUtils.getState(nameAndState);
        county = ScraperUtils.getCounty(county);
        population = ScraperUtils.getPopulation(population);
        let median_income = ScraperUtils.getMedianIncome(medianIncome);
        let cost_of_living = ScraperUtils.getCostOfLiving(costOfLiving);
        let land_area = ScraperUtils.getLandArea(landArea);
        let crime_index = ScraperUtils.getCrimeIndex(crimeIndex);

        resolve({
          name: name,
          state: state,
          county: county,
          population: population,
          median_income: median_income,
          cost_of_living: cost_of_living,
          land_area: land_area,
          crime_index: crime_index
        });
      } catch (error) {
        console.log("Error at: " + url);
        console.log(error);
        reject(error, url);
      }
    });
  });
};

let runRateLimiter = (promises, urlList, delay) => {
  let index = -1;

  return new Promise((resolve, reject) => {
    let intervalID = setInterval(() => {
      ++index;

      if (index >= urlList.length) {
        clearInterval(intervalID);
        resolve();
        return;
      }

      promises.push(scrapeData(urlList[index]).then((city) => {
        const {name, state, county, population, median_income, cost_of_living,
          land_area, crime_index} = city;
        return repo.insert(name, state, county, population, median_income,
          cost_of_living, land_area, crime_index).then();
      }).catch((error, url) => {
        reject(error);
      }));

      // progress update
      let progress = ((index + 1) / urlList.length) * 100;
      progress = Math.round(progress * 100) / 100;
      console.log("#" + (index + 1) + "......" + progress + "%");
    }, delay);
  });
}

let run = async (repo) => {
  let urlList = await loadURLs(listFile);

  let promises = [];

  let lock;
  try {
    lock = await runRateLimiter(promises, urlList, delay); // wait for all requests to send
    await Promise.all(promises);  // wait for all requests to complete
    console.log("All data stored.");
  } catch(error) {
    console.log(error);
  }

  return lock;
};
