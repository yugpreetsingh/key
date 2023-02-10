/* 
    * This module blacklist a pipeline-id whenever it's parameter during the job set-up is incorrect.
    * This prevents the automation script from crashing and continue with the ETls of correct pipelines.
    * This module maintains a text file of those blacklisted pipelines.
**/

const fs = require("fs");
const { infoLogger, errorLogger } = require("../service/logger");


// Get the black-list file path
const blacklistPipelineFilePath = __dirname + "/../logs/blacklistPipelines";

const blacklistPipeline = function(pipeline){
    try{
        fs.appendFileSync(blacklistPipelineFilePath, `${pipeline}\n`,{encoding:"utf-8"});
        infoLogger.info(`[BLACKLISTED] ${pipeline}`);
    }catch(err){
        const err_obj = {
            "name": err.name,
            "message": err.message,
            "stack": err.stack
        };
        errorLogger.error(err_obj);
    }
};

const checkPipelineInBlacklist = function(pipeline){
    try {
        // get the blacklisted pipelines in array
        const blacklistedPipelineArray = fs.readFileSync(blacklistPipelineFilePath,{encoding:"utf-8"}).split("\n").filter(item => item.length !== 0);
        let blacklistIndex = blacklistedPipelineArray.indexOf(pipeline);
        return (blacklistIndex === -1) ? false : true;
    } catch (err) {
        const err_obj = {
            "name": err.name,
            "message": err.message,
            "stack": err.stack
        };
        errorLogger.error(err_obj);
    };
};

module.exports = { blacklistPipeline, checkPipelineInBlacklist };