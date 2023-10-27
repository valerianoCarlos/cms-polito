"use strict";

/* Data Access Object (DAO) module for accessing pages data */

const db = require("./db");

exports.getConfig = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM config";
    db.get(sql, (err, row) => {
      if (err) reject(err);
      if (row === undefined) {
        resolve({ error: "App config not found." });
      } else {
        const config = {
          appName: row.app_name,
        };
        resolve(config);
      }
    });
  });
};

exports.updateConfig = (config) => {
  return new Promise((resolve, reject) => {
    const appName = config.appName;
    const sql = "UPDATE config SET app_name = ?";
    db.run(sql, [appName], function (err) {
      if (err) reject(err);
      if (this.changes !== 1) {
        resolve({ error: "Config was not updated" });
      } else {
        resolve(exports.getConfig());
      }
    });
  });
};
