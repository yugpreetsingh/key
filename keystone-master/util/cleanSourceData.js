// * Removing non printable unicode characters
function cleanData(jobData){
    modifiedJobData = jobData.map(item=>{
        item = item.replace(/[\u2000-\u200F\u202A-\u202F\u205F-\u206F\uFEFF]/g, '')
        return item
    })
    return jobData        

}
module.exports  = {cleanData};