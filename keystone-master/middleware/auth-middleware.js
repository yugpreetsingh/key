const jwt = require("jsonwebtoken");
const axios = require("axios");
const querystring = require("querystring");
const keystone_admin = process.env.KEYSTONE_ADMIN;


// Get refresh token
function useRefreshToken(req, res, next) {
  // check for time remaining for expiration of current access token
  // if it's less than 1 min, issue a new access token
  if (req.query.logout !== true && req.session.passport !== undefined) {

    let currentAccessToken = req.session.passport.user.accessToken;
    let currentRefreshToken = req.session.passport.user.refreshToken;

    // Get new access token using the current refresh token
    let access_token_exp_time = new Date((jwt.decode(currentAccessToken).exp) * 1000);
    let current_time = new Date();
    // get new access token using refresh token
    const newAccessToken = async (currentRefreshToken) => {
      let tokenData = await axios({
        method: 'post',
        url: `${process.env.TOKEN_URL}`,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams({
          grant_type: "refresh_token",
          client_secret: process.env.CLIENT_SECRET,
          refresh_token: currentRefreshToken,
          client_id: process.env.CLIENT_ID
        }).toString()
      });
      return await tokenData;
    };

    if (Math.floor((access_token_exp_time - current_time) / 60000) <= 1) {
      // issue a new access token using the current refresh token
      let access_token = newAccessToken(currentRefreshToken)
        .then(token => {
          req.session.passport.user.accessToken = token.data.access_token;
          req.session.passport.user.refreshToken = token.data.refresh_token;
          req.session.cookie._expires = req.session.cookie._expires.setHours(req.session.cookie._expires.getHours() + 24);
        })
        .catch(err => console.log(err));
    }
    next();
  } else {
    next();
  }
};


// User authentication middleware
function authenticateUser(req, res, next) {

  if (!req.session.returnTo && req.query.logout !== "true") {

    req.session.returnTo = req.originalUrl;

    if (req.session.passport) {
      console.log("Recorded session as ", req.session.passport.user["email"]);
    } else {
      console.log("Recorded session as ", req.session.returnTo);
    }

  }

  if (!req.session.passport) {
    req.session.returnTo = req.originalUrl;
    return res.redirect("/welcome");
  }

  next()
}

// API authentication middleware

function authenticateAPI(req, res, next) {

  // service account use
  let auth_parameters = querystring.stringify({
    "client_id": process.env.CLIENT_ID,
    "client_secret": process.env.CLIENT_SECRET,
    "grant_type": "client_credentials",
    "scope": "email"
  });

  let access_token = axios({
    url: process.env.API_AUTH_ENDPOINT,
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: auth_parameters
  }).then((token) => {
    let payload = jwt.decode(token.data["access_token"]);

    // check if api is authenticated for 'Keystone Administrators' roles in keycloak
    let isAllowed = payload.realm_access["roles"].includes(keystone_admin);

    if (isAllowed) {
      next();
    } else {
      return res.status(403).render('../views/httpStatus/403');
    }
  })
    .catch((err) => console.log(err));
}

function isAdmin(req, res, next) {
  let isadmin = req.session.passport.user.user_role.includes(keystone_admin);
  if (isadmin) {
    next();
  } else {
    return res.status(403).render("../views/httpStatus/403");
  }
}

function isAllowed(req, res, next) {

  let userAccess = req.session.passport.user["allowedAccess"];

  if (userAccess) {
    next();
  } else {
    return res.status(403).render("../views/httpStatus/403")
  }

}

module.exports = { useRefreshToken, authenticateUser, authenticateAPI, isAllowed, isAdmin };