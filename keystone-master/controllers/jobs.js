const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const axios = require("axios");
const querystring = require("querystring");
const path = require("path");
const { parseAsync } = require("json2csv"); // For CSV
// PIN code validation method
const { pinCodeFormatter } = require("../util/pincodeValidator");
const { cleanData } = require("../util/cleanSourceData");

// ETL config
const etlConfig = require("../models/etlconfig");
// Crawler
const Domain = require("../models/domain");
const Pipeline = require("../models/parserpipeline");

// user model
const user = require("../models/user");

// Parser-collection data
const { getParserInfo } = require("../util/getParserData");

const { publishToQueue } = require("../util/amqp");
const { pushToQueue } = require("../util/runjob");
const {
    addJob,
    getJobsList,
    getJobById,
    incrementJobRunCount,
    updateJobById,
} = require("../dao/jobsDAO");
const {
    convertJobStructure,
    convertFrequency,
    processFrequency,
} = require("../middleware/helper");

const Jobs = require("../models/jobs");
const Client = require("../models/client");
const User = require("../models/user");
const JobStatus = require("../models/jobstatus");

// const { info } = require("console");

async function getQueueName() {
    let queue = await Domain.find({});
    let QUEUE = {};
    for (let i = 0; i < queue.length; i++) {
        let crawlerType = queue[i]["crawlerType"];
        let domainName = queue[i]["domainName"];
        let queueVal = queue[i]["queue"];

        if (!(crawlerType in QUEUE)) {
            QUEUE[crawlerType] = {};
        }

        QUEUE[crawlerType][domainName] = queueVal;
    }
    return QUEUE;
}

// const QUEUE = {
//     customasin: {
//         "WWW.AMAZON.IN": "product-page.fetcher.desktop.seeds",
//         "WWW.AMAZON.COM": "product-page.fetcher.desktop.seeds",
//         "WWW.AMAZON.AE": "product-page.fetcher.desktop.seeds",
//         "BLIBLI.COM": "blibli.product.fetcher.seeds",
//         "WWW.AMAZON.SA": "product-page.fetcher.desktop.seeds",
//         "WWW.LAZADA.CO.ID": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.COM.MY": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.COM.PH": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.SG": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.CO.TH": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.VN": "lazada.product.fetcher.seeds",
//         "WWW.NYKAA.COM": "nykaa.product.fetcher.seeds",
//         "WWW.MYNTRA.COM": "myntra.product.fetcher.seeds",
//         "SHOPEE.CO.ID": "shopee.product.fetcher.seeds",
//         "SHOPEE.COM.MY": "shopee.product.fetcher.seeds",
//         "SHOPEE.PH": "shopee.product.fetcher.seeds",
//         "SHOPEE.SG": "shopee.product.fetcher.seeds",
//         "SHOPEE.CO.TH": "shopee.product.fetcher.seeds",
//         "SHOPEE.VN": "shopee.product.fetcher.seeds",

//         "TOKOPEDIA.COM": "tokopedia.product.fetcher.seeds",
//     },
//     customurlasin: {
//         "WWW.AMAZON.IN": "product-page.fetcher.desktop.url.seeds",
//         "WWW.AMAZON.COM": "product-page.fetcher.desktop.url.seeds",
//         "WWW.AMAZON.AE": "product-page.fetcher.desktop.url.seeds",
//         "WWW.AMAZON.SA": "product-page.fetcher.desktop.url.seeds",
//     },
//     searchbyasin: {
//         "WWW.AMAZON.IN": "product-page.fetcher.asin-search.desktop.seeds",
//         "WWW.AMAZON.COM": "product-page.fetcher.asin-search.desktop.seeds",
//         "WWW.AMAZON.AE": "product-page.fetcher.asin-search.desktop.seeds",
//         "WWW.AMAZON.SA": "product-page.fetcher.asin-search.desktop.seeds",
//     },
//     keywords: {
//         "FLIPKART.COM": "flipkart.serp.seeds",
//         "WWW.AMAZON.IN": "amazon.serp.fetcher.native", //"search-keywords",
//         "WWW.AMAZON.AE": "amazon.serp.fetcher.native", //"search-keywords",
//         "WWW.AMAZON.SA": "amazon.serp.fetcher.native", //"search-keywords",
//         "WWW.AMAZON.COM": "amazon.serp.fetcher.native", //"search-keywords",
//         "WWW.AMAZON.CO.JP": "amazon.serp.fetcher.native",
//         "WWW.AMAZON.FR": "amazon.serp.fetcher.native",
//         "BLIBLI.COM": "blibli.serp.seeds",
//         "WWW.LAZADA.CO.ID": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.COM.MY": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.COM.PH": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.SG": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.CO.TH": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.VN": "lazada.serp.fetcher.seeds",
//         "WWW.NYKAA.COM": "nykaa.serp.seeds",
//         "WWW.BIGBASKET.COM": "bigbasket.serp.fetcher.seeds",
//         "WWW.GROFERS.COM": "grofers.serp.fetcher.seeds",
//         "WWW.MYNTRA.COM": "myntra.serp.fetcher.seeds",
//         "PAYTMMALL.COM": "paytmmall.serp.fetcher.seeds",
//         "WWW.FIRSTCRY.COM": "firstcry.serp.seeds",
//         "SHOPEE.CO.ID": "shopee.serp.fetcher.seeds",
//         "SHOPEE.COM.MY": "shopee.serp.fetcher.seeds",
//         "SHOPEE.PH": "shopee.serp.fetcher.seeds",
//         "SHOPEE.SG": "shopee.serp.fetcher.seeds",
//         "SHOPEE.CO.TH": "shopee.serp.fetcher.seeds",
//         "SHOPEE.VN": "shopee.serp.fetcher.seeds",
//         "TATACLIQ.COM": "tatacliq.serp.fetcher.seeds",
//         "TOKOPEDIA.COM": "tokopedia.serp.fetcher.seeds",
//         "RANKING.RAKUTEN.CO.JP": "rakuten.serp.fetcher.seeds",
//         "WWW.WALMART.COM.MX": "walmart.serp.fetcher.seeds",
//     },
//     reviews: {
//         "FLIPKART.COM": "flipkart.reviews.seeds",
//         "WWW.AMAZON.IN": "reviews.fetcher.desktop.asin.seeds",
//         "WWW.AMAZON.COM": "reviews.fetcher.desktop.asin.seeds",
//         "WWW.NYKAA.COM": "nykaa.reviews.seeds",
//         "WWW.MYNTRA.COM": "myntra.reviews.fetcher.seeds",
//         "SHOPEE.CO.ID": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.COM.MY": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.PH": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.SG": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.CO.TH": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.VN": "shopee.reviews.fetcher.seeds",
//         "TATACLIQ.COM": "tatacliq.reviews.seeds",
//         "TOKOPEDIA.COM": "tokopedia.reviews.seeds",
//     },
//     categories: {
//         "BLIBLI.COM": "blibli.category.seeds",
//         "WWW.LAZADA.CO.ID": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.COM.MY": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.COM.PH": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.SG": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.CO.TH": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.VN": "lazada.category.fetcher.seeds",
//         "SHOPEE.CO.ID": "shopee.category.fetcher.seeds",
//         "SHOPEE.COM.MY": "shopee.category.fetcher.seeds",
//         "SHOPEE.PH": "shopee.category.fetcher.seeds",
//         "SHOPEE.SG": "shopee.category.fetcher.seeds",
//         "SHOPEE.CO.TH": "shopee.category.fetcher.seeds",
//         "SHOPEE.VN": "shopee.category.fetcher.seeds",
//         "TOKOPEDIA.COM": "tokopedia.category.fetcher.seeds",
//         "RANKING.RAKUTEN.CO.JP": "rakuten.category.fetcher.seeds",
//     },
// =======

// const QUEUE = {
//     customasin: {
//         "WWW.AMAZON.FR": "product-page.fetcher.desktop.seeds",
//         "WWW.AMAZON.IN": "product-page.fetcher.desktop.seeds",
//         "WWW.AMAZON.CO.JP": "product-page.fetcher.desktop.seeds",
//         "WWW.AMAZON.COM": "product-page.fetcher.desktop.seeds",
//         "WWW.AMAZON.AE": "product-page.fetcher.desktop.seeds",
//         "BLIBLI.COM": "blibli.product.fetcher.seeds",
//         "WWW.AMAZON.SA": "product-page.fetcher.desktop.seeds",
//         "FLIPKART.COM": "flipkart.product.spider",
//         "WWW.LAZADA.CO.ID": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.COM.MY": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.COM.PH": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.SG": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.CO.TH": "lazada.product.fetcher.seeds",
//         "WWW.LAZADA.VN": "lazada.product.fetcher.seeds",
//         "WWW.NYKAA.COM": "nykaa.product.fetcher.seeds",
//         "WWW.MYNTRA.COM": "myntra.product.fetcher.seeds",
//         "SHOPEE.CO.ID": "shopee.product.fetcher.seeds",
//         "SHOPEE.COM.MY": "shopee.product.fetcher.seeds",
//         "SHOPEE.PH": "shopee.product.fetcher.seeds",
//         "SHOPEE.SG": "shopee.product.fetcher.seeds",
//         "SHOPEE.CO.TH": "shopee.product.fetcher.seeds",
//         "SHOPEE.VN": "shopee.product.fetcher.seeds",

//         "TOKOPEDIA.COM": "tokopedia.product.fetcher.seeds",
//     },
//     customurlasin: {
//         "WWW.AMAZON.IN": "product-page.fetcher.desktop.url.seeds",
//         "WWW.AMAZON.COM": "product-page.fetcher.desktop.url.seeds",
//         "WWW.AMAZON.AE": "product-page.fetcher.desktop.url.seeds",
//         "WWW.AMAZON.SA": "product-page.fetcher.desktop.url.seeds",
//     },
//     searchbyasin: {
//         "WWW.AMAZON.IN": "product-page.fetcher.asin-search.desktop.seeds",
//         "WWW.AMAZON.COM": "product-page.fetcher.asin-search.desktop.seeds",
//         "WWW.AMAZON.AE": "product-page.fetcher.asin-search.desktop.seeds",
//         "WWW.AMAZON.SA": "product-page.fetcher.asin-search.desktop.seeds",
//     },
//     keywords: {
//         "FLIPKART.COM": "flipkart.serp.seeds",
//         "WWW.AMAZON.IN": "amazon.serp.fetcher.native", //"search-keywords",
//         "WWW.AMAZON.AE": "amazon.serp.fetcher.native", //"search-keywords",
//         "WWW.AMAZON.SA": "amazon.serp.fetcher.native", //"search-keywords",
//         "WWW.AMAZON.COM": "amazon.serp.fetcher.native", //"search-keywords",
//         "WWW.AMAZON.CO.JP": "amazon.serp.fetcher.native",
//         "WWW.AMAZON.FR": "amazon.serp.fetcher.native",
//         "BLIBLI.COM": "blibli.serp.seeds",
//         "BOL.COM/NL": "bol.serp.fetcher.seeds",
//         "BOL.COM/BE": "bol.serp.fetcher.seeds",
//         "WWW.CARREFOUR.FR": "carrefour.fr.serp.fetcher.seeds",
//         "WWW.CARREFOUR.ES": "carrefour.es.serp.fetcher.seeds",
//         "WWW.CARREFOUR.IT": "carrefour.it.serp.fetcher.seeds",
//         "EBAY.COM.AU": "ebay.serp.fetcher.seeds",
//         "WWW.LAZADA.CO.ID": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.COM.MY": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.COM.PH": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.SG": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.CO.TH": "lazada.serp.fetcher.seeds",
//         "WWW.LAZADA.VN": "lazada.serp.fetcher.seeds",
//         "WWW.NYKAA.COM": "nykaa.serp.seeds",
//         "WWW.BIGBASKET.COM": "bigbasket.serp.fetcher.seeds",
//         "WWW.GROFERS.COM": "grofers.serp.fetcher.seeds",
//         "WWW.MYNTRA.COM": "myntra.serp.fetcher.seeds",
//         "PAYTMMALL.COM": "paytmmall.serp.fetcher.seeds",
//         "WWW.FIRSTCRY.COM": "firstcry.serp.seeds",
//         "SHOPEE.CO.ID": "shopee.serp.fetcher.seeds",
//         "SHOPEE.COM.MY": "shopee.serp.fetcher.seeds",
//         "SHOPEE.PH": "shopee.serp.fetcher.seeds",
//         "SHOPEE.SG": "shopee.serp.fetcher.seeds",
//         "SHOPEE.CO.TH": "shopee.serp.fetcher.seeds",
//         "SHOPEE.VN": "shopee.serp.fetcher.seeds",
//         "TATACLIQ.COM": "tatacliq.serp.fetcher.seeds",
//         "TOKOPEDIA.COM": "tokopedia.serp.fetcher.seeds",
//         "RANKING.RAKUTEN.CO.JP": "rakuten.serp.fetcher.seeds",
//         "WWW.WALMART.COM.MX": "walmart.serp.fetcher.seeds",
//         "WWW.WALMART.COM": "walmart.us.serp.fetcher.seeds"
//     },
//     reviews: {
//         "FLIPKART.COM": "flipkart.reviews.seeds",
//         "WWW.AMAZON.FR": "reviews.fetcher.desktop.asin.seeds",
//         "WWW.AMAZON.IN": "reviews.fetcher.desktop.asin.seeds",
//         "WWW.AMAZON.CO.JP": "reviews.fetcher.desktop.asin.seeds",
//         "WWW.AMAZON.COM": "reviews.fetcher.desktop.asin.seeds",
//         "WWW.NYKAA.COM": "nykaa.reviews.seeds",
//         "WWW.MYNTRA.COM": "myntra.reviews.fetcher.seeds",
//         "SHOPEE.CO.ID": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.COM.MY": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.PH": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.SG": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.CO.TH": "shopee.reviews.fetcher.seeds",
//         "SHOPEE.VN": "shopee.reviews.fetcher.seeds",
//         "TATACLIQ.COM": "tatacliq.reviews.seeds",
//         "TOKOPEDIA.COM": "tokopedia.reviews.seeds",
//     },
//     categories: {
//         "BLIBLI.COM": "blibli.category.seeds",
//         "WWW.LAZADA.CO.ID": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.COM.MY": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.COM.PH": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.SG": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.CO.TH": "lazada.category.fetcher.seeds",
//         "WWW.LAZADA.VN": "lazada.category.fetcher.seeds",
//         "SHOPEE.CO.ID": "shopee.category.fetcher.seeds",
//         "SHOPEE.COM.MY": "shopee.category.fetcher.seeds",
//         "SHOPEE.PH": "shopee.category.fetcher.seeds",
//         "SHOPEE.SG": "shopee.category.fetcher.seeds",
//         "SHOPEE.CO.TH": "shopee.category.fetcher.seeds",
//         "SHOPEE.VN": "shopee.category.fetcher.seeds",
//         "TOKOPEDIA.COM": "tokopedia.category.fetcher.seeds",
//         "RANKING.RAKUTEN.CO.JP": "rakuten.category.fetcher.seeds",
//     },

// TEMPORARY:
// Below two queues are temporary - meant for Philips War Room 01 May 2021 Sale
// amazonseller: {
//         "WWW.AMAZON.IN": "amazon.seller.fetcher.seeds",
//     },
//     flipkartseller: {
//         "FLIPKART.COM": "flipkart.seller.fetcher.seeds",
//     },
// };

let config = {
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
    },
};

const jobsController = {
    getClients: async (req, res, next) => {
        try {
            const url = process.env.API_CLIENT + "/clients?id=-1";
            let clients = await axios.get(url);
            clients.data["_id"] = clients.data.id;

            const jobs = await Jobs.aggregate([
                {
                    $group: {
                        _id: "$clientId",
                        numJobs: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $lookup: {
                        from: "jobstatuses",
                        let: {
                            clientId: "$_id",
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$clientId", "$$clientId"],
                                    },
                                },
                            },
                            {
                                $sort: {
                                    createdAt: -1,
                                },
                            },
                            {
                                $limit: 5,
                            },
                            {
                                $project: {
                                    _id: 1,
                                    createdAt: 1,
                                    jobId: 1,
                                },
                            },
                            {
                                $lookup: {
                                    from: "jobs",
                                    localField: "jobId",
                                    foreignField: "_id",
                                    as: "job",
                                },
                            },
                            {
                                $project: {
                                    _id: 1,
                                    createdAt: 1,
                                    jobId: 1,
                                    "job.name": 1,
                                },
                            },
                        ],
                        as: "batches",
                    },
                },
            ]);
            const data = clients.data.map((client) => {
                const clientJob = jobs.find((job) => job._id === client.id);
                return {
                    ...client,
                    numJobs: clientJob ? clientJob.numJobs : 0,
                    batches: clientJob ? clientJob.batches : [],
                };
            });
            res.render("jobs/listclients.pug", {
                title: "Select A Client",
                tab: "a3",
                clients: data,
            });
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
            return;
        }
    },
    scheduleJobPost: async (req, res, next) => {
        // Get the variables
        const job = convertJobStructure(req.body);
        const clientId = req.params.clientId;

        // process the city object of job for pincode validation and cleansing
        // Do the pin code formatting and pass `city` object as argument.
        // For big basket, job.source.domain == "WWW.BIGBASKET.COM"
        // Add all the domains for which pincode validation is required.

        // if (job.source.domain === 'FLIPKART.COM'){
        //     console.log(job.source)
        // }
        if (job.source.type === "keywords") {
            switch (job.source.domain) {
                case "WWW.AMAZON.IN":
                    job.source.page_type = job.source.page_type.amz;
                    break;
                case "FLIPKART.COM":
                    job.source.page_type = job.source.page_type.fk;
                    break;
                default:
                    job.source.page_type = "serp";
            }
        
        if (
            job.source.domain === "WWW.BIGBASKET.COM" ||
            job.source.domain === "WWW.GROFERS.COM" ||
            job.source.domain === "BLINKIT.COM"||
            job.source.domain === "WWW.SWIGGY.COM"||
            job.source.domain === "WWW.DMART.IN"||
            job.source.domain === "WWW.JIOMART.COM"||
            (job.source.domain === "WWW.AMAZON.IN" &&
                (job.source.page_type === "pantry" ||
                    job.source.page_type === "fresh")) ||
            (job.source.domain === "FLIPKART.COM" &&
                job.source.page_type === "grocery")
        ) {
            let formattedCityOject = pinCodeFormatter(job.source.city);
            job.source.city = formattedCityOject;

        }}
        
        else if (job.source.type === "customasin"){
            switch (job.source.domain) {
                case "AMAZON-IN-SELENIUM":
                    job.source.page_type = job.source.page_type.amazon;
                    break;
                case "FLIPKART-COM-SELENIUM":
                    job.source.page_type = job.source.page_type.flipkart;
                    break;
                default:
                    job.source.page_type = "marketplace";
            }
            if ( job.source.domain === "WWW.BIGBASKET.COM" ||
                job.source.domain === "BLINKIT.COM" ||
                job.source.domain === "WWW.SWIGGY.COM" ||
                job.source.domain ==="NYKAA-COM-SELENIUM" ||
                (job.source.domain === "AMAZON-IN-SELENIUM" && (job.source.page_type === "pantry" ||job.source.page_type === "fresh"))||
                (job.source.domain === "FLIPKART-COM-SELENIUM" && job.source.page_type === "grocery")||
                job.source.domain ==="FLIPKART.COM"
                ){

                let formattedCityOject = pinCodeFormatter(job.source.city);
                job.source.city = formattedCityOject
            }}

        
        let userObjectId = await User.find(
            { userId: req.session.passport.user.id },
            { _id: 1 }
        );

        const jobId = await addJob({
            ...job,
            clientId,
            addedBy: userObjectId[0]["_id"],
        });
          // * Removing non printable unicode characters.
          let cleanedSourceData = cleanData(job.source.data)
          job.source.data = cleanedSourceData
        //   console.log("Job is",job)
        if (jobId) {
            req.flash(
                "successUnsafe",
                `Job <strong>${job.name}: with id ${jobId}</strong> added successfully`
            );
            return res.redirect(`/jobs/${clientId}/${jobId}/details`);
        } else {
            req.flash(
                "errorUnsafe",
                `Error while adding job <strong>${job.name}</strong>`
            );
            return res.redirect(`/jobs/${clientId}`);
        }

        
    
        // Now call ScrapyD API
        // let result = {
        //   data: {
        //     server: "172.16.115.110:6800",
        //     response: {
        //       node_name: "53e49665b8d4",
        //       status: "ok",
        //       jobid: jobId
        //       // jobid: "b47ddc5e74f511ea94100242ac110004"
        //     }
        //   }
        // };
        // let result = await axios.post(
        //   "https://api.1digitalstack.com/scrapyd/schedule",
        //   querystring.stringify({
        //     user: "1ds",
        //     pass: "ods007",
        //     project: parser,
        //     spider: spider,
        //     version: version,
        //     url: data,
        //     job_id: jobId
        //   }),
        //   config
        // );

        // console.log(result);
}, 
    
        // console.log(job)
        
    editscheduleJobPost: async (req, res, next) => {
        // Get the variables
        const job = convertJobStructure(req.body);
        if (job.source.type === "keywords") {
            switch (job.source.domain) {
                case "WWW.AMAZON.IN":
                    job.source.page_type = job.source.page_type.amz;
                    break;
                case "FLIPKART.COM":
                    job.source.page_type = job.source.page_type.fk;
                    break;
                default:
                    job.source.page_type = "serp";
            }
        if (
            job.source.domain === "WWW.BIGBASKET.COM" ||
            job.source.domain === "WWW.GROFERS.COM" ||
            job.source.domain === "BLINKIT.COM"||
            job.source.domain === "WWW.SWIGGY.COM"||
            job.source.domain === "WWW.DMART.IN"||
            job.source.domain === "WWW.JIOMART.COM"||
            (job.source.domain === "WWW.AMAZON.IN" &&
                (job.source.page_type === "pantry" ||
                    job.source.page_type === "fresh")) ||
            (job.source.domain === "FLIPKART.COM" &&
                job.source.page_type === "grocery")
           
        ) {
            let formattedCityOject = pinCodeFormatter(job.source.city);
            job.source.city = formattedCityOject;

        }}
        else if (job.source.type === "customasin"){
            switch (job.source.domain) {
                case "AMAZON-IN-SELENIUM":
                    job.source.page_type = job.source.page_type.amazon;
                    break;
                case "FLIPKART-COM-SELENIUM":
                    job.source.page_type = job.source.page_type.flipkart;
                    break;
                default:
                    job.source.page_type = "marketplace";
            }
            if ( job.source.domain === "WWW.BIGBASKET.COM" ||
                job.source.domain === "BLINKIT.COM" ||
                job.source.domain === "WWW.SWIGGY.COM" ||
                job.source.domain ==="NYKAA-COM-SELENIUM" ||
                (job.source.domain === "AMAZON-IN-SELENIUM" && (job.source.page_type === "pantry" || job.source.page_type === "fresh"))||
                (job.source.domain === "FLIPKART-COM-SELENIUM" && job.source.page_type === "grocery")||
                job.source.domain === "FLIPKART.COM"
            ){
                let formattedCityOject = pinCodeFormatter(job.source.city);
                job.source.city = formattedCityOject
            }
        }

            
        
        // console.log(job)

        const clientId = req.params.clientId;
        const jobId = req.body.jobId;
        // * Removing non printable unicode characters.
        let cleanedSourceData = cleanData(job.source.data)
        job.source.data = cleanedSourceData
        const findJob = await Jobs.findById(jobId)
        if (findJob.isDeleted === true){  // job is an "Active job/Not deleted" or for those old jobs where "isDeleted" is not defined.
            req.flash(
                "errorUnsafe",
                `Hidden Job <strong>${job.name}</strong> cannot be edited.`
            );
        }
            else{
            const updateJob = await updateJobById(jobId, job);               
                if (updateJob) {
                    req.flash(
                        "successUnsafe",
                        `Job <strong>${job.name}: with id ${jobId}</strong> edited successfully`
                    );
                    return res.redirect(`/jobs/${clientId}/${jobId}/details`);
                } else {
                    req.flash(
                        "errorUnsafe",
                        `Error while editing job <strong>${job.name}</strong>`
                    );
                    return res.redirect(`/jobs/${clientId}`)
                }
        }

        
    },
  // runJob: async (req, res) => {
    // Save the job in queue

    //     const jobId = req.params.jobId;
    //     const clientId = req.params.clientId;
    //     const fromApi = req.params.fromApi ? true : false;
    //     const addedByUser = req.session.passport.user ? { "name": req.session.passport.user.displayName, "email": req.session.passport.user.email } : null;
    //     const job = await getJobById(jobId);

    //     const addJob = new JobStatus({
    //         jobId: jobId,
    //         clientId: clientId,
    //         source: job.source,
    //         parser: job.parser,
    //         addedFrom: req.params.fromApi ? "system" : "frontend",
    // if job is run by API, added by is "000000000000" else added by is the user object coming from passport
    //         addedBy: req.params.fromApi ? "000000000000" : addedByUser,
    // addedBy: req.params.fromApi ? "000000000000" : job.addedBy,
    //     });
    runJob: async (req, res) => {
        // Save the job in queue

        const jobId = req.params.jobId;
        const clientId = req.params.clientId;
        const job = await getJobById(jobId);
        // * Removing non printable unicode characters.
        let cleanedSourceData = cleanData(job.source.data)
        job.source.data = cleanedSourceData
        const fromApi = req.params.fromApi ? true : false;
        const QUEUE = await getQueueName();
        const findJob = await Jobs.findById(jobId)
        if (findJob.isDeleted === true){
            req.flash(
                "errorUnsafe",
                `Hidden Job <strong>${job.name}</strong> cannot be run.`
            );
            res.redirect("/jobs/" + clientId + "/" + jobId + "/details/");
            return
        }
        // addedByUser is the objectId of the logged in user
        let addedByUserId;
        let addedByUser = job.addedBy;

        if (req.session.passport) {
            addedByUserId = await User.findOne({
                userId: req.session.passport.user.id,
            });
            addedByUserId = addedByUserId._id;
            addedByUser = req.session.passport.user
                ? addedByUserId
                : job.addedBy;
        }

        const addJob = new JobStatus({
            jobId: jobId,
            clientId: clientId,
            source: job.source,
            parser: job.parser,
            addedFrom: req.params.fromApi ? "system" : "frontend",
            jobType: job.jobType,
            // if job is run by API, added by is "000000000000" else added by is the user object coming from passport
            addedBy: req.params.fromApi ? "000000000000" : addedByUser,
            // addedBy: req.params.fromApi ? "000000000000" : job.addedBy,
            // addedBy: addedByUser
        });

        const jobAdded = await addJob.save();
        const batchId = jobAdded._id.toString();

        await incrementJobRunCount(jobId, batchId);
        if (QUEUE[job.source.type]) {
            job["source"] =
                job.parser.pipeline === "flipkart_reviews" ||
                job.parser.pipeline === "flipkart_product_page"
                    ? {
                          ...job.source,
                          data: job.source.data.map(
                              (item) =>
                                  `{"item_id":"${item.split(":")[0]}","pid":"${
                                      item.split(":")[1]
                                  }"}`
                          ),
                      }
                    : job.source;

            let finalQueue = QUEUE[job.source.type][job.source.domain];

            // Done on 02-Oct-2021 - Vivek & Krishna
            // Since we do not have any priority queue or proxy setup for Amazon SERP Crawlers
            // thus implementing the following temporarily to go via residential IPs (deployed on 172.16.125.19)
            // for Amazon / Flipkart Sale Days
            let tempJobIds = [
                "5f33d47ca89148475a2c2f41",
                "612f96be9c43931c2611d415",
                "610aa5e41d328848f60defac",
                "600593ae3aee33f563bbdeec",
                "5fbf6fa11f63b28f414a4c92",
                "5f9a9ff59797f63ac1ce1616",
                "611244ca6b962a58c2a981e7",
                "6111f9046b962addf9a98149",
                "60b30ece52c414ff762afe7c",
                "611245406b962a2418a981e8",
                "5fe383b71f63b2541a4a52b9",
                "615885ae5aed321ecf428cf0",
                "6158a609bb1f0f6ae0621ed7",
                "615b0271620274f884ca2e0c",
            ];

            if (tempJobIds.includes(jobId)) {
                finalQueue = "priority.amazon.serp.fetcher.native";
            }
            // end of changes done on 02-Oct-2021
            if(job.source.page_type == 'fresh' && job.source.domain == 'WWW.AMAZON.IN' && job.source.type == "keywords") {
                finalQueue = "amazon.serp.fetcher.native.grocery";
            }
            pushToQueue(job.source, job.parser, batchId, finalQueue);
        } else {
            // Otherwise push to scrapyd
            const payload = {
                user: "1ds",
                pass: "ods007",
                project: job.parser.pipeline,
                spider: job.parser.startingSpider,
                recursive: job.source.recursive || false,
                version: "not implemented", // mandatory argument but not considered
                url: JSON.stringify(job.source.data),
                job_id: batchId,
                pipeline_id: batchId,
                keystone_job_id: jobId, // some JobIds may be hard-coded to go thru a different server in /Projects/api/scrapyd/schedule on Elephant-1 24-Nov-2022 Krishna D, Vivek K
            };
            console.log(payload);
            console.log(querystring.stringify(payload));
            const scrapyd = await axios.post(
                "https://api.1digitalstack.com/scrapyd/schedule",
                querystring.stringify(payload),
                config
            );
            console.log("Scrapyd API Called --> ", scrapyd.data);
        }

        if(fromApi) {
            return "/jobs/" + clientId + "/" + jobId + "/results/" + batchId;
        }

        req.flash(
            "successUnsafe",
            `Job <strong>${job.name}</strong> executed successfully`
        );

        res.redirect("/jobs/" + clientId + "/" + jobId + "/results/" + batchId);
    },
    getList: async (req, res, next) => {
        let clientId = req.params.clientId;

        let messages = "";

        let errors = await validationResult(req);
        if (!errors.isEmpty()) {
            errors.array().forEach((element) => {
                messages += "• " + element.msg + "\n"; //<BR>
            });
        }
        if (messages !== "") {
            req.flash("error", messages);
            return res.redirect("/jobs");
        }

        const clientDetails = await Client.findById(clientId);
        const jobs = await getJobsList(
            { clientId: clientId },
            { createdAt: -1 }
        );
        res.render("jobs/list.pug", {
            title: "Jobs List",
            tab: "a3",
            jobs: jobs,
            clientDetails: clientDetails,
        });
    },
    getListAPI: async (req, res, next) => {
        const clientId = req.params.clientId;

        try {
            const url = `${process.env.API_CLIENT}/clients?id=${clientId}`;
            const clientDetails = await axios.get(url);
            const jobs = await getJobsList(
                { clientId: clientId,$or:[{isDeleted:false},{isDeleted:{$exists:false}}]},
                { createdAt: -1 },
                true, // For processData
                0 // limit(0) == No Limit. Default is 50 in jobsDAO.js. Also --> https://docs.mongodb.com/manual/reference/method/cursor.limit/#zero-value
            );
            return res.render("jobs/list.pug", {
                title: "Jobs List",
                tab: "a3",
                jobs: jobs,
                clientDetails: clientDetails.data[0],
            });
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },
    getHiddenJobListAPI: async (req, res, next) => {
        const clientId = req.params.clientId;

        try {
            const url = `${process.env.API_CLIENT}/clients?id=${clientId}`;
            const clientDetails = await axios.get(url);
            const totalHiddenJobs = await getJobsList(
                { clientId: clientId,isDeleted:true },
                { createdAt: -1 },

                true, // For processData
                0 // limit(0) == No Limit. Default is 50 in jobsDAO.js. Also --> https://docs.mongodb.com/manual/reference/method/cursor.limit/#zero-value
            );
            return res.render("jobs/hiddenJobList.pug", {
                title: "Jobs List",
                tab: "a3",
                hiddenJobs: totalHiddenJobs,
                clientDetails: clientDetails.data[0],
            });
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },
    addJobForm: async (req, res, next) => {
        // let messages = "";
        // let errors = await validationResult(req);
        // if (!errors.isEmpty()) {
        //   errors.array().forEach((element) => {
        //     messages += "• " + element.msg + "\n"; //<BR>
        //   });
        // }
        // if (messages !== "") {
        //   req.flash("error", messages);
        //   return res.redirect("/jobs");
        // }

        try {
            let clientId = req.params.clientId;
            let users = await User.find();
            // let clientDetails = await Client.findById(clientId);
            let url = process.env.API_CLIENT + "/clients?id=" + clientId;
            let clientDetails = await axios.get(url);
            let pipeline_info = await Pipeline.find({}).populate(
                "genericLabel"
            );
            // or
            //.populate({path:'genericLabel',select:['genericLabel']})
            let domain_info = await Domain.find({});
            res.render("jobs/add.pug", {
                title: "Add New Job",
                tab: "a3",
                editing: false,
                users: users,
                job: {
                    source: { data: "", maxpages: "1",type:""},
                    parser: "",
                    frequency: "",
                    clientId: "",
                    addedBy: "",
                    name: "",
                    _id: "",
                },
                batchsize:"",
                clientDetails: clientDetails.data[0],
                pipeline_info: pipeline_info,
                domain_info: domain_info,
                domain:"",
                city_name:"",
                browser:"",
                editing:false,
                page_type:"",
                city:""


            });
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },

    editJobForm: async (req, res, next) => {
        try {
            let clientId = req.params.clientId;
            let jobId = req.params.jobId;
            let users = await User.find();
            // let clientDetails = await Client.findById(clientId);
            let url = process.env.API_CLIENT + "/clients?id=" + clientId;
            let clientDetails = await axios.get(url);
            let pipeline_info = await Pipeline.find({}).populate(
                "genericLabel"
            );
            let domain_info = await Domain.find({});
            const job = await getJobById(jobId);
            job.source.modifiedData = job.source.data.join("\n");
            res.render("jobs/add.pug", {
                title: "Edit Job",
                tab: "a3",
                editing: true,
                jobSourceType:job.source.type,
                job: job,
                browser:job.source.browser || "",
                domain:job.source.domain || "",
                jobId: jobId,
                users: users,
                clientDetails: clientDetails.data[0],
                pipeline_info: pipeline_info,
                domain_info: domain_info,
                page_type: job.source.page_type || "",
                batchsize: job.source.batchsize != undefined ? job.source.batchsize : job.source.type == "keywords" ? 50 :1,
                city: job.source.city || "",
            });
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },
    hideJob: async (req, res, next) => {
        const jobId = req.params.jobId;
        const clientId = req.params.clientId;
        const job = await Jobs.findById(jobId);
        job.isDeleted = true;
        job.frequency = {};
        job.frequency.type = "ondemand";
        await job.save();
        if(job.isDeleted === true){
        req.flash(
            "successUnsafe",
            `Job <strong>${job.name}</strong> of <strong>${clientId}</strong> Hidden Successfuly`
        );
        }
        else{
            req.flash(
                "errorUnsafe",
                `Job <strong>${job.name}</strong> not Hidden Successfuly`
            );
        }
        res.redirect("back");
    },
    unhideJob: async (req, res, next) => {
        const jobId = req.params.jobId;
        const clientId = req.params.clientId;
        const job = await Jobs.findById(jobId);
        job.isDeleted = false;
        await job.save();
        if(job.isDeleted === false){
        req.flash(
            "successUnsafe",
            `Job <strong>${job.name}</strong> is moved to Active Jobs List of client <strong>${clientId}</strong> successfully.`
        );
        }
        else{
            req.flash(
                "errorUnsafe",
                `Failed to move Job <strong>${job.name}</strong> to Active Jobs List of client <strong>${clientId}</strong>.`
            );
        }
        return res.redirect(`/jobs/${clientId}`);
    },
    getSpiders: async (req, res, next) => {
        let data = req.params.parser.split(",");
        let parser = data[0];
        let spider = data[1];
        let result = await axios.post(
            "https://api.1digitalstack.com/scrapyd/listversions",
            querystring.stringify({
                user: "1ds",
                pass: "ods007",
                project: parser,
                spider: spider,
            }),
            config
        );
        res.json(result.data.response.versions);
    },
    getResults: async (req, res, next) => {
        try {
            let clientId = req.params.clientId;
            let jobId = req.params.jobId;
            let batchId = req.params.batchId;
            let collectionName = req.params.collectionName;
            let keys = [];
            let totalRecords = 0;

            let url = process.env.API_CLIENT + "/clients?id=" + clientId;
            let clientDetails = await axios.get(url);
            // let clientDetails = await Client.findById(clientId);
            let jobStatus = await JobStatus.findById(batchId)
                .populate("jobId")
                .populate("addedBy");
            let data;

            // get collection if collection is defined
            if (!collectionName) {
                data = {};
            }

            if (collectionName) {
                if (
                    !Object.values(mongoose.modelNames()).includes(
                        collectionName + "Model"
                    )
                ) {
                    mongoose.model(
                        collectionName + "Model",
                        new mongoose.Schema(
                            {},
                            { versionKey: false, strict: false }
                        ),
                        collectionName
                    );
                }

                let stuff = mongoose.model(collectionName + "Model");
                totalRecords = await stuff
                    .find({ pipeline_id: batchId })
                    .countDocuments();
                data = await stuff
                    .find({
                        pipeline_id: batchId,
                        // job_id: "5b431dca-9ace-4b46-85bc-a000b34c6be1",
                        // category: "Electronics",
                    })
                    .lean()
                    .limit(1000);

                data.forEach((obj) => {
                    Object.keys(obj).forEach((keyname) => {
                        keys.push(keyname);
                    });
                });
            }

            res.render("jobs/results.pug", {
                title: "Job Results",
                tab: "a3",
                clientDetails: clientDetails.data[0],
                jobStatus: jobStatus,
                results: data,
                totalRecords: totalRecords,
                keys: keys.filter((x, i, a) => a.indexOf(x) === i),
                collectionName: collectionName,
                search_field: req.query.id || "",
            });
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
        return;
        // let categories = await Categories.find().lean();
        await Categories.find({ job_id: jobId })
            .lean()
            .exec((err, data) => {
                data = data.map(function (category) {
                    let cat = {};
                    cat["name"] = category.name;
                    cat["url"] = category.url;
                    if (Array.isArray(category.children)) {
                        cat["children"] = category.children
                            .map((child) => {
                                // console.log(typeof child);
                                if (typeof child === "string") {
                                    return child;
                                }
                            })
                            .filter((value) => {
                                if (value !== "") {
                                    return value;
                                }
                            });
                    } else {
                        cat["children"] = category.children;
                    }

                    cat["id"] = category._id;
                    cat["job_id"] = category.job_id;
                    return cat;
                });
            });
        // let clients = await Client.find({ domain: "lotus" }).lean();

        // let categories = await Categories.find({ job_id: jobId }).lean();
    },

    addJobPost: async (req, res, next) => {
        try {
            // first the validation
            const errors = validationResult(req);

            const {
                name,
                domain,
                domainAlias,
                contactName,
                contactEmail,
                contactPhone,
                clientOwner,
            } = req.body;

            let messages = "";

            if (!errors.isEmpty()) {
                errors.array().forEach((element) => {
                    messages += "• " + element.msg + "<BR>";
                });
            }

            if (messages !== "") {
                req.flash("errorUnsafe", messages);
                // req.session.tmpFormData = {
                //   name: name,
                //   email: email,
                //   userType: userType
                // };
                return res.redirect("/clients/addNew");
            }

            let client = new Client({
                name: name,
                domain: domain,
                domainAlias: domainAlias,
                contactName: contactName,
                contactEmail: contactEmail,
                contactPhone: contactPhone,
                clientOwner: clientOwner,
            });

            let clientSaved = await client.save();
            req.flash(
                "successUnsafe",
                `Client <strong>${name}</strong> added successfully`
            );

            if (clientSaved) {
                let payload = '{ "domain": ' + domain + " }";
                await publishToQueue("keystoneDomains", payload);
            }

            return res.redirect("/clients");
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },
    getJobDetails: async (req, res, next) => {
        try {
            const jobId = req.params.jobId;
            const clientId = req.params.clientId;

            const url = `${process.env.API_CLIENT}/clients?id=${clientId}`;
            const clientDetails = await axios.get(url);

            const jobStatus = await JobStatus.find({
                jobId: jobId,
                clientId: clientId,
            })
                .sort({ createdAt: -1 })
                .populate("addedBy");

            const job = await getJobById(jobId);

            const etlData = await etlConfig.find();

            return res.render("jobs/details.pug", {
                title: "Job Details",
                tab: "a3",
                clientDetails: clientDetails.data[0],
                job: job,
                jobStatus: jobStatus,
                etlData: etlData,
                search_field: req.query.id || "",
            });
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },
    updateFrequency: async (req, res, next) => {
        const jobId = req.body.changeJobId;
        const clientId = req.params.clientId;
        const frequency = convertFrequency(req.body.changeFrequency);

        const job = await Jobs.findById(jobId);
        const oldFrequency = processFrequency(job.frequency);

        job.frequency = frequency;
        console.log("frequency", frequency);
        const newFrequency = processFrequency(frequency);
        await job.save();

        req.flash(
            "successUnsafe",
            `Frequency for Job <strong>${job.name}</strong> updated from "<strong>${oldFrequency}</strong>" to "<strong>${newFrequency}</strong>"`
        );
        res.redirect("/jobs/" + clientId);
    },
    downloadResults: async (req, res, next) => {
        let batchId = req.params.batchId;
        let collectionName = req.params.collectionName;
        let keys = [];
        let filename = "data-" + collectionName + "-" + batchId + ".csv";

        if (
            !Object.values(mongoose.modelNames()).includes(
                collectionName + "Model"
            )
        ) {
            mongoose.model(
                collectionName + "Model",
                new mongoose.Schema({}, { versionKey: false, strict: false }),
                collectionName
            );
        }

        let stuff = mongoose.model(collectionName + "Model");
        let data = await stuff
            .find({
                pipeline_id: batchId,
            })
            .lean();

        data.forEach((obj) => {
            Object.keys(obj).forEach((keyname) => {
                keys.push(keyname);
            });
        });

        let updatedKeys = keys.filter((x, i, a) => a.indexOf(x) === i);
        updatedKeys.sort();

        res.setHeader(
            "Content-disposition",
            `attachment; filename=${filename}`
        );
        res.setHeader("Content-Type", "text/csv");

        const opts = { fields: updatedKeys, withBOM: true };
        parseAsync(data, opts)
            .then((csv) => res.send(csv))
            .catch((err) => console.error(err));
    },
    processPending: async (req, res, next) => {
        const clientId = req.params.clientId;
        const batchId = req.params.batchId;
        const queue = req.body.queue;

        const jobStatus = await JobStatus.findById(batchId)
            .populate("jobId")
            .populate("addedBy");

        // Now get the data from job
        const collectionName = jobStatus.jobId.parser.collections[0]; // take the first entry for now
        const sourceData = jobStatus.jobId.source.data;

        let dbData = [];

        // check if collection is already defined, else define it
        // as a Mongoose Model
        if (
            !Object.values(mongoose.modelNames()).includes(
                collectionName + "Model"
            )
        ) {
            mongoose.model(
                collectionName + "Model",
                new mongoose.Schema({}, { versionKey: false, strict: false }),
                collectionName
            );
        }

        const stuff = mongoose.model(collectionName + "Model");
        const data = await stuff.find({ pipeline_id: batchId }).lean();

        // get data that is crawled and available in the db
        data.forEach((elem) => {
            switch (jobStatus.jobId.source.type) {
                case "keywords":
                    dbData.push(elem.keyword);
                    break;
                case "customasin":
                    dbData.push(elem.asin);
                    break;
                case "customurlasin":
                    dbData.push(elem.source_url);
                    break;
                case "searchbyasin":
                    dbData.push(elem.asin);
                    break;
                case "reviews":
                    dbData.push(elem.asin);
                    break;
                // TEMPORARY:
                // For Philips War Room - Amazon Sale on 01 May 2021 (Vivek / Krishna)
                case "amazonseller":
                    dbData.push(elem.asin);
                    break;
                case "flipkartseller":
                    dbData.push(elem.product_id);
                    break;
            }
        });

        // get the difference between all data in job and the data crawled
        const diff = sourceData.filter(function (n) {
            return !this.has(n);
        }, new Set(dbData));

        if (diff.length > 0) {
            // reinsert into the queue for crawling
            jobStatus.jobId.source.data = diff;
            if (QUEUE[jobStatus.jobId.source.type]) {
                pushToQueue(jobStatus.jobId.source, batchId, queue);
            }
            req.flash(
                "successUnsafe",
                `Total <strong>${diff.length}</strong> Pending Items for Batch <strong>${batchId}</strong> are now being processed.`
            );
        } else {
            req.flash(
                "errorUnsafe",
                `Total <strong>${diff.length}</strong> Pending Items found for Batch <strong>${batchId}</strong>. Not processing.`
            );
        }

        res.redirect(
            `/jobs/${clientId}/${jobStatus.jobId._id}/results/${jobStatus._id}`
        );
    },

    processBlocked: async (req, res, next) => {
        const clientId = req.params.clientId;
        const batchId = req.params.batchId;
        const queue = req.body.queue;

        const clientDetails = await Client.findById(clientId);
        const jobStatus = await JobStatus.findById(batchId)
            .populate("jobId")
            .populate("addedBy");

        // Now get the data from job

        const collectionName = jobStatus.jobId.parser.collections[0]; // take the first entry for now
        const sourceData = jobStatus.jobId.source.data;
       

        let dbData = [];

        // check if collection is already defined, else define it
        // as a Mongoose Model
        if (
            !Object.values(mongoose.modelNames()).includes(
                collectionName + "Model"
            )
        ) {
            mongoose.model(
                collectionName + "Model",
                new mongoose.Schema({}, { versionKey: false, strict: false }),
                collectionName
            );
        }

        const stuff = mongoose.model(collectionName + "Model");
        const data = await stuff
            .find({ pipeline_id: batchId, blocked: true })
            .lean();

        // get data that is crawled and available in the db
        data.forEach((elem) => {
            switch (jobStatus.jobId.source.type) {
                case "customasin":
                    dbData.push({
                        asin: path.basename(elem.source_url),
                    });
                    break;

                case "reviews":
                    dbData.push({
                        asin: elem.asin,
                        starting_page_number: elem.last_page,
                    });
                    break;
            }
        });

        let totalBlocked = dbData.length;
        if (dbData.length > 0) {
            console.log(dbData.length);

            // reinsert into the queue for crawling
            switch (sourceType) {
                case "customasin":
                    sourceData.asin = "";
                    pushToQueue.pushBlockedCustomASIN(
                        JSON.stringify(sourceData),
                        JSON.stringify(parserData),
                        dbData,
                        batchId,
                        queue
                    );
                    break;
                case "reviews":
                    sourceData.asin = "";
                    pushToQueue.pushBlockedReviews(
                        JSON.stringify(sourceData),
                        dbData,
                        batchId,
                        queue
                    );
                    break;
            }

            req.flash(
                "successUnsafe",
                `Total <strong>${totalBlocked}</strong> Blocked Items for Batch <strong>${batchId}</strong> are now being processed.`
            );
        } else {
            req.flash(
                "errorUnsafe",
                `Total <strong>${totalBlocked}</strong> Blocked Items found for Batch <strong>${batchId}</strong>. Not processing.`
            );
        }

        res.redirect(
            `/jobs/${clientDetails._id}/${jobStatus.jobId._id}/results/${jobStatus._id}`
        );
    },
};

module.exports = jobsController;

// function getQueueName(src_type,src_domain){
//   connect with mongodb
//  collection is domains
//find query
//crawlerType is src_type
// domainName is src_domain
// return queue
