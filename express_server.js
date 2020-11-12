const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

function generateRandomString() {
  return Math.random().toString(36).substring(7);
}

// const urlDatabase = {
//   b2xVn2: "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  o4r252: { longURL: "http://www.lighthouselabs.ca", userID: "test" },
  o4r242: { longURL: "http://www.lighthouse.ca", userID: "test" },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    username: "userRandomName",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    username: "user2RandomName",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  test: {
    id: "test",
    username: "user",
    email: "123@1.com",
    password: "123",
  },
};

const emailInUse = function (email) {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
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

// console.log(urlsForUser("test"));
// console.log("password", matchPassword("user@example.com"));

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
  const { username, email, password } = req.body;
  const uid = generateRandomString();
  if (!username || !email || !password) {
    res
      .status(400)
      .send(
        "Status code: 400. \n Please enter valid username or email or password."
      );
  } else if (emailInUse(email)) {
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
      password: password,
    };
  }
  // console.log("user", users);
  res.cookie("user_id", uid);
  res.redirect("/urls");
});

// app.post("/login", (req, res) => {
//   res.cookie("user_id", req.body.user_id);
//   res.redirect("/urls");
// });

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
  if (!emailInUse(email)) {
    res
      .status(403)
      .send("Status code: 403. \n A User with that e-mail cannot be found.");
    // .redirect("/register");
  } else if (password !== matchPassword(email)) {
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

// app.get("/hello", (req, res) => {
//   const templateVars = { greeting: "Hello World!" };
//   res.render("hello_world", templateVars);
// });
// console.log(urlDatabase);

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}! http://localhost:8080/`);
});
