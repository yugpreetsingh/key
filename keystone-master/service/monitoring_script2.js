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
        console.log("Data Inserted->",data_inserted)
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

console.log("Time at which script started",l_time.toTimeString())
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
                  ON conflict on constraint keystone_monitoring_data_v1_batch_id_key
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
                  missing_target_entity_collection1 = EXCLUDED.missing_target_entity_collection1,
                  missing_target_entity_collection2 = EXCLUDED.missing_target_entity_collection2,
                  missing_target_entity_collection1_count = EXCLUDED.missing_target_entity_collection1_count,
                  missing_target_entity_collection2_count = EXCLUDED.missing_target_entity_collection2_count,
                  etl_finished = EXCLUDED.etl_finished`                  
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
    console.log("Date-",last_updated)
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
    let current_date = new Date()
    let todays_date  = current_date
    todays_date = todays_date.toISOString().substring(0,10)
    let seven_days_back_date = new Date()
    seven_days_back_date.setDate(seven_days_back_date.getDate() -1);
    seven_days_back_date = seven_days_back_date.toISOString().substring(0,10)
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
    let missing_target_entity_collection1=[];
    let missing_target_entity_collection2=[];
    let missing_target_entity_collection1_count = 0;
    let missing_target_entity_collection2_count = null;
    let all_entity=[];
    console.log("Total records",all_data.length)
    for (let data of all_data) {
        all_collections_length = 0
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
            pincodes = Object.values(data.source.city).toString().split(',')
            // Filtering out those pincodes which are empty strings to find correct pincode count.
            correct_pincodes = pincodes.filter(pincode => pincode !== "");
            pincodes_count = correct_pincodes.length
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
        let missing_target_entity_collection = new Array(2)
        missing_target_entity_collection.fill(null)
        let missing_target_entity_collection_count = new Array(2)
        missing_target_entity_collection_count.fill(null)
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
            let crawl_values = []
            all_entity= []
            let local_collection_data = await dbInstance.collection(collection)
            let local_collection_cursor1 =  await local_collection_data.find({pipeline_id:batch_id}).project({_id:0,crawl_time:1})
            current_length = await local_collection_cursor1.count()
            let start_crawl_times = await local_collection_cursor1.sort({crawl_time:1}).project({crawl_time:1}).limit(1).toArray()
            await local_collection_cursor1.rewind()
            let end_crawl_times =  await local_collection_cursor1.sort({crawl_time:-1}).project({crawl_time:1}).limit(1).toArray()
            if(start_crawl_times.length!=0){
                start_crawl_time_collections[i] = start_crawl_times[0]["crawl_time"]
            }
            if(end_crawl_times.length!=0){
                last_crawl_time_collections[i] = end_crawl_times[0]["crawl_time"]
            }
            collection_count[i] = current_length
            if(type_of_job ==="keywords" || type_of_job === "customasin"|| type_of_job === "reviews"|| type_of_job === "amazonseller"|| type_of_job === "flipkartseller"){
                if(pincodes_count >=1 && data.source.city!=undefined){
                    all_entity = data.source.data                    
                    all_pincodes = Object.values(data.source.city).toString().split(',')
                    // variable all_pincodes can include empty strings when pincode city is selected but no pincode is provided in the field.
                    // Therefore filtering out empty strings storing the non empty pincodes in the filtered_pincodes.
                    filtered_pincodes = all_pincodes.filter(pincode => pincode !== "");
                    for (let i = 0;i<all_entity.length;i++){
                      
                      for(let j = 0;j<filtered_pincodes.length;j++){
                        let myobj = {}
                        // myobj[all_entity[i]] = filtered_pincodes[j]
                        myobj["entity"] = all_entity[i]
                        myobj["pincode"] = filtered_pincodes[j]
                        crawl_values.push(myobj)
                      }
                    }
                }
                else{
                    all_entity = data.source.data
                    crawl_values = []
                    for (let i = 0;i<all_entity.length;i++){
                        let myobj = {}
                        myobj["entity"] = all_entity[i]
                        crawl_values.push(myobj)
                    }
                }
            
                let keywords=[],asins= []
                
                if(type_of_job === "keywords"){
                    local_collection_cursor1 =  await local_collection_data.find({pipeline_id:batch_id},{keyword:1,pipeline_id:1,search_keyword:1,pincode:1})
                    if(pincodes_count>=1 && data.source.city!=undefined){
                        keywords = await local_collection_cursor1.project({keyword:1,_id:0,search_keyword:1,pincode:1,zipcode:1,_id:0}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                    else{
                        keywords = await local_collection_cursor1.project({keyword:1,pipeline_id:1,_id:0,search_keyword:1}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                }
                else if(type_of_job === "customasin"){
                    local_collection_cursor1 =  await local_collection_data.find({pipeline_id:batch_id},{asin:1,pipeline_id:1,source_url:1,product_url:1,item_id:1,product_id:1,base_seed:1,prod_id:1,sku:1,parent_sku:1,pincode:1})
                    if(pincodes_count>=1 && data.source.city!==undefined){
                        asins = await local_collection_cursor1.project({asin:1,pipeline_id:1,source_url:1,product_url:1,item_id:1,product_id:1,base_seed:1,prod_id:1,sku:1,parent_sku:1,pincode:1}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                    else{
                        asins = await local_collection_cursor1.project({asin:1,pipeline_id:1,source_url:1,item_id:1,product_id:1,base_seed:1,prod_id:1,sku:1,parent_sku:1}).toArray();

                        await local_collection_cursor1.rewind()
                    }
                }
                else if(type_of_job === "reviews"){
                    local_collection_cursor1 =  await local_collection_data.find({pipeline_id:batch_id},{asin:1,parent_sku:1,pipeline_id:1,pincode:1})
                    if(pincodes_count>=1 && data.source.city!=undefined){
                        asins = await local_collection_cursor1.project({asin:1,_id:0,pincode:1,parent_sku:1}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                    else{
                        asins = await local_collection_cursor1.project({asin:1,pipeline_id:1,_id:0,parent_sku:1}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                }
                else if(type_of_job === "amazonseller"){
                    local_collection_cursor1 =  await local_collection_data.find({pipeline_id:batch_id},{asin:1,pipeline_id:1,pincode:1})
                    if(pincodes_count>=1 && data.source.city!=undefined){
                        asins = await local_collection_cursor1.project({asin:1,_id:0,pincode:1}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                    else{
                        asins = await local_collection_cursor1.project({asin:1,pipeline_id:1,_id:0}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                }
                else if(type_of_job === "flipkartseller"){
                    local_collection_cursor1 =  await local_collection_data.find({pipeline_id:batch_id},{asin:1,pipeline_id:1,pincode:1,product_id:1})
                    if(pincodes_count>=1 && data.source.city!=undefined){
                        asins = await local_collection_cursor1.project({asin:1,_id:0,pincode:1,product_id:1}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                    else{
                        asins = await local_collection_cursor1.project({asin:1,pipeline_id:1,_id:0,product_id:1}).toArray();
                        await local_collection_cursor1.rewind()
                    }
                }
                let all_search_entity = []
                all_search_entity = keywords.concat(asins)
                // Renaming keyword and asin Key to ==========> entity
                // This is helpful in finding uncommon object or in other words uncrawlled data
                if(pincodes_count>=1 && data.source.city!==undefined){
                    for (let obj of all_search_entity){
                        // In order to compare the data that is set for the job and the data that gets stored in the collection(s)
                        // the two array of objects which are compared should have keys with the same name
                        if (obj.hasOwnProperty("keyword")) {
                            // Changing the Keyname from from 'keyword' to 'entity'
                            obj['entity'] = obj['keyword'];
                            delete obj['keyword'];
                            if(obj['pincode'] === undefined){
                                obj['pincode'] = obj['zipcode']
                                delete obj['zipcode'];
                                }
                            //  Deleting the object whose key is 'keyword'
                            
                        }
                        else if(obj.hasOwnProperty("search_keyword")){
                            obj['entity'] = obj['search_keyword'];
                            delete obj['search_keyword'];
                            if(obj['pincode'] === undefined){
                                obj['pincode'] = obj['zipcode']
                                delete obj['zipcode'];
                                }
                        }
                        else if(collection1_name === "flipkart-products"){
                            let entity = obj['item_id']+ ":" +obj['product_id']
                            // entity = item_id+":"+ product_id
                            delete obj['source_url']
                            obj['entity'] = entity
                        }
                        else if(obj.hasOwnProperty("asin")){            
                            // Changing the Keyname from from 'asin' to 'entity'                   
                            obj['entity'] = obj['asin'];
                            //  Deleting the object whose key is 'asin'
                            delete obj['asin'];
                            
                        }
                        //Below condition for product job of Swiggy_instamart_sel jobs
                        else if(obj.hasOwnProperty("sku") && obj.hasOwnProperty("parent_sku")){            
                            // Changing the Keyname from from 'asin' to 'entity'
                            let entity = obj['sku']+ ":" +obj['parent_sku']
                            obj['entity'] = entity;
                            //  Deleting the object whose key is 'asin'
                            delete obj['sku'];
                            delete obj['parent_sku'];
                            
                        }
                        else if(obj.hasOwnProperty("base_seed")){
                            // Changing the Keyname from from base_seed' to 'entity'
                            obj['entity'] = obj['base_seed'];
                            //  Deleting the object whose key is 'base_seed'
                            delete obj['base_seed'];
                        }
                        else if(obj.hasOwnProperty("prod_id")){
                            // Changing the Keyname from from 'prod_id' to 'entity'
                            obj['entity'] = obj['prod_id'];
                            //  Deleting the object whose key is 'prod_id'
                            delete obj['prod_id'];
                        }
                        else if(obj.hasOwnProperty("product_id")){
                            // Changing the Keyname from from 'product_id' to 'entity'
                            obj['entity'] = obj['product_id'];
                            //  Deleting the object whose key is 'product_id'
                            delete obj['product_id'];
                        }
                        else if(obj.hasOwnProperty("sku")){
                            // Changing the Keyname from from 'product_id' to 'entity'
                            obj['entity'] = obj['sku'];
                            //  Deleting the object whose key is 'product_id'
                            delete obj['sku'];
                        }
                        else if(obj.hasOwnProperty("source_url")){ 
                            if(collection1_name === "flipkart_product_sel_fetcher_results" && collection2_name === "flipkart_product_sel_parser_results"){
                                let splitted = obj['source_url'].split("?pid=")
                                item_id = splitted[0].split("/p/")[1]
                                prod_id = splitted[1].split("&")[0]
                                entity = item_id+":"+ prod_id
                                delete obj['source_url']
                                obj['entity'] = entity
                            } 
                            else if(collection1_name === "blinkit_product_sel_fetcher_results" || collection2_name === "blinkit_product_sel_parser_results"){
                                if(collection === "blinkit_product_sel_fetcher_results"){
                                let splitted = obj['source_url'].split("prid/")
                                entity = splitted[1]
                                delete obj['source_url']
                                obj['entity'] = entity
                                }
                                if(collection === "blinkit_product_sel_parser_results"){
                                let splitted = obj['product_url'].split("prid/")
                                entity = splitted[1]
                                delete obj['product_url']
                                obj['entity'] = entity
                                }
                            }
                            else{      
                            console.log("Line 521",batch_id)
                            let splitted= obj['source_url'].split("/")
                            entity = splitted[splitted.length-1]
                            delete obj['source_url']
                            obj['entity'] = entity
                            }
                            
                        }
                    }
                    missing_target_entity_collection1=[]
                    async function uncrawlled_pin_entities(crawl_values,all_search_entity){
                        missing_target_entity_collection[i] = crawl_values.filter(e => !all_search_entity.find(a => e.entity == a.entity && e.pincode == a.pincode));
                        if(batch_id == '63df0da821f2bae3d0a082e6'){
                        console.log("Misiing Target", all_search_entity)
                        }
                        missing_target_entity_collection_count[i] = missing_target_entity_collection[i].length
                        missing_target_entity_collection[i] = JSON.stringify(missing_target_entity_collection[i])
                    }
                    uncrawlled_pin_entities(crawl_values,all_search_entity)
                }
                else if(data.source.city===undefined && pincodes_count === 1 ){
                for (let obj of all_search_entity){
                    // In order to compare the data that is set for the job and the data that gets stored in the fetcher collection
                    // the two array of objects which are compared should have keys with the same name
                    if (obj.hasOwnProperty("keyword")){
                        // Changing the Keyname from from 'keyword' to 'entity'
                        obj['entity'] = obj['keyword'];
                        //  Deleting the object whose key is 'keyword'
                        delete obj['keyword'];
                      }
                    else if(obj.hasOwnProperty("search_keyword")){
                        obj['entity'] = obj['search_keyword'];
                        delete obj['search_keyword'];
                    }
                    else if(collection1_name === "flipkart-products"){
                        let entity = obj['item_id']+ ":" +obj['product_id']
                        // entity = item_id+":"+ product_id
                        delete obj['source_url']
                        obj['entity'] = entity
                    }
                    else if(obj.hasOwnProperty("asin")){
                        // Changing the Keyname from from 'keyword' to 'entity'
                        obj['entity'] = obj['asin'];
                        //  Deleting the object whose key is 'asin'
                        delete obj['asin'];
                    }
                    //Below condition for product job of Swiggy_instamart_sel jobs
                        else if(obj.hasOwnProperty("sku") && obj.hasOwnProperty("parent_sku")){            
                            // Changing the Keyname from from 'asin' to 'entity'
                            let entity = obj['sku']+ ":" +obj['parent_sku']
                            obj['entity'] = entity;
                            //  Deleting the object whose key is 'asin'
                            delete obj['sku'];
                            delete obj['parent_sku'];
                            
                    }
                    else if(obj.hasOwnProperty("base_seed")){
                        // Changing the Keyname from from base_seed' to 'entity'
                        obj['entity'] = obj['base_seed'];
                        //  Deleting the object whose key is 'base_seed'
                        delete obj['base_seed'];
                    }
                    else if(obj.hasOwnProperty("sku")){
                            // Changing the Keyname from from 'product_id' to 'entity'
                            obj['entity'] = obj['sku'];
                            //  Deleting the object whose key is 'product_id'
                            delete obj['sku'];
                    }
                    else if(obj.hasOwnProperty("prod_id")){
                        // Changing the Keyname from from 'prod_id' to 'entity'
                        obj['entity'] = obj['prod_id'];
                        //  Deleting the object whose key is 'prod_id'
                        delete obj['prod_id'];
                    }
                    else if(obj.hasOwnProperty("product_id")){
                        // Changing the Keyname from from 'product_id' to 'entity'
                        obj['entity'] = obj['product_id'];
                        //  Deleting the object whose key is 'product_id'
                        delete obj['product_id'];
                    }
                    
                    else if(obj.hasOwnProperty("source_url")){
                       if(collection1_name === "flipkart_product_sel_fetcher_results" && collection2_name === "flipkart_product_sel_parser_results"){
                            let splitted = obj['source_url'].split("?pid=")
                            item_id = splitted[0].split("/p/")[1]
                            prod_id = splitted[1].split("&")[0]
                            entity = item_id+":"+ prod_id
                            delete obj['source_url']
                            obj['entity'] = entity
                        } 
                        else{
                        let splitted= obj['source_url'].split("/")
                        entity = splitted[splitted.length-1]
                        delete obj['source_url']
                        obj['entity'] = entity
                        }
                    }
                }
                missing_target_entity_collection1=[]
                // Filtering the missing data for Non pincode jobs
                async function uncrawlled_regular_entities(crawl_values,all_search_entity){
                    missing_target_entity_collection[i] = crawl_values.filter(e => !all_search_entity.find(a => e.entity == a.entity));
                    missing_target_entity_collection_count[i] = missing_target_entity_collection[i].length
                    missing_target_entity_collection[i] = JSON.stringify(missing_target_entity_collection[i])
                }
                uncrawlled_regular_entities(crawl_values,all_search_entity)
                await local_collection_cursor1.rewind()    
            }}
            i += 1
       
     }
        let collection1_results = collection_count[0]
        missing_target_entity_collection1 = missing_target_entity_collection[0]
        missing_target_entity_collection1_count = missing_target_entity_collection_count[0]
        let collection2_results;
        if(collection_count[1]!= -1){

          collection2_results = collection_count[1]
          final_result = collection_count[1]
        }
        else{
            collection2_results = 0
            final_result = collection_count[0]
        }
        if(missing_target_entity_collection[1] !== null) {
            missing_target_entity_collection2 = missing_target_entity_collection[1]
            missing_target_entity_collection2_count =  missing_target_entity_collection_count[1]
        }
        else{
            missing_target_entity_collection2_count = null
            missing_target_entity_collection2 = null
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
            final_result,
            missing_target_entity_collection1,
            missing_target_entity_collection2,
            missing_target_entity_collection1_count,
            missing_target_entity_collection2_count
            
           
         } )

         count+=1
         console.log(count,"row added")
         console.log("Batch ID",batch_id)
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
    'missing_target_entity_collection1', //   Keywords and Asin Job
    'missing_target_entity_collection2', //   Keywords and Asin Job
    'missing_target_entity_collection1_count',
    'missing_target_entity_collection2_count',
    'date',
    'collection1_target',
    'collection2_target',
    'collection1_start_time',
    'collection2_start_time',
    'collection1_last_fetch_time',
    'collection2_last_fetch_time',
    ],
        'logs.keystone_monitoring_data_v1'); 
        
        pg_query += constraint
        pg_query = removeQuotes(pg_query) // Removing the FIRST pair of SINGLE or DOUBLE Quotes
        // console.log(pg_query)
        let promise = await db.none(pg_query); //executing the query 
        console.log("Promise",promise)
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
    console.log(resultInSecond,"seconds")
}
}