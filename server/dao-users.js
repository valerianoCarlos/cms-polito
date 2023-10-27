"use strict";

/* Data Access Object (DAO) module for accessing users */

const db = require("./db");
const crypto = require("crypto");

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE id = ?";
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (row === undefined) resolve({ error: "User not found." });
      else {
        const user = {
          id: row.id,
          name: row.fullname,
          email: row.email,
          role: row.role,
          username: row.username,
        };
        resolve(user);
      }
    });
  });
};

exports.getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username], (err, row) => {
      if (err) reject(err);
      else if (row === undefined) resolve({ error: "User not found." });
      else {
        const user = {
          id: row.id,
          name: row.fullname,
          email: row.email,
          role: row.role,
          username: row.username,
        };
        resolve(user);
      }
    });
  });
};

exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false);
      } else {
        const user = {
          id: row.id,
          name: row.fullname,
          email: row.email,
          role: row.role,
          username: row.username,
        };

        const salt = row.salt;
        crypto.scrypt(password, salt, 64, (err, hashedPassword) => {
          if (err) reject(err);

          const passwordHex = Buffer.from(row.hash, "hex");

          if (!crypto.timingSafeEqual(passwordHex, hashedPassword))
            resolve(false);
          else resolve(user);
        });
      }
    });
  });
};

exports.getUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users";
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      else {
        const users = rows.map((row) => ({
          name: row.fullname,
          username: row.username,
        }));
        resolve(users);
      }
    });
  });
};
