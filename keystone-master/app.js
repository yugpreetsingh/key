const env_setup = require("dotenv").config();
const variableExpansion = require("dotenv-expand");
variableExpansion(env_setup);

const express = require("express");
const path = require("path");
const flash = require("connect-flash");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const pg = require("pg")
// const pgp = require('pg-promise')()
const bcrypt = require("bcryptjs");
const passport = require("passport");
const welcomeRouter = require("./routes/welcome");
const homeRouter = require("./routes/home");
const authRouter = require("./routes/auth");
const clientRouter = require("./routes/client");
const jobsRouter = require("./routes/jobs");
const apiRouter = require("./routes/api");
const adminRouter = require("./routes/admin");
const parserRouter = require("./routes/parser");
const etlConfigRouter = require("./routes/etlconfig");
const searchRouter = require("./routes/search");
const monitoringRouter = require("./routes/monitoring");
const prefectConfigRouter = require("./routes/prefectServerConfig");
const httpStatusController = require("./controllers/httpStatus");

const authenticate = require("./middleware/auth-middleware");
const isAuthenticated = require("./middleware/isAuthenticated");
const moment = require("moment-timezone");

// const authenticateAPI = require("./middleware/auth-middleware")

// const isAccess = require("./middleware/access-middleware");

const app = express();
app.use(function (req, res, next) {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });
app.disable("x-powered-by");
app.set("view engine", "pug");
app.set("views", "views");
app.locals.pretty = true;
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));

app.use(
  session({
    store: new FileStore({ path: "/tmp/sessions" }),
    saveUninitialized: false,
    resave: false,
    secret: "my secret session key",
    cookie: {
      // secure: true,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 1, // 1 day
    },
  })
);
app.use(express.json())
// Initialize passport
app.use(passport.initialize());

// passport session
app.use(passport.session());

app.use(flash());

// Register the authentication and csrf token now
app.use((req, res, next) => {
  app.locals.session = req.session;
  // app.locals.csrfToken = req.csrfToken();
  app.locals.showError = req.flash("error");
  app.locals.showUnsafeError = req.flash("errorUnsafe");
  app.locals.showSuccess = req.flash("success");
  app.locals.showUnsafeSuccess = req.flash("successUnsafe");
  app.locals.moment = moment;
  app.locals.timezone = "Asia/Kolkata";
  next();
});

// Routes (ordering is important)

// Handling HTTP Errors - above because they do not require authentication
app.use("/500", httpStatusController.get500);
app.use("/403", httpStatusController.get403);

// ! This order is important
// ! "/" comes after all the routes
app.use("/api", apiRouter);
app.use("/auth", authRouter);
app.use("/clients", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAllowed, clientRouter);
app.use("/jobs", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAllowed, jobsRouter);
app.use("/welcome", isAuthenticated, welcomeRouter);
app.use("/admin", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAdmin, adminRouter);
app.use("/monitoring", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAllowed, monitoringRouter);
// app.use("/monitoring", monitoringRouter)
app.use("/parserData", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAllowed, parserRouter);
app.use("/etlconfig", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAllowed, etlConfigRouter);
app.use("/prefectconfig", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAllowed, prefectConfigRouter);
app.use("/search", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAllowed, searchRouter);
// app.use("/csvUpload")

app.use("/", authenticate.useRefreshToken, authenticate.authenticateUser, authenticate.isAllowed, homeRouter);

// 404 is after 500 because 500 is redirected later
app.use(httpStatusController.get404);

// handle errors if they occur (in the end only)
app.use((err, req, res, next) => {
  console.log("500 Error in App --> ", err);
  return res.redirect("/500");
});

// check for the presence of the environment variables
if (process.env.PORT == undefined) {
  console.log(
    "ERROR --> The configuration information is required. Please either provide the environment variables as part of the command execution, or enter relevant information in .env file. For more details, see the README"
  );
  process.exit();
}
// Connection string from process.env file
// const connectionString = process.env.POSTGRES_CONN;


// create a pool of available connections
// we can use this to query our database

// const db = new pg.Pool({
//   connectionString,
// });
// const db = pgp(connectionString)
// initialise mongoDB
mongoose
.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log("MongoDB down --> ", err));


// Initialise keystone-app
app.listen(process.env.PORT, () => {
  console.log(`Keystone Application Initialised on Port ${process.env.PORT}`);
});
// app.listen(port,()=> console.log(`Postgres server running on Port ${port}`))
// module.exports = db;
