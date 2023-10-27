"use strict";

/*** Importing modules ***/
const express = require("express");
const morgan = require("morgan"); // logging middleware
const { check, validationResult } = require("express-validator"); // validation middleware
const passport = require("passport"); // auth middleware
const LocalStrategy = require("passport-local").Strategy; // username and password for login
const session = require("express-session"); // enable sessions
const cors = require("cors"); // cross-origin resource sharing middleware
const path = require("path"); // path middleware for managing static directories
const fs = require("fs"); // file system middleware
const dayjs = require("dayjs"); // dayjs library

const pageDao = require("./dao-pages"); // module for accessing the pages and blocks tables in the DB
const userDao = require("./dao-users"); // module for accessing the user table in the DB
const configDao = require("./dao-config"); // module for accessing the config table in the DB

/*** Set up Passport ***/
passport.use(
  new LocalStrategy(function (username, password, done) {
    userDao.getUser(username, password).then((user) => {
      if (!user) return done(null, false, "Incorrect username or password.");
      return done(null, user);
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userDao
    .getUserById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

/*** Init express and set-up the middlewares ***/
const app = express();
app.use(morgan("dev"));
app.use(express.static("./static"));
app.use(express.json());
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));

// Custom middleware to check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Not authenticated." });
};

// Set up the session
app.use(
  session({
    secret: "m7mv0o0DKEdP6CsM08C6SkSVhV2hzyeU",
    resave: false,
    saveUninitialized: false,
  })
);

// Init passport
app.use(passport.initialize());
app.use(passport.session());

// This function is used to format express-validator errors as strings
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  return `${msg}`;
};

/*** Images APIs ***/

// GET /static/:imageName
// This route retrieves a static image given the file name
app.get("/static/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "static", imageName);
  res.sendFile(imagePath);
});

// GET /api/images
// This route retrieves the list of images in the 'static' folder
app.get("/api/images", (req, res) => {
  const imagesDir = path.join(__dirname, "static");
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      return res.sendStatus(500);
    }
    const images = files.filter((file) => file.endsWith(".jpeg"));
    res.json(images);
  });
});

/*** Pages APIs ***/

// GET /api/pages
// This route gets the list of pages in the db.
app.get("/api/pages", isLoggedIn, (req, res) => {
  pageDao
    .listPages()
    .then((pages) => res.json(pages))
    .catch((err) => res.status(500).json(err));
});

// GET /api/published-pages
// This route gets the list of published pages in the db.
app.get("/api/published-pages", (req, res) => {
  pageDao
    .listPublishedPages()
    .then((pages) => res.json(pages))
    .catch((err) => res.status(500).json(err));
});

// GET /api/pages/:id
// This route gets a page given its id and all its content blocks.
app.get(
  "/api/pages/:id",
  [check("id", "Page id must be a positive integer").isInt({ min: 1 })],
  (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ") });
    }
    pageDao
      .getPage(req.params.id)
      .then((page) => {
        if (page.error) {
          res.status(404).json({ error: "Page not found." });
        }
        // Check if page is not published and user is not authenticated then the page can't be returned
        else if (page.status !== "published" && !req.isAuthenticated()) {
          res.status(401).json({ error: "Not authenticated." });
        } else {
          res.json(page);
        }
      })
      .catch((err) => res.status(500).json(err));
  }
);

// POST /api/pages
// This route creates a new page and its blocks.
app.post(
  "/api/pages",
  isLoggedIn,
  [
    check("title", "Page title cannot be empty").notEmpty(),
    check("authorUsername", "Page author's username cannot be empty").notEmpty(),
    check("publicationDate", "Wrong date format")
      .isLength({ min: 10, max: 10 })
      .isISO8601({ strict: true })
      .optional({ checkFalsy: true }),
    check("publicationDate").custom((publicationDate) => {
      const creationDate = dayjs().format("YYYY-MM-DD");
      if (publicationDate !== "" && dayjs(publicationDate).isBefore(creationDate)) {
        throw new Error("Publication date must be after the creation date");
      }
      return true;
    }),
    check("blocks").custom((blocks) => {
      const hasHeader = blocks.some((block) => block.type === "header");
      const hasParagraphOrImage = blocks.some((block) => block.type === "paragraph" || block.type === "image");
      if (!hasHeader) {
        throw new Error("There must be at least one header block");
      }
      if (!hasParagraphOrImage) {
        throw new Error("There must be at least one paragraph or image block");
      }
      return true;
    }),
    check("blocks.*.content", "Blocks content cannot be empty").notEmpty(),
    check("blocks.*.position", "Blocks position must be an integer").isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join("; ") });
    }
    try {
      // Get the author from the db
      const author = await userDao.getUserByUsername(req.body.authorUsername);
      if (author.error) return res.status(404).json(author);

      // If the author is different from the authenticated user, check admin privileges
      if (author.id !== req.user.id) {
        const user = await userDao.getUserById(req.user.id);
        if (user.error) return res.status(404).json(user);
        if (user.role !== "admin")
          return res.status(403).json({
            error:
              "Insufficient privileges to complete the requested operation.",
          });
      }
      // Create the page
      const page = {
        title: req.body.title,
        authorId: author.id,
        publicationDate: req.body.publicationDate,
      };
      const pageId = await pageDao.createPage(page);
      if (pageId.error) return res.status(404).json(pageId);

      // Create the blocks
      const blocks = req.body.blocks;
      try {
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          await pageDao.createBlock(pageId, block);
        }
      } catch (err) {
        res.status(500).json({ error: "Error creating the blocks." });
      }
      // Return the newly created page
      const result = await pageDao.getPage(pageId);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: `Database error during the creation of the page: ${err}`,
      });
    }
  }
);

// PUT /api/pages/:id
// This route edits an existing page and its blocks given the page id.
app.put(
  "/api/pages/:id",
  isLoggedIn,
  [
    check("id", "Page id must be a positive integer").isInt({ min: 1 }),
    check("title", "Page title cannot be empty").notEmpty(),
    check("authorUsername", "Page author's username cannot be empty").notEmpty(),
    check("publicationDate", "Wrong date format")
      .isLength({ min: 10, max: 10 })
      .isISO8601({ strict: true })
      .optional({ checkFalsy: true }),
    check("publicationDate").custom((publicationDate, { req }) => {
      const creationDate = req.body.creationDate;
      if (dayjs(publicationDate).isBefore(creationDate)) {
        throw new Error("Publication date must be after the creation date");
      }
      return true;
    }),
    check("blocks").custom((blocks) => {
      const hasHeader = blocks.some((block) => block.type === "header");
      const hasParagraphOrImage = blocks.some((block) => block.type === "paragraph" || block.type === "image");
      if (!hasHeader) {
        throw new Error("There must be at least one header block");
      }
      if (!hasParagraphOrImage) {
        throw new Error("There must be at least one paragraph or image block");
      }
      return true;
    }),
    check("blocks.*.content", "Blocks content cannot be empty").notEmpty(),
    check("blocks.*.position", "Blocks position must be an integer").isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join("; ") });
    }
    try {
      // Get the author from the db
      const author = await userDao.getUserByUsername(req.body.authorUsername);
      if (author.error) return res.status(404).json(author);

      // If the author is different from the authenticated user, check admin privileges
      if (author.id !== req.user.id) {
        const user = await userDao.getUserById(req.user.id);
        if (user.error) return res.status(404).json(user);
        if (user.role !== "admin")
          return res.status(403).json({
            error:
              "Insufficient privileges to complete the requested operation.",
          });
      }
      // Update the page
      const page = {
        id: req.body.id,
        title: req.body.title,
        authorId: author.id,
        publicationDate: req.body.publicationDate,
      };
      const pageId = await pageDao.updatePage(page);

      // Delete all existing blocks for that page
      await pageDao.deleteBlocksByPageId(pageId);

      // Create all the blocks for the modified page
      const blocks = req.body.blocks;
      try {
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          await pageDao.createBlock(pageId, block);
        }
      } catch (err) {
        res.status(500).json({ error: "Error creating the blocks." });
      }
      // Return the updated page
      const result = await pageDao.getPage(pageId);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: `Database error during the update of page ${req.params.id}: ${err}`,
      });
    }
  }
);

// DELETE /api/pages/:id
// This route deletes the a page given its id.
app.delete(
  "/api/pages/:id",
  isLoggedIn,
  [check("id", "Page id must be a positive integer").isInt({ min: 1 })],
  async (req, res) => {
    try {
      // Get the page from the db
      const page = await pageDao.getPage(req.params.id);
      if (page.error) return res.status(404).json(page);

      // Get the author from the db
      const author = await userDao.getUserByUsername(page.author.username);
      if (author.error) return res.status(404).json(author);

      // If the author is different from the authenticated user, check admin privileges
      if (author.id !== req.user.id) {
        const user = await userDao.getUserById(req.user.id);
        if (user.error) return res.status(404).json(user);
        if (user.role !== "admin")
          return res.status(403).json({
            error:
              "Insufficient privileges to complete the requested operation.",
          });
      }
      // Delete all existing blocks for that page
      await pageDao.deleteBlocksByPageId(req.params.id);

      // Delete the page
      const result = await pageDao.deletePage(req.params.id);
      if (result === null) return res.status(200).json({});
      else return res.status(404).json(result);
    } catch (err) {
      res.status(500).json({
        error: `Database error during the deletion of page ${req.params.id}: ${err} `,
      });
    }
  }
);

/*** App config APIs ***/

// GET /api/config
// This route gets the app config which includes the app name.
app.get("/api/config", (req, res) => {
  configDao
    .getConfig()
    .then((config) => res.json(config))
    .catch((err) => res.status(500).json(err));
});

// PUT /api/config
// This route updates the app config which includes the app name.
app.put(
  "/api/config",
  isLoggedIn,
  [check("appName", "App's name cannot be empty").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join("; ") });
    }
    try {
      // Check that user has admin privileges
      const user = await userDao.getUserById(req.user.id);
      if (user.error) return res.status(404).json(user);
      if (user.role !== "admin")
        return res.status(403).json({
          error: "Insufficient privileges to complete the requested operation.",
        });
      // Update config
      const result = await configDao.updateConfig(req.body);
      if (result.error) return res.status(404).json(result);
      // Return new config
      res.json(result);
    } catch (err) {
      res
        .status(500)
        .json({ error: "Database error during the update of config." });
    }
  }
);

/*** Users APIs ***/

// GET /api/users
// This route gets the list of users in the db.
app.get("/api/users", isLoggedIn, async (req, res) => {
  try {
    // Check that user has admin privileges
    const user = await userDao.getUserById(req.user.id);
    if (user.error) return res.status(404).json(user);
    if (user.role !== "admin")
      return res.status(403).json({
        error: "Insufficient privileges to complete the requested operation.",
      });
    // Get the user list
    const result = await userDao.getUsers();
    if (result.error) res.status(404).json(result);
    else res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Database error while retrieving the users list." });
  }
});

// POST /api/sessions
// This route is used for performing login.
app.post("/api/sessions", function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json({ error: info });
    }
    // success, perform the login and extablish a login session
    req.login(user, (err) => {
      if (err) return next(err);

      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser() in LocalStratecy Verify Fn
      return res.json(req.user);
    });
  })(req, res, next);
});

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else res.status(401).json({ error: "Not authenticated." });
});

// DELETE /api/session/current
// This route is used for loggin out the current user.
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

// Activating the server
const port = 3001;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
