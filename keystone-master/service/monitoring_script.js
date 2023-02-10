const {MongoClient} = require("mongodb")
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config({ path: __dirname + "/../.env" });
const mongo_uri = process.env.MONGODB_URI;
let result_arr = [];
let data_inserted;
MongoClient.connect(mongo_uri, async (err, client) => {
    if (err) {
        console.log(err, "err");
        errorLogger.error(err);
        return;
    };
    await client.connect();
    const dbInstance = client.db();
    console.log("MongoDB connection established successfully.")
    data_inserted = await monitoringJobs(dbInstance)
    if (data_inserted){
        console.log(data_inserted)
        setTimeout(async () => { 
            if(await client.close());{
                console.log("Mongo Connection closed")
            }
            process.exit()
        }, 1000);
    }
    else{
        console.log("Is Data inserted?",data_inserted)
        await client.close();
    }
})
let l_time  = new Date();
let count = 0;

console.log(l_time.toTimeString())
let resultInSecond;
function getDate(val){
    if(val === null || val=== undefined){
        return null;
    }
    if(typeof val=== "string"){
        return getDate(new Date(val));
    }
    else if(typeof val === "object")
    {
        if(Object.values(val).length==1)
        {   
            return getDate(Object.values(val)[0])
        }
        return val.toISOString()

    }
    return null
}
function removeQuotes(query){
    let ans="";
    let count=0;
    for(let i=0;i<query.length;i++)
    {
        if(count>=2||(query.charAt(i)!='\''&&query.charAt(i)!='\"'))
        {
            if(query.charAt(i)=='\'')
            {
                ans+="\'"
            }
            else if(query.charAt(i)=='\"')
            {
                ans+="\""
            }
            else
            {
                 ans=ans+query.charAt(i)
            }
            
        }
        else if(query.charAt(i)=='\''|| query.charAt(i)=='\"'){
            count++;
        }

    }
    return ans;
}
let constraint = `
                  ON conflict on constraint uq_keystone_monitoring_data_batchid
                  DO
                  UPDATE SET 
				  collection1_results = EXCLUDED.collection1_results,
				  collection2_results = EXCLUDED.collection2_results,
				  collection1_start_time = EXCLUDED.collection1_start_time,
				  collection2_start_time = EXCLUDED.collection2_start_time,
				  collection1_last_fetch_time = EXCLUDED.collection1_last_fetch_time,
                  final_result = EXCLUDED.final_result,
                  collection1_name = EXCLUDED.collection1_name,
				  collection2_name = EXCLUDED.collection2_name,
				  collection2_last_fetch_time = EXCLUDED.collection2_last_fetch_time,
                  last_updated = EXCLUDED.last_updated,
                  etl_finished = EXCLUDED.etl_finished;`
const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});


const db =  pgp(process.env.POSTGRES_CONN)
db.connect()
    .then(obj => {
        // Can check the server version here (pg-promise v10.1.0+):
        const serverVersion = obj.client.serverVersion;
        // console.log(serverVersion)
        obj.done(); // success, release the connection;
        
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
});
console.log("PG database connected")

// resultInSecond=((new Date()).getTime()-l_time.getTime())/ 1000;
// l_time  = new Date();
// console.log(resultInSecond)
async function monitoringJobs(dbInstance) {
    try{
    data_inserted = false;
    let all_collections_length = 0;
    let last_updated = getDate(new Date())
    console.log(last_updated)
    let client_url = process.env.API_CLIENT + "/clients?id=-1";
    let clients = await axios.get(client_url);
    let clients_data = clients.data
  // creating client dictionary of id and name using Map construtor
    let client_map = new Map()
    for (let u of clients_data){
        client_map.set(u.id,u.name)
    }
    
    let collection_name1 = "jobs";  
    let collection_name2 = "jobstatuses"
    let jobs_data = await dbInstance.collection(collection_name1);
    let jobs_statuses_data = await dbInstance.collection(collection_name2);
    // resultInSecond=((new Date()).getTime()-l_time.getTime())/ 1000;
    // l_time  = new Date();
    // console.log(resultInSecond)
    let current_date = new Date()
    let todays_date  = current_date
    todays_date = todays_date.toISOString().substring(0,10)
    let seven_days_back_date = new Date()
    seven_days_back_date.setDate(seven_days_back_date.getDate() - 7);
    seven_days_back_date = seven_days_back_date.toISOString().substring(0,10)
    // console.log("136",todays_date, typeof todays_date)
    // console.log("137",seven_days_back_date, typeof seven_days_back_date)
    let jobs_status_data_cursor = await jobs_statuses_data.find({
        createdAt: {
            $gte:new Date(seven_days_back_date),
            $lt:new Date(todays_date),
        },
        
    })
    let all_data = [];
    let job_name;
    let all_collections;
    let all_job_data = [];
    i = 0
    j = 0
    while (await jobs_status_data_cursor.hasNext()) {
        all_data[i] = await jobs_status_data_cursor.next()
        i += 1
    }
    let etl_finished;
    let client_name;
    let collection1_name;
    let collection2_name;
    let final_result;
    console.log("Total records",all_data.length)
    for (let data of all_data) {
        let batch_id = data._id.toString();
        let job_id = data.jobId.toString();
        etl_finished = data.etl_finished
        if (etl_finished == undefined) {
            etl_finished = false
        }
        else{
            etl_finished = etl_finished
        }
        if(data.hasOwnProperty("parser")){
            all_collections = data.parser.collections;
            if (all_collections.length == 2) {
            collection1_name = data.parser.collections[0];
            collection2_name = data.parser.collections[1];
            } else {
            collection1_name = data.parser.collections[0];
            collection2_name = null;
        }
    }
        let pincodes_count;
        let channel_name = null
        let channel_id = null
        if(data.source.city!=undefined && Object.values(data.source.city).length>0){
            pincodes_count = Object.values(data.source.city).toString().split(',').length
        }
        else{
            pincodes_count = 1
        }
        let collection1_target = data.source.data.length * pincodes_count;
        let collection2_target;
        let domain ;
        let client_id = data.clientId;
        if(data.source.domain!=undefined){
        domain = data.source.domain;
        }
        else{
            domain = null
        }
       
        let type_of_job = data.source.type;
        let date = data.createdAt;
        let collection_count  = new Array(2);
        collection_count.fill(-1)
    
        let start_crawl_time_collections = new Array(2)
        start_crawl_time_collections.fill(null)
        let last_crawl_time_collections = new Array(2)
        last_crawl_time_collections.fill(null)
        client_name = client_map.get(client_id)
        if (type_of_job ==="customasin"){
            collection2_target = collection1_target
        }
        else{
            collection2_target = 0
        }
        // resultInSecond=((new Date()).getTime()-l_time.getTime())/ 1000;
        // l_time  = new Date();
        // console.log(resultInSecond)
        let jobs_data_cursor = await jobs_data.find({_id: data.jobId})
        while (await jobs_data_cursor.hasNext()) {
            all_job_data = await jobs_data_cursor.next()
            job_name = await all_job_data.name;   
        }
        i = 0;
        let current_length
        for (let collection of all_collections) {
            if(collection){
                all_collections_length+=1
            }
            let local_collection_data = await dbInstance.collection(collection)
            let local_collection_cursor1 =  await local_collection_data.find({pipeline_id:batch_id}).project({_id:0,crawl_time:1})
            let local_collection_cursor2 =  await local_collection_data.find({pipeline_id:batch_id}).project({_id:0,crawl_time:1})
            current_length = await local_collection_cursor1.count()

        let start_crawl_times = await local_collection_cursor1.sort({crawl_time:1}).project({crawl_time:1}).limit(1).toArray()
        let end_crawl_times =  await local_collection_cursor2.sort({crawl_time:-1}).project({crawl_time:1}).limit(1).toArray()
            if(start_crawl_times.length!=0){
            start_crawl_time_collections[i] = start_crawl_times[0]["crawl_time"]
            }
            if(end_crawl_times.length!=0){
                last_crawl_time_collections[i] = end_crawl_times[0]["crawl_time"]
            }
            collection_count[i] = current_length
            i += 1
       
     }
        let collection1_results = collection_count[0]
        let collection2_results;
        if(collection_count[1]!= -1){

          collection2_results = collection_count[1]
          final_result = collection_count[1]
        }
        else{
            collection2_results = 0
            final_result = collection_count[0]
        }
        let collection1_start_time = start_crawl_time_collections[0]
        let collection2_start_time = start_crawl_time_collections[1]
        let collection1_last_fetch_time = last_crawl_time_collections[0]
        let collection2_last_fetch_time = last_crawl_time_collections[1]
        collection1_start_time = getDate(collection1_start_time)
        collection2_start_time = getDate(collection2_start_time)
        collection1_last_fetch_time = getDate(collection1_last_fetch_time)
        collection2_last_fetch_time = getDate(collection2_last_fetch_time)   
        result_arr.push ({
            last_updated,
            client_name,
            job_name,
            batch_id,
            collection1_name,
            channel_name,
            channel_id,
            collection2_name,
            collection1_results,
            collection2_results,
            etl_finished,
            job_id,
            client_id,
            domain,
            type_of_job,
            date,
            collection1_target,
            collection2_target,
            collection1_start_time,
            collection2_start_time,
            collection1_last_fetch_time,
            collection2_last_fetch_time,
            final_result
           
         } )

         count+=1
         console.log(count,"row added")
    }
    let pg_query = 
    pgp.helpers.insert(
        result_arr, 
    [
    'client_name', 
    'last_updated',  
    'job_name',
    'batch_id',
    'collection1_results',
    'collection2_results',
    'etl_finished',
    'job_id',
    'client_id',
    'channel_id',
    'channel_name',
    'collection1_name',
    'collection2_name',
    'final_result',
    'domain',
    'type_of_job',
    'date',
    'collection1_target',
    'collection2_target',
    'collection1_start_time',
    'collection2_start_time',
    'collection1_last_fetch_time',
    'collection2_last_fetch_time'
    ],
        'logs.keystone_monitoring_data'); 
        
        pg_query += constraint
        pg_query = removeQuotes(pg_query) // Removing the FIRST pair of SINGLE or DOUBLE Quotes
        // console.log(pg_query)
        let promise = await db.none(pg_query); //executing the query 
        console.log("282",promise)
        if(promise === null){
        console.log(`284 Monitoring data Successfully Inserted/Updated -${result_arr.length}`)
        data_inserted = true
        }
        return data_inserted
}
catch(err){
    console.log(err)
}
finally{
pgp.end()
console.log("connection closed")
resultInSecond=((new Date()).getTime()-l_time.getTime())/ 1000;
    console.log("Time after connection closed",(new Date()).toTimeString())
    console.log(resultInSecond)
}
}
