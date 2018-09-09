class ScraperUtils {
  static getName(str) {
    return str.substr(0, str.lastIndexOf(','));
  };

  static getState(str) {
    return str.substr(str.lastIndexOf(',') + 2);
  };

  static getCounty(str) {
    return str.substr(0, str.lastIndexOf(' '));
  };

  static getPopulation(str) {
    str = str.trim();

    if (str.indexOf(' ') > 0)
      str = str.substr(0, str.indexOf(' '));

    str = str.replace(/,/g, "");

    if (!str)
      return null;

    return parseInt(str, 10);
  };

  static getMedianIncome(str) {
    str = str.trim();

    // handle rich people
    if (str.startsWith("over"))
      str = str.substr(5);

    if (str.indexOf(' ') > 0)
      str = str.substr(0, str.indexOf(' '));

    str = str.replace(/,|\$/g, "");

    if (!str)
      return null;

    return parseInt(str, 10);
  };

  static getCostOfLiving(str) {
    str = str.trim();

    if (!str)
      return null;

    return parseFloat(str);
  };

  static getLandArea(str) {
    let start = str.indexOf(':') + 2;
    let end = str.indexOf(' ', start);

    str = str.substr(start, end - start);

    str = str.trim();

    if (!str)
      return null;

    return parseFloat(str);
  };

  static getCrimeIndex(str) {
    str = str.trim();

    let last = str.lastIndexOf('.');
    let secondToLast = str.lastIndexOf('.', last - 1);

    str = str.substr(secondToLast + 2, last - secondToLast);

    if (!str)
      return null;

    return parseFloat(str);
  };
}

module.exports = ScraperUtils;
