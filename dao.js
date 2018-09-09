let mysql = require('mysql');

class AppDAO {
  constructor() {
    this.con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "password",
      database: "citydata"
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.con.connect((err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("Connected!");
          resolve();
        }
      });
    });
  }

  close() {
    this.con.end();
    console.log("Connection closed.");
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.con.query(sql, params, (err, result) => {
        if (err) {
          console.log("Error running sql: " + sql);
          console.log(err);
          reject(err);
        } else {
          resolve(result);
        }
      })
    });
  }
}

module.exports = AppDAO;
