/* This module gets the data from the parser.collection array whose schema is created
    at run time.
    We will be using mongoDB native driver as mongoose doesn't allow to fetch data from collection whose model
    or schema isn't present
*/

const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_URI


async function getParserInfo(pipelineId, parserCollection) {

    const client = new MongoClient(uri, { maxPoolSize: 1 });

    await client.connect();
    const db = await client.db();
    const parserData = await db.collection(parserCollection);

    // get data for a particular pipeline-ID/ Batch-ID
     var info = parserData.find({ pipeline_id: pipelineId }).sort({ "crawl_time": -1,"parse_time":-1 }).limit(1)
    let latestInfo = await info.next();
    await client.close();
    return latestInfo;
};

async function getNumberOfRecord(databaseName, pipeline_id) {

    const client = new MongoClient(uri, { maxPoolSize: 1 });

    let numberOfRecords;

    await client.connect();
    const db = await client.db();
    const databaseCollection = await db.collection(databaseName);

    // get the number of documents in databaseCollection collection
    numberOfRecords = await databaseCollection.countDocuments({ pipeline_id: { $eq: pipeline_id } });
    await client.close();
    return numberOfRecords;
}

module.exports = { getParserInfo, getNumberOfRecord };