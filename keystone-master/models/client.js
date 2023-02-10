const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// db.users.update({}, {$set: {userType: "user" }}, { multi: true });

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    domain: {
      type: String,
      required: true,
    },
    domainAlias: String,
    contactName: String,
    contactEmail: String,
    contactPhone: String,
    clientOwner: {
      type: Schema.Types.ObjectID,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Client", clientSchema);
