const mongoose = require("mongoose");
const Domain = require("../models/domain");
const Pipeline = require("../models/parserpipeline");
const GenericLabel = require("../models/genericlabel")


//POST REQUESTS for ADD DOMAIN,ADD PIPELINE and ADD GENERIC lABEL
//GET REQUESTS IS IN THE JOB CONTROLER in function addJobForm and editJobForm for ADD DOMAIN and ADD PIPELINE
const crawlerController = {
    
    addDomain: async (req, res, next) => {
        try {
            const domain_info = new Domain({
                crawlerType: req.body.crawlerType,
                domainName: req.body.domainName.toUpperCase().trim(),
                domainNickName: req.body.domainNickName.trim().replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}),
                queue: req.body.queue.trim(),
                browserInterface: req.body.browserInterface.trim()
                //--Or can use alternative spread operator
                // ...req.body,
            });
            let browserCollection = domain_info["browserInterface"][0].split(" ")
            console.log("Line 23",browserCollection)
            let browserCollection1 = browserCollection[0];
            console.log("Line 25",browserCollection[0])
            let browserCollection2 = browserCollection[1];
            console.log("Line 27",browserCollection[1])
            if (browserCollection1 === "" && browserCollection2 == undefined) {
                req.flash(
                    "errorUnsafe",
                    `Please fill all the Domain related info`
                );
            res.redirect("back")
            return;
            }
            // console.log("Line 37",browserCollection, typeof browserCollection)
            if (browserCollection1.length !== 0){
                domain_info["browserInterface"][0] = browserCollection1
            }
            if (browserCollection2 !== undefined){
                domain_info["browserInterface"][1] = browserCollection2
            }

            for (var key in domain_info._doc) {
                if (
                    domain_info._doc[key] === null ||
                    domain_info._doc[key] === ""
                ) {
                    req.flash(
                        
                        "errorUnsafe",
                        `Please fill all the Domain related info`
                    );
                    res.redirect("back");
                    return;
                }
            }
             /**
             * ? Checking if the new Domain is not already present for selected Crawler
             */
            let all_domains = await Domain.find({}, { domainName: 1,crawlerType:1 });
            // console.log(all_domains)
            for(let domains of all_domains){
                if(domain_info._doc.domainName == domains.domainName && domain_info._doc.crawlerType == domains.crawlerType)
                {
                    req.flash(
                        
                        "errorUnsafe",
                        `Domain is <b> ALREADY </b> present in the Collection for the <b>selected crawler<b>.`
                    );
                    res.redirect("back");
                    return;
                }
            }
            await domain_info.save();
            // res.json(domain_info)
            req.flash("successUnsafe", `New Domain Added`);
            setTimeout(function(){
                // in the version 4.x of Express we can use 'back'
                res.redirect("back");
            },1000)
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },

    
    addParserPipeline: async (req, res, next) => {
        try {
            let pipeline_info = new Pipeline({ 
                genericLabel:req.body.genericLabel,
                jobType:req.body.jobType,
                crawlerType:req.body.crawlerType,
                projectName:req.body.projectName.trim(),
                spiderName:req.body.spiderName.trim(),
                collectionName:req.body.collectionName.trim()
            });
            let collection = pipeline_info["collectionName"][0].split(" ");
            let collection1 = collection[0];
            let collection2 = collection[1];
            let collection3 = collection[2];
            if (collection1 === "" && collection2 == undefined) {
                req.flash(
                    "errorUnsafe",
                    `Please fill all the pipeline related info`
                );
                res.redirect("back");
                return;
            }
            if (collection1.length !== 0) {
                pipeline_info["collectionName"][0] = collection1;
            }
            if (collection2 !== undefined) {
                pipeline_info["collectionName"][1] = collection2;
            }
            if (collection3 !== undefined) {
                pipeline_info["collectionName"][2] = collection3;
            }
            for (var key in pipeline_info._doc) {
                if (
                    pipeline_info._doc[key] === null ||
                    pipeline_info._doc[key] === ""
                ) {
                    req.flash(
                        "errorUnsafe",
                        `Please fill all the pipeline related info`
                    );
                    res.redirect("back");
                    return;
                }
            }
            await pipeline_info.save();
            // console.log(pipeline_info);
            req.flash("successUnsafe", `New Pipeline Added`);

            // in the version 4.x of Express we can use 'back to redirect to the page'
            setTimeout(function(){
                
                res.redirect("back");
            },1000)
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },

    addGenericLabel: async (req, res, next) => {
        try {
            const genericLabel_info = new GenericLabel({
                genericLabel:req.body.genericLabel.trim()
            });
            
                if (
                   genericLabel_info._doc.genericLabel === "" ||  genericLabel_info._doc.genericLabel === null
                ) {
                    req.flash("errorUnsafe",`Please fill Generic Label info`);
                    setTimeout(function(){
                        // in the version 4.x of Express we can use 'back'
                        res.redirect("back");
                    },1000)

                    return;
                }
            /**
             * ? Checking if the new generic Label is not already present
             */
            let all_genericLabels = await GenericLabel.find({},{genericLabel:1})
            for (let genericLabels of all_genericLabels){
                if (genericLabels.genericLabel == genericLabel_info._doc.genericLabel)
                {
                    
                        req.flash(
                            
                            "errorUnsafe",
                            `Generic Label / Crawler Label is <b> ALREADY </b> present in the Collection.`
                        );
                        res.redirect("back");
                        return;
                    }
                
                }
            await genericLabel_info.save();
            req.flash("successUnsafe", `New Generic Label Added`);
            
            setTimeout(function(){
                
                res.redirect("back");
            },1000)
        } catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    },
//Get Request for getting the Generic Label in the Dropdown of crawler.pug in "Select Label for Type of Job" under "Please enter the Parser Pipeline info below".
    getGenericLabel: async (req, res, next) =>{
        try{
            let genericLabel = await GenericLabel.find({});
            res.render("admin/Crawler/crawler.pug",{
                genericLabel:genericLabel

            })

        }
        catch (e) {
            if (!e.statusCode) {
                e.statusCode = 500;
            }
            next(e);
        }
    }

    
};
module.exports = crawlerController;
