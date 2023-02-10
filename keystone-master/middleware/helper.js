const path = require("path");
const fs = require("fs");
const mime = require("mime-types");
const { exit } = require("process");
const uuidv4 = require("uuidv4").uuid;

const uuid = () => uuidv4();

const convertJobParserStructure = (parser) => {
    const parserCollInfo = parser.split("|");
    const parserInfo = parserCollInfo[0].split(",");
    const pipeline = parserInfo[0];
    const startingSpider = parserInfo[1];
    const collections = parserCollInfo[1].split(",");

    return {
        pipeline,
        startingSpider,
        collections,
    };
};

const convertJobStructure = (job, processParser = true) => {
    // console.log(job);
    // console.log(job.sourceData.keywords.city);
    // let cities = {};
    // job.sourceData.keywords.city.forEach((city) => {
    //     cities[city] = "";
    // });
    // job.sourceData.keywords.city = cities;

    // console.log(job);
    // console.log(job.sourceData.keywords.city);
    // exit();
    // return;
    let {sourceType, sourceData,isDeleted,parser,frequency,jobType, ...jobParam } = job;

    if (processParser) {
        parser = convertJobParserStructure(parser);
    }

    const {
        domain,
        page_type,
        data,
        city,
        browser,
        maxpages,
        screenshot,
        proxytype,
        crawlinglanguage,
        sellerinfo,
        recursive,
        batchsize
    } = sourceData[sourceType];

    // console.log("Line 54",sourceData[sourceType])
    return {
        ...jobParam,
        source: {
            type: sourceType,
            domain,
            page_type,
            city: city || {},
            data: data
                .split("\r\n")
                .filter((item) => item.trim() !== "")
                .map((item) => item.trim()),
            browser,
            screenshot:
                (screenshot && screenshot.toLowerCase() === "true") || false,
            maxpages,
            proxytype: proxytype || "",
            crawlinglanguage:crawlinglanguage || "",
            sellerinfo: sellerinfo || false,
            recursive: recursive || false,
            batchsize: batchsize
        },
        parser,
        isDeleted: isDeleted || false,
        jobType: jobType || "",
        frequency: convertFrequency(frequency),
    };
};

const convertFrequency = (frequency) => {
    const frequencyArr = frequency.split("|");
    const frequencyDay = frequencyArr[0];
    return {
        type: frequencyDay === "ondemand" ? "ondemand" : "scheduled",
        ...(frequencyDay !== "ondemand" && { day: frequencyDay }),
        ...(frequencyDay !== "ondemand" && {
            times: frequencyArr[1].split(",").map((time) => ({
                hours: time.split(":")[0] * 1,
                minutes: time.split(":")[1] * 1 || 0,
            })),
        }),
    };
};

const processFrequency = (frequency) => {
    // Use this just to display the frequency in a human readable format

    const days = {
        "*": "Daily",
        0: "Sundays",
        1: "Mondays",
        2: "Tuesdays",
        3: "Wednesdays",
        4: "Thursdays",
        5: "Fridays",
        6: "Saturdays",
    };
    return frequency.type === "ondemand"
        ? "On Demand"
        : `${days[frequency.day]} ${frequency.times
              .map((time) => `${time.hours}:${time.minutes}`)
              .join(", ")} Hrs UTC`;
};

const sleep = (ms) => {
    // Usage
    // await Helper.sleep(10000);
    return new Promise((resolve) => setTimeout(resolve, ms));
};

const downloadFile = (req, res, next) => {
    console.log("Starting Download");

    if (!req.filePath || !req.fileName) {
        console.log(
            "Problem with download. Need both req.fileName and req.filePath"
        );
        next();
        return;
    }

    let filePath = req.filePath;
    let fileName = req.fileName;
    let stat;

    try {
        stat = fs.statSync(filePath);
    } catch (e) {
        console.log("File not found --> ", filePath, ". The error was --> ", e);
        next();
        return;
    }

    let contentType = mime.contentType(path.extname(filePath));
    let file = fs.createReadStream(filePath);
    res.setHeader("Content-Type", contentType);
    res.setHeader(
        "Content-Disposition",
        'attachment; filename="' + fileName + '"'
    );
    res.setHeader("Content-Length", stat.size);
    file.pipe(res);
};

module.exports = {
    uuid,
    convertFrequency,
    convertJobStructure,
    processFrequency,
    sleep,
    downloadFile,
};
