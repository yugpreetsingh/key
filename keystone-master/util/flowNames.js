// This module fetches the different flow-names available for a project on prefect and then filters them to get the highest version of each flow-name

const axios = require("axios");


let getFlowNames = async function (projectName, prefect_uri) {
  // Query to get the all the flow names for a project
  let project_query = `
        {
            flow (where: {project: {name: {_eq: "${projectName}"}}} ){
                id
                name
                version
            }
        }
    `
  const query_response = await axios.post(prefect_uri, { query: project_query }, { headers: { "Content-Type": "application/json" } })

  const flow_data = await query_response.data.data.flow

  let unique_names = [];
  let all_names = [];
  let filtered_flow_names = [];

  // push the names of all flows in `names` array
  flow_data.forEach((item) => all_names.push(item.name));

  // convert the names array to a set to remove duplicates name
  let name_set = new Set(all_names);

  // push the remaining flow names from names array to unique_names array;
  name_set.forEach((item) => unique_names.push(item));

  // for all the names in unique_names array, get their corresponding highest version and then extract the information for that name and that version from flow_data

  for (let i = 0; i < unique_names.length; i++) {

    let currentName = unique_names[i];

    let currentNameFlow = flow_data.filter((item) => item.name === currentName);
    let maxversion = 0;

    for (let j = 0; j < currentNameFlow.length; j++) {
      if (maxversion < currentNameFlow[j].version) {
        maxversion = currentNameFlow[j].version;
      }
    }

    let req_data = flow_data.filter((item) => {
      if (item.name === unique_names[i] && item.version === maxversion) {
        return item;
      }
    });

    filtered_flow_names = [...filtered_flow_names, ...req_data];
  }
  return filtered_flow_names;
};

module.exports = { getFlowNames };
