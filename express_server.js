const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

const bcrypt = require("bcrypt");
// let password = "purple-monkey-dinosaur"; // found in the req.params object
// const hashedPassword = bcrypt.hashSync(password, 10);

// console.log(bcrypt.compareSync("purple-monkey-dinosaur", hashedPassword)); // returns true
// console.log(bcrypt.compareSync("pink-donkey-minotaur", hashedPassword)); // returns false

// console.log(hashedPassword);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  o4r252: { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    username: "userRandomName",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    username: "user2RandomName",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
  aJ48lW: {
    id: "aJ48lW",
    username: "user",
    email: "123@1.com",
    password: bcrypt.hashSync("123", 10),
  },
};

const matchPassword = function (email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user].password;
    }
  }
};
const matchUser = function (email) {
  for (let user in users) {
    if (users[user].email === email) {
      return user;
    }
  }
};

const urlsForUser = function (id) {
  let urlsUser = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      urlsUser[url] = { longURL: urlDatabase[url].longURL };
    }
  }
  return urlsUser;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  const urls = urlsForUser(user_id);
  // console.log(urls);
  if (!user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {
      urls: urls,
      user: users[user_id],
    };
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const user_id = req.cookies["user_id"];
  // if (!user_id) {
  //   res.redirect("/login");
  // } else {
  let longURL = req.body.longURL;
  if (!longURL.startsWith("http")) {
    longURL = "https://" + longURL;
  }
  urlDatabase[shortURL] = { longURL: longURL, userID: user_id };
  res.redirect(`/urls/${shortURL}`);
  // }
});

app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = {
    urls: urlDatabase,
    user: users[user_id],
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  // const hashedPassword = bcrypt.hashSync(password, 10);

  // // console.log(bcrypt.compareSync("purple-monkey-dinosaur", hashedPassword)); // returns true
  // //
  const { username, email, password } = req.body;
  const uid = generateRandomString();
  if (!username || !email || !password) {
    res
      .status(400)
      .send(
        "Status code: 400. \n Please enter valid username or email or password."
      );
  } else if (matchUser(email)) {
    res
      .status(400)
      .send(
        "Status code: 400. \n This email address is already in use, please login or register under another email address."
      );
  } else {
    users[uid] = {
      id: uid,
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 10),
    };
  }
  console.log("users", users);

  res.cookie("user_id", uid);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = {
    urls: urlDatabase,
    user: users[user_id],
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!matchUser(email)) {
    res
      .status(403)
      .send("Status code: 403. \n A User with that e-mail cannot be found.");
  } else if (!bcrypt.compareSync(password, matchPassword(email))) {
    res
      .status(403)
      .send(
        "Status code: 403. \n The e-mail address and the password does not match. Try again."
      );
  }
  let user_id = matchUser(email);
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  if (!user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {
      urls: urlDatabase,
      user: users[user_id],
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[user_id],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.newURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}! http://localhost:8080/`);
});
