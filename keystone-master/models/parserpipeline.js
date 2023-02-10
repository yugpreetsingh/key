const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const pipelineSchema = new Schema({
    // genericLabel: {
    //     type: String,
    //     required: true,
    // },
    genericLabel: {
        type: Schema.Types.ObjectId,
        ref: "genericlabel",
        required: true,
    },
    jobType: {
        type: String,
        required: true,
    },
    crawlerType: {
        type: String,
        required: true,
    },

    projectName: {
        type: String,
        required: true,
    },
    spiderName: {
        type: String,
        required: true,
    },
    collectionName: {
        type: [String],
        required: true,
    },
});
module.exports = mongoose.model("pipeline", pipelineSchema);
