const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// db.users.update({}, {$set: {userType: "user" }}, { multi: true });

const categoriesSchema = new Schema({
  name: String,
  children: Array,
  url: String
});

module.exports = mongoose.model("Categories", categoriesSchema);
