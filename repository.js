class Repository {
  constructor(dao) {
    this.dao = dao;
  }

  createTable() {
    const sql =
      `CREATE TABLE IF NOT EXISTS cities (
        name VARCHAR(255),
        state VARCHAR(255),
        county VARCHAR(255),
        population INT,
        median_income INT,
        cost_of_living DECIMAL(5, 1),
        land_area DECIMAL(5, 1),
        crime_index DECIMAL(5, 1),
        PRIMARY KEY (name, state)
      )`;
    return this.dao.query(sql);
  }

  insert(name, state, county, population, median_income, cost_of_living,
    land_area, crime_index) {
    return this.dao.query(
      `INSERT IGNORE INTO cities (
        name,
        state,
        county,
        population,
        median_income,
        cost_of_living,
        land_area,
        crime_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, state, county, population, median_income, cost_of_living,
        land_area, crime_index]);
  }
}

module.exports = Repository;
