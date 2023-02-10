// This code fetches the information regarding a job or flow run whose pipeline_id and project_name is provided

const axios = require("axios");

// let prefect_uri = process.env.PREFECT_URI;

let getFlowRunData = async function (pipeline_id, project_name, prefectUri) {

    let query = `
            {
                flow_run( where:
                    {parameters: { _contains: { pipeline_id: "${pipeline_id}" } },
                    flow: { project: { name: { _eq: "${project_name}" } } } 
                })
                {
                    id
                    parameters
                    state
                    start_time
                    flow {
                        name
                    }
                }
            }
        `;
    try {
        let flow_run_data = await axios.post(
            prefectUri,
            { query: query },
            { timeout: 5000 },
            { headers: { "Content-Type": "application/json" } },
        );
        console.log("Data Fetched. Status: ", flow_run_data.status);
        if (flow_run_data.data.data.flow_run.length !== 0) {

            flow_run_data = flow_run_data.data.data.flow_run;

            // grab the latest state for a pipeline, in-case if it has benn executed twice by getting the time difference of all the state for that pipeline_id and then grabbing the state which has minimum time difference frim current time.

            let start_time = [];
            let current_time = new Date();
            let time_difference = [];

            flow_run_data.forEach((item) => {
                start_time.push(item.start_time);
            });

            for (i = 0; i < start_time.length; i++) {
                time_difference.push(current_time - new Date(start_time[i]));
            }

            let latest_state_index = time_difference.indexOf(Math.min(...time_difference));
            return flow_run_data[latest_state_index];
        } else {
            return null;
        }

    }
    catch (error) {
        console.log(error);
        return error
    }

};

module.exports = getFlowRunData;