const isAuthenticated = (req, res, next) => {
    if (req.session.passport) {
        res.redirect("/");
    } else {
        next();
    }
};

module.exports = isAuthenticated;