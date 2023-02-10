const SOURCE_TYPES = {
    'customasin': 'asin',
    'searchbyasin': 'asin',
    'reviews': 'asin',
    'customurlasin': 'url',
    'keywords': 'keywords'
}

const DOMAINS = {
    "IN": "AMAZON.IN",
    "GLOBAL": "AMAZON.COM",
    "FLIPKART.COM": "FLIPKART.COM"
}

const convertJobParserStructure = parser => {
    const parserCollInfo = parser.split("|");
    const parserInfo = parserCollInfo[0].split(",");
    const pipeline = parserInfo[0];
    const startingSpider = parserInfo[1];
    const collections = parserCollInfo[1].split(",");
  
    return {
      pipeline,
      startingSpider,
      collections
    }
  }

const convertJobStructure = job => {
    let {sourceType, sourceData, parserPipeline, parserCollections, parserStartingSpider, frequency} = job;
  
    const parser = {
        pipeline: parserPipeline,
        collections: parserCollections.split(","),
        startingSpider: parserStartingSpider
    };

    if(sourceType !== "generic"){

        const source = JSON.parse(sourceData);
        
        const { domain, browser, maxpages, screenshot, amazon } = source;
        const data = source[SOURCE_TYPES[sourceType]];
        return {
            source: {
              type: sourceType,
              domain: DOMAINS[domain] || DOMAINS[amazon],
              data: data.split("\r\n").filter(item => item.trim() !== "").map(item => item.trim()),
              browser,
              screenshot: (screenshot && screenshot.toLowerCase() === "true") || false,
              maxpages: maxpages || -1
            },
            parser,
            frequency: convertFrequency(frequency)
          }
    } else {
        return {
            source: {
              type: sourceType,
              data: [sourceData]
            },
            parser,
            frequency: convertFrequency(frequency)
        }
    }
};


const convertJobStatusStructure = job => {
    let {sourceType, sourceData, parserPipeline, parserCollections, parserStartingSpider} = job;
  
    const parser = {
        pipeline: parserPipeline,
        collections: (parserCollections || "").split(","),
        startingSpider: parserStartingSpider
    };

    if(sourceType !== "generic"){

        const source = JSON.parse(sourceData);
        
        const { domain, browser, maxpages, screenshot, amazon } = source;
        const data = source[SOURCE_TYPES[sourceType]];
        return {
            source: {
              type: sourceType,
              domain: DOMAINS[domain] || DOMAINS[amazon],
              data: data.split("\r\n").filter(item => item.trim() !== "").map(item => item.trim()),
              browser,
              screenshot: (screenshot && screenshot.toLowerCase() === "true") || false,
              maxpages: maxpages || -1
            },
            parser
          }
    } else {
        return {
            source: {
              type: sourceType,
              data: [sourceData]
            },
            parser
        }
    }
};
  
  
  const convertFrequency = frequency => {
    const frequencyArr = frequency.split("|");
    const frequencyDay = frequencyArr[0];
    if(frequencyArr.length > 1){
        const frequencyTimes = frequencyArr[1].split(',').map(time => {
            const timeArray = time.split(":");
            return {
              hours: timeArray[0] * 1,
              minutes: timeArray[1] * 1 || 0
            }
        });
        return {
            type: "scheduled",
            day: frequencyDay,
            times: frequencyTimes 
          }
    } else {
        return {
            type: "ondemand"
        }
    }
  }

// constants
const dbName = 'keystone';
const collectionName = 'jobs';
const JobStatus = 'jobstatuses'
const sourceDb = db.getSiblingDB(dbName);

const filters = {
    source: {
        $exists: false
    },
    parser: {
        $exists: false
    }
}

var cursor = sourceDb[collectionName].find(filters).noCursorTimeout();

cursor.forEach(function(doc) {
    const convertedJobSchema = convertJobStructure(doc); 
    sourceDb[collectionName].updateOne({
        _id: doc._id
    }, {
        $set: convertedJobSchema,
        $unset: {
            parserPipeline: "",
            parserCollections: "",
            parserStartingSpider: "",
            sourceType: "",
            sourceData: ""
        }
    });
});
cursor.close();


var cursor = sourceDb[JobStatus].find(filters).noCursorTimeout();

cursor.forEach(function(doc) {
    const convertedJobStatusSchema = convertJobStatusStructure(doc); 
    sourceDb[JobStatus].updateOne({
        _id: doc._id
    }, {
        $set: convertedJobStatusSchema,
        $unset: {
            parserPipeline: "",
            parserStartingSpider: "",
            sourceType: "",
            sourceData: ""
        }
    });
});
cursor.close();