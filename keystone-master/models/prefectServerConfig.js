const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const prefectServerSchema = new Schema({
    name: {
        unique: true,
        type: String,
        required: true
    },
    dashboardUri: {
        type: String,
        unique: true,
        required: true
    },
    apolloUri: {
        type: String,
        unique: true,
        required: true
    },
    comment: {
        type: String
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("prefectServer", prefectServerSchema);
