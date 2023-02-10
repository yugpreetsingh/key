const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// db.users.update({}, {$set: {userType: "user" }}, { multi: true });

const timeSchema = new Schema(
    {
        hours: Number,
        minutes: Number,
    },
    {
        _id: false,
    }
);

const jobsSchema = new Schema(
    {
        name: {
            type: String,
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
            crawlinglanguage:String,
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
        frequency: {
            type: {
                type: String,
                required: true,
            },
            day: String,
            times: [timeSchema],
        },
        clientId: {
            type: Number,
            required: true,
        },
        lastRunBatchId: {
            type: Schema.Types.ObjectID,
            ref: "JobStatus",
        },
        isDeleted:Boolean,
        totalRuns: Number,
        jobType: String,
        addedBy: {
            type: Schema.Types.ObjectID,
            ref: "User",
            required: true,
        },
        
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Jobs", jobsSchema);
