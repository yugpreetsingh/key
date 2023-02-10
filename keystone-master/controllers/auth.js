const passport = require("passport");
const keycloakStrategy = require("../util/keycloak_strategy");

// ** New login and logout controller using passport OAuth-2.0 strategy for keycloak

passport.use("keycloak", keycloakStrategy);

const authController = {
    login: passport.authenticate("keycloak"),

    callback: passport.authenticate("keycloak", {
        failureRedirect: process.env.PASSPORT_FAILURE_REDIRECT,
        successReturnToOrRedirect: process.env.PASSPORT_SUCCESS_REDIRECT
    }),

    logout: (req, res) => {
        req.logout();
        res.clearCookie("connect.sid");
        req.flash({ "success": "logout successful" });
        setTimeout(() => {
            req.session.destroy(() => { return res.redirect(process.env.LOGOUT_URL) });
        }, 1000)
    }
}

module.exports = authController;