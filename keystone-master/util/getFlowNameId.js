// This module gets the flowId of the highest version of a flow by its name from prefect

const axios = require("axios");
// const prefect_uri = process.env.PREFECT_URI;

async function getFlowId(flowname, projectname, prefectUri) {

    let flowIdQuery = `
        {
            flow(where:{name:{_eq:"${flowname}"},_and:{project:{name:{_eq:"${projectname}"}}}}){
                id
                version
                name
            }
        }
    `

    let queryResponse = await axios.post(prefectUri, { query: flowIdQuery }, { headers: { "Content-Type": "application/json" } });
    let responseArray = queryResponse.data.data.flow
    let flowId, maxVersion = 0;

    // grab the highest version
    for (let i = 0; i < responseArray.length; i++) {

        if (responseArray[i].version > maxVersion) {
            maxVersion = responseArray[i].version;
        }
    }
    // grab the flowId of the highest version
    flowId = responseArray.filter((item) => { if (item.version === maxVersion) { return item } })[0].id;

    return flowId;
};

module.exports = { getFlowId }