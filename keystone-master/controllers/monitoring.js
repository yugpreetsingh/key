const pg  = require('pg')
const axios = require("axios");
const cronstrue = require('cronstrue');
const monitoringController = {
getMonitor:async(req, res) => {


    res.render("monitoring/monitoring.pug");
},
getCronJobs: async(req,res,next) =>{
    let client_url = process.env.API_CLIENT + "/clients?id=-1";
    let clients = await axios.get(client_url);
    let client_name = []
    const pgclient = new pg.Client(process.env.POSTGRES_CONN)
    pgclient.connect()
    // console.log("Connected To PostgreSQL")
    pgclient.query("SELECT * FROM cron.job ORDER BY jobid ASC ")
    .then(result=>{
    // result.rows contains all the rows of job table of postgres as an array of objects.
    // Corresponding to client_id columun of pgsql table storing all the client names in array client_name 
    result.rows.forEach((x)=>{
        let clientid = x.client_id
        //  If client_id not present in pgsql table then pushing "Not Available" in client_name
        if (clientid === null){
            client_name.push("Not Available")
        }
        // Else matching the client_id from "job" table of cron schema present in pgsql with the id of clients.data
        // For successful match, storing the client name in array client_name corresponding to that clientid
        else{
        for(let i=0; i<clients.data.length;i++){
         
            if (clients.data[i].id === clientid){
            client_name.push(clients.data[i].name)
        }
       
    }
}
    })
   
    // Adding a new column "clientname" and its value by running a loop in result.rows and storing the value in each row. 
    // The column "clientname" can be direcly accessed in the pug file.
    for (let i = 0; i < result.rows.length; i++) {
        result.rows[i]["clientname"] = client_name[i];
    }
    // Sorting on basis of clientname chained with sorting on basis of status.
    result.rows.sort((a, b)=>a.clientname.toLowerCase()>b.clientname.toLowerCase()?1:-1)
    .sort((a,b)=>(a.active===b.active)?0:a.active? -1: 1)
    res.render("monitoring/cronjobs.pug",{
        title:"Cron Jobs",
        //sending all_results in pug variable "posts"
        posts: result.rows,
        cronstrue: require("cronstrue")
      

    })
 
})
.catch(error=>{
console.log(error)
})
.finally(() => pgclient.end())

},

getPrefectJobs:async(req,res,nexr)=>{
    res.render("monitoring/prefectjobs.pug")
},
getAmsJobs:async(req,res,next)=>{
    let client_url = process.env.API_CLIENT + "/clients?id=-1";
    let clients = await axios.get(client_url);
    const pgclient = new pg.Client(process.env.POSTGRES_CONN)
    pgclient.connect()
    pgclient.query("SELECT * FROM client_resource.client_crawl_schedule ORDER BY id ASC  ")
    .then(result=>{
     
    const ams_summary = {}
    const ams_summary_data = []
    let clients_data = clients.data
    let client_map = new Map()
    let all_jobs_count=0
    let timezone,client_name,source,client_id;
    for (let u of clients_data){
        client_map.set(u.id,u.name)
    }
    result.rows.forEach((row)=>{
        source = row.source
        timezone = row.schedule_timezone
        client_name = client_map.get(row.client_id)
        client_id = row.client_id
        if(client_name in ams_summary){
            ams_summary[client_name]["total_jobs"] += 1
            all_jobs_count += ams_summary[client_name]["total_jobs"]
            if(ams_summary[client_name]["source"].includes(source) == false){
                ams_summary[client_name]["source"].push(source)
            }
            if(ams_summary[client_name]["timezone"].includes(timezone) == false){
                ams_summary[client_name]["timezone"].push(timezone)
            }

        }
        else{
            ams_summary[client_name] = {
                "client_name":client_name,
                "total_jobs":1,
                "timezone":[timezone],
                "source":[source],
                "client_id":client_id
            }
           
        }
    })
    for(data in ams_summary){
        ams_summary_data.push(ams_summary[data])
    }
    ams_summary_data.sort((a, b)=>a.client_name.toLowerCase() > b.client_name.toLowerCase() ? 1: -1)
    res.render("monitoring/amsjobs.pug",{
        title:"AMS Jobs",
        summary:ams_summary_data
        
})
})
.catch(error=>{
console.log(error)
})
.finally(() => pgclient.end())
},
getAmsJobDetails:async(req,res,next)=>{
    let i;
    let client_url = process.env.API_CLIENT + "/clients?id=-1";
    let clients = await axios.get(client_url);
    // console.log(clients)
    let clientId = req.params.clientId;
    // console.log(clientId)
    const client = []
    // const client_ams_details = []
    const rows = []
    const columns = []
    const final_columns = []
    const pgclient = new pg.Client(process.env.POSTGRES_CONN)
    pgclient.connect()
    // console.log("Connected To PostgreSQL")
    pgclient.query("SELECT * FROM client_resource.client_crawl_schedule ORDER BY id ASC")
    .then(result=>{
    result.fields.forEach((field)=>{
    columns.push(field.name)
    })
    columns.unshift("client")
    client_ams_details = result.rows.filter((records)=>{
        return records.client_id == clientId
    })
    client_ams_details.forEach((row)=>{
        for (i in row){
            row[i]=== null ? row[i] = "Not Available": row[i]
        // Converting cron_string into readable description format 
            if(i === "cron_string"){
                row[i]=cronstrue.toString(row[i])
            }
            // Converting "comments" to JSON string
            if(i === "comments" &&  row[i] !== "Not Available"){  
                row[i] = JSON.stringify(row[i])
                }
            if (i==="client_id"){
                row[i] = parseInt(row[i])
                }
            }
            rows.push(row)
          
    })
    rows.forEach((x)=>{
        let clientid = x.client_id
        for(let i=0; i<clients.data.length;i++){
        
            if (clients.data[i].id === clientid){
            client.push(`${clients.data[i].name}`) 
        }
        }
        })
    for (let i = 0; i < rows.length; i++) {
        rows[i]["client"] = client[i];
    }
    // Creating another final row in order to control sequence of keys.
    final_rows = rows.map(keys=>{
 
        return{
        
        client:keys.client,
        client_id:keys.client_id,
        sys_report_id:keys.sys_report_id,
        job_priority:keys.job_priority,
        job_id:keys.id,
        ...keys
    }})
    // Creating the columns array. This is helpful in pug page to iterate and display.
    for(let i in final_rows[0]){
        // Column name id is changed to column name job_id 
       
            if(i == "id"){
                continue
            }
            final_columns.push(i)
        }
    
    res.render("monitoring/amsjobDetails.pug",{
        title:"AMS Jobs Details",
        columns:final_columns,
        rows:final_rows,
        cronstrue: require("cronstrue")
    })
    })
.catch(error=>{
        console.log(error)
    })
.finally(() => pgclient.end())
        
}
}
module.exports = monitoringController
