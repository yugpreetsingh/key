const mongoose = require("mongoose");
const JobStatus = require("../models/jobstatus");

const getRecentBatches = async (numRecent) => {
    try {
        const jobs = await JobStatus.aggregate([
            {
                $sort: {
                    createdAt: -1
                },
            },
            {
                $limit: numRecent
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'jobId',
                    foreignField: '_id',
                    as: 'job'
                }
            },
            {
                $unwind: "$job"
            },
            {
                $project: {
                    _id: 1,
                    clientId: 1,
                    name: 1,
                    job: 1,
                    createdAt: 1,
                    source: 1,
                    parser: 1
                }
            }
        ]);
        
        const populatedBatches = await Promise.all(jobs.map(async job => {
            try {
                if (
                    !Object.values(mongoose.modelNames()).includes(
                        job.job.parser.collections[0] + "Model"
                    )
                ) {
                    mongoose.model(
                        job.job.parser.collections[0] + "Model",
                        new mongoose.Schema({}, { versionKey: false, strict: false }),
                        job.job.parser.collections[0]
                    );
                }
        
                const dynamicCollection = mongoose.model(job.job.parser.collections[0] + "Model");
                const processedRecord = await dynamicCollection.aggregate([
                    {
                        $match: {
                            pipeline_id: job._id.toString()
                        }
                    },
                    {
                        $sort: {
                            crawl_time: -1
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            crawl_time: { $last: '$crawl_time' },
                            crawl_id: { $last: '$_id' },
                            numProcessed: {
                                $sum: 1
                            }
                        }
                    }
                ]);
                return {
                    ...job,
                    ...( processedRecord.length && { 
                        lastCrawl: {
                            id: processedRecord[0].crawl_id,
                            time: processedRecord[0].crawl_time,
                        },
                        numProcessed: processedRecord[0].numProcessed
                    })
                }
            } catch (err) {
                console.error(err);
            }
        }));
        return populatedBatches;
    } catch (err) {
        console.error(err);
        return false;
    }
}

module.exports = {
    getRecentBatches
}
