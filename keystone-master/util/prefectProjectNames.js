// This module gets all the project names in prefect
const axios = require("axios")

let project_name_query = `
    {
        project{
            name
        }
    }
`;
let getAllProjects = async function (prefect_uri) {
    const all_project = await axios.post(prefect_uri, { query: project_name_query }, { headers: { "Content-Type": "application/json" } });
    return all_project.data.data.project;
}

module.exports = { getAllProjects };