"use strict";

/* Data Access Object (DAO) module for accessing pages data */

const db = require("./db");
const dayjs = require("dayjs");

// Filter pages with publicationDate before today
const isPublished = (page) => {
  if ("publicationDate" in page && page.publicationDate) {
    const diff = page.publicationDate.diff(dayjs(), "day");
    const isBefore = diff <= 0;
    return isBefore;
  }
};

// Parse a page object received from the db and add status property
const parsePage = (serverPage) => {
  const page = {
    id: serverPage.id,
    title: serverPage.title,
    creationDate: dayjs(serverPage.creation_date).format("MMM DD, YYYY"), // This field cannot be null, safe formatting
    publicationDate: dayjs(serverPage.publication_date),
    author: {
      name: serverPage.author_name,
      username: serverPage.author_username,
    },
  };
  // Set status for client object
  if (serverPage.publication_date === null) {
    page.status = "draft";
    page.publicationDate = "";
  } else if (isPublished(page)) {
    page.status = "published";
    page.publicationDate = dayjs(page.publicationDate).format("MMM DD, YYYY");
  } else {
    page.status = "programmed";
    page.publicationDate = dayjs(page.publicationDate).format("MMM DD, YYYY");
  }
  return page;
};

// This function retrieves the whole list of pages from the database adding the author fullname
exports.listPages = () => {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT pages.id, pages.title, pages.creation_date, pages.publication_date, " +
      "users.fullname AS author_name, users.username AS author_username " +
      "FROM pages " +
      "JOIN users ON users.id = pages.author_id";
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      const pages = rows.map((page) => parsePage(page));
      resolve(pages);
    });
  });
};

// This function retrieves the list of published pages from the database
exports.listPublishedPages = () => {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT pages.id, pages.title, pages.creation_date, pages.publication_date, " +
      "users.fullname AS author_name, users.username AS author_username " +
      "FROM pages " +
      "JOIN users ON pages.author_id = users.id " +
      "WHERE publication_date IS NOT NULL AND STRFTIME('%Y-%m-%d', publication_date) < DATE('now') " +
      "ORDER BY STRFTIME('%Y-%m-%d', publication_date) DESC";
    db.all(sql, (err, rows) => {
      if (err) reject(err);
      const pages = rows.map((page) => parsePage(page));
      resolve(pages);
    });
  });
};

// This function retrieves a page and its blocks given the pageId
exports.getPage = (id) => {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT pages.id, pages.title, pages.creation_date, pages.publication_date, " +
      "blocks.id AS block_id, blocks.type, blocks.content, blocks.position, " +
      "users.fullname AS author_name, users.username AS author_username " +
      "FROM pages " +
      "JOIN blocks ON blocks.page_id = pages.id " +
      "JOIN users ON users.id = pages.author_id " +
      "WHERE pages.id = ?";
    db.all(sql, [id], (err, rows) => {
      if (err) reject(err);
      if (rows.length === 0) {
        resolve({ error: "Page not found." });
      } else {
        const page = parsePage(rows[0]);
        page.blocks = [];

        rows.forEach((row) => {
          const block = {
            id: row.block_id,
            type: row.type,
            content: row.content,
            position: row.position,
          };
          page.blocks.push(block);
        });
        page.blocks.sort((a, b) => a.position - b.position);
        resolve(page);
      }
    });
  });
};

// This function creates a new page
exports.createPage = (page) => {
  const creationDate = dayjs().format("YYYY-MM-DD");
  if (page.publicationDate === "") {
    page.publicationDate = null;
  }
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO pages (title, author_id, creation_date, publication_date) VALUES (?, ?, ?, ?)";
    db.run(sql, [page.title, page.authorId, creationDate, page.publicationDate], function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });
};

// This function updates an existing page
exports.updatePage = (page) => {
  if (page.publicationDate === "") {
    page.publicationDate = null;
  }
  return new Promise((resolve, reject) => {
    const sql = "UPDATE pages SET title = ?, author_id = ?, publication_date = ? WHERE id = ?";
    db.run(sql, [page.title, page.authorId, page.publicationDate, page.id], function (err) {
      if (err) reject(err);
      if (this.changes !== 1) {
        resolve({ error: "No page was updated" });
      } else {
        resolve(page.id);
      }
    });
  });
};

// This function deletes an existing page given its is
exports.deletePage = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM pages WHERE id = ?";
    db.run(sql, [id], function (err) {
      if (err) reject(err);
      if (this.changes !== 1) {
        resolve({ error: "No page deleted." });
      } else {
        resolve(null);
      }
    });
  });
};

// This function creates a new block
exports.createBlock = (pageId, block) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO blocks (page_id, type, content, position) VALUES (?, ?, ?, ?)";
    db.run(sql, [pageId, block.type, block.content, block.position], function (err) {
      if (err) reject(err);
      resolve(this.lastID);
    });
  });
};

// This function deletes all blocks given a page id
exports.deleteBlocksByPageId = (pageId) => {
  return new Promise((resolve, reject) => {
    const sql = "DELETE FROM blocks WHERE page_id = ?";
    db.run(sql, [pageId], function (err) {
      if (err) reject(err);
      if (this.changes < 1) {
        resolve({ error: "No blocks were deleted" });
      } else {
        resolve(null);
      }
    });
  });
};
