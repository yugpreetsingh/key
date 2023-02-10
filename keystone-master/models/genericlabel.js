const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const genericSchema = new Schema({
    genericLabel: {
        type: String,
        required: true,
    },
});
module.exports = mongoose.model("genericlabel", genericSchema);
