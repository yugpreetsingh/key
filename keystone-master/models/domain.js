const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const domainSchema = new Schema({
    crawlerType: {
        type: String,
    },
    domainName: {
        type: String,
        required: true,
    },
    domainNickName: {
        type: String,
        required: true,
    },
    queue: {
        type: String,
        required: true,
    },
    browserInterface:{
        type:[String],
        required:true
    }
});
module.exports = mongoose.model("domain", domainSchema);
