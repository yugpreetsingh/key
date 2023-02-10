/** 
    This module gets the prefect agent and the no.of ETL which are being executed at the moment by them.
    This is done to ensure that when forceETL or automateETL module is called then all the ETLs are not executed simultaneously.
    Simlutaneous ETL execution may result in ETL failure.
    We distribute the ETL according the number of ETLs which are being executed (state = "Running") by the agent.
    If we want to scale the ETL execution, then only the number of agents should be increased in prefect.

    Maximum no. of ETLs per agent that can be executed at a moment = 10.
  * @param prefectUri the paramerer for this method(getAgentLoad)
*/

const axios = require("axios");

async function getAgentLoad(prefectUri) {
  
  const agentInfoQuery = `
    {
        agent{
          id
        }
    }
  `;

  const runningFlowsQuery = `
  {
    flow_run(where: {state: {_eq: "Running"}}) {
      state
    }
  }
  `;

  // get agent info
  let agentDetails = await axios.post(prefectUri, { query: agentInfoQuery }, { headers: { "Content-Type": "application/json" } });
  let runningFlows = await axios.post(prefectUri, { query: runningFlowsQuery }, { headers: { "Content-Type": "application/json" } });

  // restructure the response
  agentDetails = agentDetails.data.data.agent;
  runningFlows = runningFlows.data.data.flow_run;

  // get total agents
  let totalAgents = agentDetails.length;

  // get total running jobs
  let totalRunningJobs = runningFlows.length;
  let maxEtlLoadPerAgent = 8;
  // make var
  // calculate maximum available flow-run limit
  let maxFlowRunLimit = totalAgents * maxEtlLoadPerAgent;
  let allowedFlowRunLimit = maxFlowRunLimit - totalRunningJobs;

  return allowedFlowRunLimit
};

module.exports = getAgentLoad;
