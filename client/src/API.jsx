const SERVER_URL = "http://localhost:3001/api/";

function getJson(httpResponsePromise) {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {
          response
            .json()
            .then((json) => resolve(json))
            .catch(() => reject({ error: "Cannot parse server response" }));
        } else {
          response
            .json()
            .then((obj) => reject(obj))
            .catch(() => reject({ error: "Cannot parse server response" }));
        }
      })
      .catch(() => reject({ error: "Cannot communicate with the server" }));
  });
}

async function getPages() {
  return getJson(fetch(SERVER_URL + "pages", { credentials: "include" }));
}

async function getPublishedPages() {
  return getJson(
    fetch(SERVER_URL + "published-pages", { credentials: "include" })
  );
}

async function getPage(pageId) {
  return getJson(
    fetch(SERVER_URL + "pages/" + pageId, { credentials: "include" })
  );
}

async function createPage(page) {
  return getJson(
    fetch(SERVER_URL + "pages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(page),
    })
  );
}

async function updatePage(page) {
  return getJson(
    fetch(SERVER_URL + "pages/" + page.id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(page),
    })
  );
}

async function deletePage(pageId) {
  return getJson(
    fetch(SERVER_URL + "pages/" + pageId, {
      method: "DELETE",
      credentials: "include",
    })
  );
}

async function getAppName() {
  return getJson(fetch(SERVER_URL + "config", { credentials: "include" })).then(
    (json) => {
      return json.appName;
    }
  );
}

async function updateAppName(appName) {
  return getJson(
    fetch(SERVER_URL + "config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ appName: appName }),
    })
  ).then((json) => {
    return json.appName;
  });
}

async function getUsers() {
  return getJson(fetch(SERVER_URL + "users", { credentials: "include" }));
}

async function logIn(credentials) {
  return getJson(
    fetch(SERVER_URL + "sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(credentials),
    })
  );
}

async function logOut() {
  return getJson(
    fetch(SERVER_URL + "sessions/current", {
      method: "DELETE",
      credentials: "include",
    })
  );
}

async function getUserInfo() {
  return getJson(
    fetch(SERVER_URL + "sessions/current", {
      credentials: "include",
    })
  );
}

async function getImages() {
  return getJson(
    fetch(SERVER_URL + "images", {
      credentials: "include",
    })
  );
}

const API = {
  getPages,
  getPublishedPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  getAppName,
  updateAppName,
  logIn,
  logOut,
  getUserInfo,
  getUsers,
  getImages,
};

export default API;
