module.exports = (req, res, next) => {
  if (!req.session.isAdmin) {
    return res.redirect("/403");
  }
  next();
};