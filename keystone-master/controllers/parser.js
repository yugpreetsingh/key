// This serves the data on `parserData`route by hitting util/getParserData module
const { getParserInfo } = require("../util/getParserData");

const parserDataController = async function (req, res, next) {
    let parserInfo = await getParserInfo(req.params.pipelineId, req.params.parserCollectionName);
    if (parserInfo !== null) {
        // Depending on the parse collection if "parsetime" doesn't exist then the value of "parseTime" is crawl_time else parse_time.
        let parseTime =  await parserInfo.parse_time !== undefined? parserInfo.parse_time : parserInfo.crawl_time
        parseTime = new Date(parseTime);
        let currentTime = new Date();
        let timeDiff = Math.floor((currentTime - parseTime) / (1000));
        res.json({ "timeDiff": timeDiff, "parseTime": parseTime });
    } else {
        res.json({ "timeDiff": null });
    }
};

module.exports = { parserDataController }