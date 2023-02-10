const { validationResult } = require("express-validator");
const { publishToQueue } = require("../util/amqp");
const axios = require("axios");
const querystring = require("querystring");

const Client = require("../models/client");
const User = require("../models/user");
// let clients_data = []
const clientController = {
  getList: async (req, res, next) => {
    // let clients = await Client.find();

    try {
      let url = process.env.API_CLIENT + "/clients?id=-1";
      let clients = await axios.get(url);
      clients.data.sort((a,b)=>a.name.toLowerCase()>b.name.toLowerCase()?1:-1)
      res.render("client/list.pug", {
        title: "Client List",
        tab: "a2",
        clients:clients.data
      });
    } catch (e) {
      if (!e.statusCode) {
        e.statusCode = 500;
      }
      next(e);
      return;
    }
  },
  addClientForm: async (req, res, next) => {
    let users = await User.find();
    res.render("client/add.pug", {
      title: "Add New Client",
      tab: "a2",
      users: users,
    });
  },
  addClientPost: async (req, res, next) => {
    try {
      // first the validation
      let errors = validationResult(req);
      let name = req.body.name;
      let domain = req.body.domain;
      let domainAlias = req.body.domainAlias;
      let contactName = req.body.contactName;
      let contactEmail = req.body.contactEmail;
      let contactPhone = req.body.contactPhone;
      let clientOwner = req.body.clientOwner;

      let messages = "";

      if (!errors.isEmpty()) {
        errors.array().forEach((element) => {
          messages += "• " + element.msg + "<BR>";
        });
      }

      if (messages !== "") {
        req.flash("errorUnsafe", messages);
        // req.session.tmpFormData = {
        //   name: name,
        //   email: email,
        //   userType: userType
        // };
        return res.redirect("/clients/addNew");
      }

      let client = new Client({
        name: name,
        domain: domain,
        domainAlias: domainAlias,
        contactName: contactName,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        clientOwner: clientOwner,
      });

      let clientSaved = await client.save();
      req.flash(
        "successUnsafe",
        `Client <strong>${name}</strong> added successfully`
      );

      if (clientSaved) {
        let payload = '{ "domain": ' + domain + " }";
        await publishToQueue("keystoneDomains", payload);
      }

      return res.redirect("/clients");
    } catch (e) {
      if (!e.statusCode) {
        e.statusCode = 500;
      }
      next(e);
    }
  },
  addClientPostAPI: async (req, res, next) => {
    try {
      // first the validation
      let name = req.body.name;
      let domain = req.body.domain;
      let domainAlias = req.body.domainAlias;
      let contactName = req.body.contactName;
      let contactEmail = req.body.contactEmail;
      let contactPhone = req.body.contactPhone;
      let country = req.body.country;
      // let clientOwner = req.body.clientOwner;

      let config = {
        headers: {
          // "Content-Type": "application/x-www-form-urlencoded",
          // "Content-Type": "application/json",
        },
      };
      let postdata = {
        client_name: name,
        domain: domain,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        country: country,
        domain_alias: domainAlias,
      };

      let url = process.env.API_CLIENT + "/add-client";

      await axios.post(url, postdata);

      req.flash(
        "successUnsafe",
        `Client <strong>${name}</strong> added successfully`
      );

      // if (clientSaved) {
      //   let payload = '{ "domain": ' + domain + " }";
      //   await publishToQueue("keystoneDomains", payload);
      // }

      return res.redirect("/clients");
    } catch (e) {
      if (!e.statusCode) {
        e.statusCode = 500;
      }
      next(e);
    }
  },
};

module.exports = clientController;
