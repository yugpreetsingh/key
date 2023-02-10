const { publishToQueue } = require("../util/amqp");

let browsers_desktop = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Brave Chrome/83.0.4103.116 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.146 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
];

let browsers_mobile = [
    "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/83.0.4103.63 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.60 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; LM-Q720) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.60 Mobile Safari/537.36",
];

// PushToQueue replace methods pushKeywords, pushCustomASIN, pushCustomURLASIN, pushSearchByASIN, pushReviews
// Only Keywords chunked in 10 size, why not others
const pushToQueue = async (src,parser, batchId, queue) => {
    const SEED_TYPE = {
        keywords: "keywords",
        customasin: "asin",
        customurlasin: "url",
        searchbyasin: "asin",
        reviews: "asin",
        // TEMPORARY:
        // Philips War Room - Amazon Sale on 01 May 2021 (Vivek / Krishna)
        amazonseller: "asin",
        flipkartseller: "product_id",
    };

    // Reverse Backward Compatibility
    // 1. If maxpages (new) is provided, modify browser in old syntax
    if (src.maxpages) {
        src.browser = src.browser + "|" + src.maxpages;
    }

    let windowsize = "1280,720";
    let browser =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36";

    // Prepare Data
    if (src.browser.split("|")[0] === "desktop") {
        windowsize = "1366,768";
        browser =
            browsers_desktop[
                Math.floor(Math.random() * browsers_desktop.length) + 1 - 1
            ];
    } else if (src.browser.split("|")[0] === "mobile") {
        windowsize = "360,640";
        browser =
            browsers_mobile[
                Math.floor(Math.random() * browsers_mobile.length) + 1 - 1
            ];
    }

    // break the data in chunk of 10
    // and then publish them in queue
    let chunkData;
    let batchCount = 1;
    let totalDataLength = src.data.length;

    while (src.data.length) {
        chunkData = src.data.splice(
            0,
             // src.type === "keywords" ? process.env.CHUNK_SIZE : 1
             // parser.pipeline==="blinkit_product_sel_fetcher"?25:src.type === "keywords" ? process.env.CHUNK_SIZE :1
             typeof src.batchsize == "number" ? src.batchsize : 1
            
        );
        // console.log("Line 85",src.batchsize)
        const domain = src.domain.replace("AMAZON.", "");
        const payload = {
            seed_type: SEED_TYPE[src.type] || "",
            seeds: chunkData,
            amazon: domain, // === "COM" ? "GLOBAL" : "IN", // "FR" "US" "GLOBAL", // temporary until the amazon key is deprecated
            domain: src.domain,
            page_type: src.page_type || "serp",
            max_pages: src.browser.split("|")[1] || -1,
            renderer: src.browser.split("|")[0],
            "window-size": windowsize,
            "user-agent": browser,
            pipeline_id: batchId,
            screenshot: src.screenshot ? "yes" : "no",
            proxies: process.env.PROXY_LIST.split(","),
            proxy_type: src.proxytype || "",
            fetch_sellers: src.sellerinfo || "",
            batch: batchCount,
            total_batches: Math.ceil(
                totalDataLength /
                // (src.type === "keywords" ? process.env.CHUNK_SIZE : 1)
                //  (parser.pipeline==="blinkit_product_sel_fetcher"?25:src.type === "keywords" ? process.env.CHUNK_SIZE :1)
                src.batchsize
            ),
            language:src.crawlinglanguage
        };
        // Doing the following for Bigbasket. For BB, each message needs to have its own city and pin code
        // For this we had to replicate the pushtoqueue functionality including changing of batchCount
        if (typeof src.city == "object" && Object.keys(src.city).length) {
            let cities = [];
            for (city in src.city) {
                let pincodes = src.city[city].split(",");

                pincodes.forEach((pin) => {
                    cities.push({ city, pin });
                });
            }

            cities.forEach(async (city) => {
                payload["city"] = city.city;
                payload["pincode"] = city.pin;
                payload["total_batches"] = cities.length;
                payload["batch"] = batchCount;

                batchCount = batchCount + 1;
                console.log(payload);
                await publishToQueue(queue, JSON.stringify(payload));
                console.log("Published to Queue --> ", queue, chunkData);
            });
        } else {
            batchCount = batchCount + 1;
            console.log(payload);
            await publishToQueue(queue, JSON.stringify(payload));
            console.log("Published to Queue --> ", queue, chunkData);
        }
    }
};

const pushKeywords = async (src, batchId, queue) => {
    let sourceData = JSON.parse(src);
    let totalKeywords = sourceData.keywords.split("\n");

    // Reverse Backward Compatibility
    // 1. If maxpages (new) is provided, modify browser in old syntax
    if (sourceData.maxpages) {
        sourceData.browser = sourceData.browser + "|" + sourceData.maxpages;
    }

    // TO-DO - following array manipulation can be done better
    let cleanKeywords = [];
    totalKeywords.forEach((keyword) => {
        cleanKeywords.push(keyword.replace("\r", ""));
    });
    totalKeywords = cleanKeywords;

    let payload = {};
    // let renderer = "window-size=1280,720";
    let windowsize = "1280,720";
    let browser =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36";

    // Prepare Data
    if (sourceData.browser.split("|")[0] === "desktop") {
        windowsize = "1366,768";
        browser =
            browsers_desktop[
                Math.floor(Math.random() * browsers_desktop.length) + 1 - 1
            ];
    } else if (sourceData.browser.split("|")[0] === "mobile") {
        windowsize = "360,640";
        browser =
            browsers_mobile[
                Math.floor(Math.random() * browsers_mobile.length) + 1 - 1
            ];
    }

    // break the keywords in chunk of 10
    // and then publish them in queue
    let chunkKeywords;
    while (totalKeywords.length) {
        chunkKeywords = totalKeywords.splice(0, process.env.CHUNK_SIZE);
        payload = {
            seeds: chunkKeywords,
            amazon: sourceData.amazon, // "FR" "US" "GLOBAL",
            domain: sourceData.domain,
            max_pages: sourceData.browser.split("|")[1],
            renderer: sourceData.browser.split("|")[0],
            "window-size": windowsize,
            "user-agent": browser,
            pipeline_id: batchId,
        };
        console.log(payload);
        await publishToQueue(queue, JSON.stringify(payload));
        console.log("Published to Queue --> ", chunkKeywords);
    }
};

const pushCustomASIN = async (src, batchId, queue) => {
    let sourceData = JSON.parse(src);
    let totalASINs = sourceData.asin.split("\n");

    // TO-DO - following array manipulation can be done better
    let cleanASINs = [];
    totalASINs.forEach((asin) => {
        cleanASINs.push(asin.replace("\r", ""));
    });
    totalASINs = cleanASINs;

    let payload = {};
    // let renderer = "window-size=1280,720";
    let windowsize = "1280,720";
    let browser =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36";

    // Prepare Data
    if (sourceData.browser === "desktop") {
        windowsize = "1366,768";
        browser =
            browsers_desktop[
                Math.floor(Math.random() * browsers_desktop.length) + 1 - 1
            ];
    } else if (sourceData.browser === "mobile") {
        windowsize = "360,640";
        browser =
            browsers_mobile[
                Math.floor(Math.random() * browsers_mobile.length) + 1 - 1
            ];
    }

    // break the keywords in chunk of 10
    // and then publish them in queue
    let chunkASINs;
    while (totalASINs.length) {
        chunkASINs = totalASINs.splice(0, 1); //process.env.CHUNK_SIZE);
        payload = {
            seed_type: "asin",
            seeds: chunkASINs,
            amazon: sourceData.amazon, // "FR" "US" "GLOBAL"
            renderer: sourceData.browser,
            screenshot: sourceData.screenshot,
            "window-size": windowsize,
            "user-agent": browser,
            pipeline_id: batchId,
            proxies: process.env.PROXY_LIST.split(","),
        };
        console.log(payload);
        await publishToQueue(queue, JSON.stringify(payload));
        console.log("Published to Queue --> ", chunkASINs);
    }
};

const pushCustomURLASIN = async (src, batchId, queue) => {
    let sourceData = JSON.parse(src);
    let totalURLs = sourceData.url.split("\n");

    // TO-DO - following array manipulation can be done better
    let cleanURLs = [];
    totalURLs.forEach((url) => {
        cleanURLs.push(url.replace("\r", ""));
    });
    totalURLs = cleanURLs;

    let payload = {};
    // let renderer = "window-size=1280,720";
    let windowsize = "1280,720";
    let browser =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36";

    // Prepare Data
    if (sourceData.browser === "desktop") {
        windowsize = "1366,768";
        browser =
            browsers_desktop[
                Math.floor(Math.random() * browsers_desktop.length) + 1 - 1
            ];
    } else if (sourceData.browser === "mobile") {
        windowsize = "360,640";
        browser =
            browsers_mobile[
                Math.floor(Math.random() * browsers_mobile.length) + 1 - 1
            ];
    }

    // break the keywords in chunk of 10
    // and then publish them in queue
    let chunkURLs;
    while (totalURLs.length) {
        chunkURLs = totalURLs.splice(0, 1); //process.env.CHUNK_SIZE);
        payload = {
            seed_type: "url",
            seeds: chunkURLs,
            amazon: sourceData.amazon, // "FR" "US" "GLOBAL"
            renderer: sourceData.browser,
            screenshot: sourceData.screenshot,
            "window-size": windowsize,
            "user-agent": browser,
            pipeline_id: batchId,
            // proxies: process.env.PROXY_LIST.split(","),
        };
        console.log(payload);
        await publishToQueue(queue, JSON.stringify(payload));
        console.log("Published to Queue --> ", chunkURLs);
    }
};

const pushSearchByASIN = async (src, batchId, queue) => {
    let sourceData = JSON.parse(src);
    let totalASINs = sourceData.asin.split("\n");

    // TO-DO - following array manipulation can be done better
    let cleanASINs = [];
    totalASINs.forEach((asin) => {
        cleanASINs.push(asin.replace("\r", ""));
    });
    totalASINs = cleanASINs;

    let payload = {};
    // let renderer = "window-size=1280,720";
    let windowsize = "1280,720";
    let browser =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36";

    // Prepare Data
    if (sourceData.browser === "desktop") {
        windowsize = "1366,768";
        browser =
            browsers_desktop[
                Math.floor(Math.random() * browsers_desktop.length) + 1 - 1
            ];
    } else if (sourceData.browser === "mobile") {
        windowsize = "360,640";
        browser =
            browsers_mobile[
                Math.floor(Math.random() * browsers_mobile.length) + 1 - 1
            ];
    }

    // break the keywords in chunk of 10
    // and then publish them in queue
    let chunkASINs;
    while (totalASINs.length) {
        chunkASINs = totalASINs.splice(0, process.env.CHUNK_SIZE);
        payload = {
            seed_type: "asin",
            seeds: chunkASINs,
            amazon: sourceData.amazon, // "FR" "US" "GLOBAL"
            renderer: sourceData.browser,
            screenshot: sourceData.screenshot,
            "window-size": windowsize,
            "user-agent": browser,
            pipeline_id: batchId,
            proxies: process.env.PROXY_LIST.split(","),
        };
        console.log(payload);
        await publishToQueue(queue, JSON.stringify(payload));
        console.log("Published to Queue --> ", chunkASINs);
    }
};

const pushReviews = async (src, batchId, queue) => {
    let sourceData = JSON.parse(src);
    let totalASINs = sourceData.asin.split("\n");

    // TO-DO - following array manipulation can be done better
    let cleanASINs = [];
    let updateASIN = "";
    totalASINs.forEach((asin) => {
        updateASIN = asin.replace("\r", "");

        if (sourceData.domain === "FLIPKART.COM") {
            updateASIN = JSON.stringify({
                item_id: updateASIN.split(":")[0],
                pid: updateASIN.split(":")[1],
            });
        }

        cleanASINs.push(updateASIN);
    });
    totalASINs = cleanASINs;

    let payload = {};
    // let renderer = "window-size=1280,720";
    let windowsize = "1280,720";
    let browser =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36";

    // Prepare Data
    if (sourceData.browser === "desktop") {
        windowsize = "1366,768";
        browser =
            browsers_desktop[
                Math.floor(Math.random() * browsers_desktop.length) + 1 - 1
            ];
    } else if (sourceData.browser === "mobile") {
        windowsize = "360,640";
        browser =
            browsers_mobile[
                Math.floor(Math.random() * browsers_mobile.length) + 1 - 1
            ];
    }

    // break the keywords in chunk of 10
    // and then publish them in queue
    // NOTE: ALWAYS 1 CHUNK SIZE FOR REVIEWS
    let chunkASINs;
    while (totalASINs.length) {
        chunkASINs = totalASINs.splice(0, 1); //process.env.CHUNK_SIZE);
        payload = {
            seed_type: "asin",
            seeds: chunkASINs,
            amazon: sourceData.amazon, // "FR" "US" "GLOBAL"
            domain: sourceData.domain, // Flipkart.com etc.
            renderer: sourceData.browser,
            screenshot: sourceData.screenshot,
            "window-size": windowsize,
            "user-agent": browser,
            pipeline_id: batchId,
            proxies: process.env.PROXY_LIST.split(","),
        };
        console.log(payload);
        await publishToQueue(queue, JSON.stringify(payload));
        console.log("Published to Queue --> ", chunkASINs);
    }
};

const pushBlockedReviews = async (src, blocked, batchId, queue) => {
    let sourceData = JSON.parse(src);

    let payload = {};
    // let renderer = "window-size=1280,720";
    let windowsize = "1280,720";
    let browser =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36";

    // Prepare Data
    if (sourceData.browser === "desktop") {
        windowsize = "1366,768";
        browser =
            browsers_desktop[
                Math.floor(Math.random() * browsers_desktop.length) + 1 - 1
            ];
    } else if (sourceData.browser === "mobile") {
        windowsize = "360,640";
        browser =
            browsers_mobile[
                Math.floor(Math.random() * browsers_mobile.length) + 1 - 1
            ];
    }

    // break the keywords in chunk of 10
    // and then publish them in queue
    // NOTE: ALWAYS 1 CHUNK SIZE FOR REVIEWS
    let chunkASINs;
    blocked.forEach((item) => {
        chunkASINs = blocked.splice(0, 1); //process.env.CHUNK_SIZE);
        payload = {
            seed_type: "asin",
            seeds: [item.asin],
            amazon: sourceData.amazon, // "FR" "US" "GLOBAL"
            renderer: sourceData.browser,
            screenshot: sourceData.screenshot,
            "window-size": windowsize,
            "user-agent": browser,
            pipeline_id: batchId,
            starting_page_number: parseInt(item.starting_page_number),
            proxies: process.env.PROXY_LIST.split(","),
        };
        // console.log(payload);
        // await publishToQueue(queue, JSON.stringify(payload));
        // console.log("Published to Queue --> ", chunkASINs);
    });
};

const pushBlockedCustomASIN = async (src, blocked, batchId, queue) => {
    let sourceData = JSON.parse(src);

    let payload = {};
    // let renderer = "window-size=1280,720";
    let windowsize = "1280,720";
    let browser =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36";

    // Prepare Data
    if (sourceData.browser === "desktop") {
        windowsize = "1366,768";
        browser =
            browsers_desktop[
                Math.floor(Math.random() * browsers_desktop.length) + 1 - 1
            ];
    } else if (sourceData.browser === "mobile") {
        windowsize = "360,640";
        browser =
            browsers_mobile[
                Math.floor(Math.random() * browsers_mobile.length) + 1 - 1
            ];
    }

    // break the keywords in chunk of 10
    // and then publish them in queue
    blocked.forEach(async (item) => {
        // chunkASINs = blocked.splice(0, 1); //process.env.CHUNK_SIZE);
        payload = {
            seed_type: "asin",
            seeds: [item.asin],
            amazon: sourceData.amazon, // "FR" "US" "GLOBAL"
            renderer: sourceData.browser,
            screenshot: sourceData.screenshot,
            "window-size": windowsize,
            "user-agent": browser,
            pipeline_id: batchId,
            proxies: process.env.PROXY_LIST.split(","),
        };
        // console.log(payload);
        await publishToQueue(queue, JSON.stringify(payload));
        console.log("Blocked Requests Published to Queue --> ", item);
    });
};

module.exports = {
    pushToQueue,
    pushKeywords,
    pushCustomASIN,
    pushCustomURLASIN,
    pushReviews,
    pushSearchByASIN,
    pushBlockedReviews,
    pushBlockedCustomASIN,
};
