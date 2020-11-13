const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

const bcrypt = require("bcrypt");
const morgan = require('morgan')
const cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  //i don't understand the keys , is this default?
  maxAge: 3 * 60 * 60 * 1000,
  //expire in 3 hours
}));

//Database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  o4r252: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
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

//Helper Functions
const {
  idRandom,
  getUserByEmail
} = require("./helpers");

const matchPassword = function(email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user].password;
    }
  }
};

const urlsForUser = function(id) {
  let urlsUser = {};
  for (let url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      urlsUser[url] = {
        longURL: urlDatabase[url].longURL
      };
    }
  }
  return urlsUser;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

//The index main page

app.get("/urls", (req, res) => {
  const user_id = req.session["user_id"];
  const urls = urlsForUser(user_id);
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
  const shortURL = idRandom();
  const user_id = req.session["user_id"];
  let longURL = req.body.longURL;
  if (!longURL.startsWith("http")) {
    longURL = "https://" + longURL;
  }
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: user_id
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

//Register Page

app.get("/register", (req, res) => {
  const user_id = req.session["user_id"];
  const templateVars = {
    urls: urlDatabase,
    user: users[user_id],
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const {
    username,
    email,
    password
  } = req.body;
  const uid = idRandom();
  if (!username || !email || !password) {
    res
      .status(400)
      .send(
        "Status code: 400. \n Please enter valid username or email or password."
      );
  } else if (getUserByEmail(email, users)) {
    res
      .status(400)
      .send(
        "Status code: 400. \n This email address is already in use, please login or register under another email address."
      );
  } else {
    let newUser = {
      id: uid,
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 10),
    };
    users[uid] = newUser;
    console.log(users);
  }
  res.redirect("/login");
});

//Login Page

app.get("/login", (req, res) => {
  const user_id = req.session["user_id"];
  const templateVars = {
    urls: urlDatabase,
    user: users[user_id],
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const {
    email,
    password
  } = req.body;
  if (!getUserByEmail(email, users)) {
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
  let user_id = getUserByEmail(email, users);
  req.session.user_id = user_id;
  res.redirect("/urls");
});

//Logout

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// Create new link

app.get("/urls/new", (req, res) => {
  const user_id = req.session["user_id"];
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
  const user_id = req.session["user_id"];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[user_id],
  };
  res.render("urls_show", templateVars);
});

//URLs delete and edit

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

//Urls Json

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}! http://localhost:8080/`);
});
