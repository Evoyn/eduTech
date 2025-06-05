const express = require("express");
const app = express();
const port = 3000;
const router = require("./routes");
const session = require("express-session");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.userId
    ? {
        userId: req.session.userId,
        username: req.session.username,
        role: req.session.role,
        fullName: req.session.fullName,
      }
    : null;
  next();
});

app.use("/", router);

app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page not found",
    error: { status: 404 },
  });
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).render("error", {
    message: err.message,
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

app.listen(port, () => {
  console.log(`EduTech Platform running on http://localhost:${port}`);
});
