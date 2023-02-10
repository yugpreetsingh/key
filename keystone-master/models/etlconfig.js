// This model contains the schema for ETL automation

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const etlSchema = new Schema({
    domain: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    threshold: {
        type: Number,
        required: true
    },
    etlProjectName: {
        type: String,
        required: true
    },
    etlFlowName: {
        type: String,
        required: true
    },
    etlParserPipeline: {
        type: String,
        required: true
    },
    pageType: {
        required: true,
        type: String,
        default: "undefined"
    },
    schemaName: {
        type: String,
        required: true
    },
    tableName: {
        type: String,
        required: true
    },
    // valid JSON object string
    context: {
        type: String
    },
    parameter: {
        type: String
    },
    prefectServerId: {
        // Objectid of the prefect config
        type: Schema.Types.ObjectId,
        ref: "prefectServer",
        required: true
    }

},
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ETLconfig", etlSchema);