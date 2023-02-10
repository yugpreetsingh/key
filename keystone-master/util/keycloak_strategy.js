const passport = require("passport");
const crypto = require("crypto");
const OAuth2Strategy = require("passport-oauth2");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// OAuth2.0 strategy paramenters for passportJS
const strategyOptions = {
    authorizationURL: process.env.AUTHORIZATION_URL,
    tokenURL: process.env.TOKEN_URL,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
};

var imgUrl;

const extractProfile = (profile, refreshtoken, accesstoken) => {
    let email = profile.email.trim().toLowerCase();

    imgUrl = profile.imgUrl || `https://www.gravatar.com/avatar/${crypto.createHash("sha256").update(email).digest("hex")}`;

    let userInfo = {
        id: profile.sub,
        displayName: profile.name,
        userName: profile.preferred_username,
        image: imgUrl,
        email: email,
        allowedAccess: profile.accessAllowed,
        user_role: profile.user_role,
        refreshToken: refreshtoken,
        accessToken:accesstoken
    };
    return userInfo;
}

const verifyCallback = async (accessToken, refreshToken, profile, done) => done(null, extractProfile(profile, refreshToken, accessToken));

passport.serializeUser((user, cb) => cb(null, user));

passport.deserializeUser((obj, cb) => cb(null, obj));

let keycloakStrategy = new OAuth2Strategy(strategyOptions, verifyCallback);

keycloakStrategy.userProfile = async function (accesstoken, done) {

    // Get the roles for a user form access-token
    let payload = jwt.decode(accesstoken);
    let allowedRoles = payload.realm_access["roles"];

    let accessAllowed = allowedRoles.includes("Keystone Administrators") || allowedRoles.includes("Keystone Users");

    // Get user info by decoding the access token
    try {
        const userInfo = {
            sub: payload.sub,
            email_verified: payload.email_verified,
            name: payload.name,
            preferred_username: payload.preferred_username,
            given_name: payload.given_name,
            family_name: payload.family_name,
            email: payload.email,
            user_role: payload.realm_access.roles,
            accessAllowed: accessAllowed,
        };

        // save the user info in mongoDB users collection
        await User.findOneAndUpdate(
            { userId: payload.sub },
            {
                $set: {
                    userRoles: payload.realm_access.roles,
                    name: payload.name,
                    email: payload.email,
                    image: imgUrl || `https://www.gravatar.com/avatar/${crypto.createHash("sha256").update(payload.email).digest("hex")}`
                }
            },
            { upsert: true }
        )

        return done(null, userInfo);
    } catch (e) {
        return done(e);
    }
};

module.exports = keycloakStrategy;
