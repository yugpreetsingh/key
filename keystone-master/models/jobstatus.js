const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// db.users.update({}, {$set: {userType: "user" }}, { multi: true });

const jobStatusSchema = new Schema(
    {
        jobId: {
            type: Schema.Types.ObjectID,
            ref: "Jobs",
            required: true,
        },

        clientId: {
            // type: Schema.Types.ObjectID,
            // ref: "Client",
            type: Number,
            required: true,
        },
        source: {
            type: {
                type: String,
                required: true,
            },
            link: String,
            city: Object,
            domain: String,
            page_type: String,
            data: {
                type: [String],
                required: false,
            },
            browser: String,
            screenshot: Boolean,
            maxpages: Number,
            proxytype: String,
            crawlinglanguage: String,
            sellerinfo: Boolean,
            recursive: Boolean,
            batchsize: {
                type: Number,
                required: true
            }
        },
        parser: {
            pipeline: {
                type: String,
                required: true,
            },
            startingSpider: {
                type: String,
                required: true,
            },
            collections: {
                type: [String],
                required: true,
            },
        },
        addedFrom: {
            type: String,
            enum: ["frontend", "system"],
            default: "system",
        },
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        jobType: String,
        etl_finished: Boolean,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("JobStatus", jobStatusSchema);
