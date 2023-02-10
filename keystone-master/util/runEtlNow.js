// This module executes an ETL instantly when provided with the required parameters.
// Mutation is required to run an ETL via API on prefect

const { GraphQLClient, gql } = require("graphql-request");

async function runEtlNow(flow_id, flow_run_name, etlParameters, etlContext, apolloUri) {

    const graphQLClient = new GraphQLClient(apolloUri, {

        headers: {
            "Content-Type": "application/json"
        },
    })


    const runEtlQuery = gql`
            mutation CreateFlowRun($input:create_flow_run_input!)
            {
                create_flow_run(input:$input)
                {
                    id
                }
            }
    `

    const variables = {
        input: {
            flow_id: flow_id,
            flow_run_name: flow_run_name,
            parameters: etlParameters,
            context: etlContext
        }
    }

    const data = await graphQLClient.request(runEtlQuery, variables)

    const flow_run_id = await JSON.stringify(data)
    return flow_run_id;

}

module.exports = { runEtlNow };