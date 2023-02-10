const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// db.users.update({}, {$set: {userType: "user" }}, { multi: true });

// ! Deprecated User Schema

// const userSchema = new Schema(
//   {
//     email: {
//       type: String,
//       required: true
//     },
//     password: String,
//     name: String,
//     userType: {
//       type: String,
//       enum: ["user", "admin"],
//       default: "user"
//     }
//   },
//   {
//     timestamps: true
//   }
// );

// **This user Schema is populated using the data received from the keycloak server
const userSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  userRoles: {
    type: Array,
    required: true
  },
  image: {
    type: String,
    required: true
  }
},
  {
    timestamps: true
  }
)

module.exports = mongoose.model("User", userSchema);
