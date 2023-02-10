const httpStatus = {
  get403: (req, res, next) => {
    res.status(403).render("httpStatus/403.pug", { title: "HTTP 403" });
  },
  get404: (req, res, next) => {
    res
      .status(404)
      .render("httpStatus/404.pug", { title: "HTTP 404", url: req.url });
  },
  get500: (req, res, next) => {
    res.status(505).render("httpStatus/500.pug", { title: "HTTP 500" });
  }
};

module.exports = httpStatus;
