const Jobs = require("../models/jobs");
const moment = require("moment");
const { processFrequency } = require("../middleware/helper");

const addJob = async (job) => {
    try {
        
        let newJob = new Jobs(job);   

        const insertedJob = await newJob.save();
        return insertedJob._id;
    } catch (err) {
        console.error(err);
        return false;
    }
};


const getJobsList = async (filters, sort, processData = true, limit = 50) => {
    try {
        const jobs = await Jobs.find(filters)
            .sort(sort)
            .limit(limit)
            .populate("lastRunBatchId")
            .lean()
            .exec();
        const data = processData
            ? jobs.map((job) => {
                  job.frequencyReadable = processFrequency(job.frequency);
                  job.lastRunBatchId = job.lastRunBatchId || [];
                  return job;
              })
            : jobs;
        return data;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const getJobs = async (filters) => {
    try {
        const jobs = await Jobs.find(filters);
        return jobs;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const getJobById = async (jobId) => {
    try {
        const job = await Jobs.findById(jobId)
            .populate("addedBy")
            .lean()
            .exec();
        job.frequency = processFrequency(job.frequency);

        if (
            job.sourceType === "keywords" ||
            job.sourceType === "customasin" ||
            job.sourceType === "customurlasin" ||
            job.sourceType === "searchbyasin" ||
            job.sourceType === "reviews" ||
            // TEMPORARY:
            // For Philips War Room - Amazon Sale 01 May 2021 (Vivek / Krishna)
            job.sourceType === "amazonseller" ||
            job.sourceType === "flipkartseller"
        ) {
            job.sourceData = JSON.parse(job.sourceData);
        }

        return job;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const updateJobById = async (jobId, updateBody) => {
    try {
        const job = await Jobs.findOneAndUpdate(
            {
                _id: jobId,
            },
            updateBody
        );
        return job;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const incrementJobRunCount = async (jobId, lastRunBatchId) => {
    try {
        return await updateJobById(jobId, {
            $inc: { totalRuns: 1 },
            $set: { lastRunBatchId },
        });
    } catch (err) {
        console.error(err);
        return false;
    }
};

const getUpcomingJobs = async (upcomingSecondsThreshold) => {
    try {
        const futureTime = moment().add(upcomingSecondsThreshold, "seconds");
        const currentTime = moment();
        const upcomingJobs = await Jobs.aggregate([
            {
                $match: {
                    $and: [
                        {
                            "frequency.type": "scheduled",
                            "frequency.times": {
                                $elemMatch: {
                                    hours: {
                                        $gte: currentTime.hours(),
                                        $lte: futureTime.hours(),
                                    },
                                },
                            },
                        },
                        {
                            $or: [
                                {
                                    "frequency.day": "*",
                                },
                                {
                                    "frequency.day": {
                                        $gte: currentTime.day(),
                                        $lte: futureTime.day(),
                                    },
                                },
                            ],
                        },
                    ],
                },
            },
            {
                $addFields: {
                    time: {
                        $filter: {
                            input: "$frequency.times",
                            as: "time",
                            cond: {
                                $and: [
                                    {
                                        $gte: [
                                            "$$time.hours",
                                            currentTime.hours(),
                                        ],
                                    },
                                    {
                                        $lte: [
                                            "$$time.hours",
                                            futureTime.hours(),
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        ]);
        return upcomingJobs;
    } catch (err) {
        console.error(err);
        return false;
    }
};

module.exports = {
    addJob,
    getJobsList,
    getJobs,
    getJobById,
    incrementJobRunCount,
    getUpcomingJobs,
    updateJobById,
};
