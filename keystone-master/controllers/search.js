const JobStatus = require("../models/jobstatus");
const Jobs = require("../models/jobs");
const axios = require("axios");
const searchController = {
    getSearch: async (req, res) => {
        let id = req.query.id;
        id = id.trim();
        id = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
        if (id === "") {
            req.flash("errorUnsafe", `Please Enter a Search value`);
            res.redirect("/");
            return;
        }
        try {
            let findJob = await Jobs.findById(id);
            if (findJob !== null) {
                clientId = findJob.clientId;
                url =
                    "/jobs/" +
                    clientId +
                    "/" +
                    id +
                    "/details?" +
                    new URLSearchParams({
                        id: req.query.id,
                    });
                res.redirect(url);

                return;
            }
        } catch (e) {
            console.log("Job ID Not Found");
        }

        try {
            let findBatch = await JobStatus.findById(id);
            if (findBatch !== null) {
                clientId = findBatch.clientId;
                jobId = findBatch.jobId;
                url =
                    "/jobs/" +
                    clientId +
                    "/" +
                    jobId +
                    "/results/" +
                    id +
                    "?" +
                    new URLSearchParams({
                        id: req.query.id,
                    });
                res.redirect(url);
                return;
            }
        } catch (e) {
            console.log("Batch ID Not Found");
        }
        try {
            let data = await Jobs.find({}, { _id: 1 });
            let client_url = process.env.API_CLIENT + "/clients?id=-1";
            let clients = await axios.get(client_url);
            let job_ids = [];
            let re = new RegExp(id, "i");
            let i = 0;
            data.forEach((x) => {
                i += 1;
                if (re.test(x._id) == true) {
                    job_ids.push(x);
                }
            });
            let search_results = await Jobs.find({
                _id: { $in: job_ids },
            }).sort({ createdAt: -1 });
            let lastRun1 = [];
            let batchId1 = [];
            let clientName = [];
            for (let i = 0; i < search_results.length; i++) {
                var clientID = search_results[i].clientId;
                for (let i = 0; i < clients.data.length; i++) {
                    if (clients.data[i].id === clientID) {
                        clientName.push(clients.data[i].name);
                    }
                }
            }
            for (let i = 0; i < search_results.length; i++) {
                var curr_jobId = search_results[i]._id;

                var cursor = await JobStatus.find({
                    jobId: curr_jobId,
                })
                    .sort({ createdAt: -1 })
                    .limit(1);

                if (cursor.length === 0) {
                    lastRun1.push("Job Not Executed Yet");
                    batchId1.push("Batch Id Not Found");
                } else {
                    lastRun1.push(cursor[0].createdAt);
                    batchId1.push(cursor[0]._id);
                }
            }

            for (let i = 0; i < search_results.length; i++) {
                search_results[i]["lastRun"] = lastRun1[i];
                search_results[i]["batchId"] = batchId1[i];
                search_results[i]["clientName"] = clientName[i];
            }

            let data2 = await JobStatus.find({}, { _id: 1 });
            let batch_ids = [];
            let re2 = new RegExp(id, "i");
            data2.forEach((x) => {
                if (re2.test(x._id) == true) {
                    batch_ids.push(x);
                }
            });

            let search_results2 = await JobStatus.find({
                _id: { $in: batch_ids },
            }).sort({ createdAt: -1 });

            let dateAdded = [];
            let name = [];
            let lastRunBatchId = [];
            let lastRunBatchTime = [];
            let clientName1 = [];
            for (let i = 0; i < search_results2.length; i++) {
                var clientID = search_results2[i].clientId;
                for (let i = 0; i < clients.data.length; i++) {
                    if (clients.data[i].id === clientID) {
                        clientName1.push(clients.data[i].name);
                    }
                }
            }
            for (let i = 0; i < search_results2.length; i++) {
                var curr_jobId = search_results2[i].jobId;

                var cursor = await Jobs.find({ _id: curr_jobId });

                if (cursor.length != 0) {
                    lastRunBatchId.push(cursor[0].lastRunBatchId);
                    dateAdded.push(cursor[0].createdAt);
                    name.push(cursor[0].name);
                    lastRunBatchTime.push(cursor[0].updatedAt);
                }
            }
            for (let i = 0; i < search_results2.length; i++) {
                search_results2[i]["dateAdded"] = dateAdded[i];
                search_results2[i]["name"] = name[i];
                search_results2[i]["lastRunBatchId"] = lastRunBatchId[i];
                search_results2[i]["lastRunBatchTime"] = lastRunBatchTime[i];
                search_results2[i]["clientName"] = clientName1[i];
            }

            if (search_results.length === 1 && search_results2.length === 0) {
                let id = search_results[0]._id;
                let ClientId = search_results[0].clientId;
                let url =
                    "/jobs/" +
                    ClientId +
                    "/" +
                    id +
                    "/details?" +
                    new URLSearchParams({
                        id: req.query.id,
                    });
                res.redirect(url);
                return;
            } else if (
                search_results.length === 0 &&
                search_results2.length === 1
            ) {
                let id = search_results2[0]._id;
                let ClientId = search_results2[0].clientId;
                let JobId = search_results2[0].jobId;

                let url =
                    "/jobs/" +
                    ClientId +
                    "/" +
                    JobId +
                    "/results/" +
                    id +
                    "?" +
                    new URLSearchParams({
                        id: req.query.id,
                    });
                res.redirect(url);

                return;
            } else if (
                search_results.length >= 1 ||
                search_results2.length >= 1
            ) {
                // Removing the duplicates i.e Same data from jobs and jobstatuses
                //table
                let result_object = {};
                search_results.forEach(
                    (obj) => (result_object[obj.lastRunBatchId] = obj)
                );
                search_results2.forEach(
                    (obj) => (result_object[obj._id] = obj)
                );
                let final_result = Object.values(result_object);
                res.render("jobs/searchlist.pug", {
                    title: "Search Results",
                    results: final_result, //final_result,unique_result_array
                    search_field: req.query.id,
                });

                return;
            }

            let name_data = await Jobs.find({}, { name: 1 });
            let job_names = [];
            let re3 = new RegExp(id, "i");

            name_data.forEach((x) => {
                if (re3.test(x.name) == true) {
                    job_names.push(x);
                }
            });

            let search_results3 = await Jobs.find({
                _id: { $in: job_names },
            }).sort({ createdAt: -1 });

            let lastRun2 = [];
            let batchId2 = [];
            let clientName2 = [];
            for (let i = 0; i < search_results3.length; i++) {
                var clientID = search_results3[i].clientId;
                for (let i = 0; i < clients.data.length; i++) {
                    if (clients.data[i].id === clientID) {
                        clientName2.push(clients.data[i].name);
                    }
                }
            }
            for (let i = 0; i < search_results3.length; i++) {
                var curr_jobId = search_results3[i]._id;
                var cursor = await JobStatus.find({
                    jobId: curr_jobId,
                })
                    .sort({ createdAt: -1 })
                    .limit(1);
                if (cursor.length === 0) {
                    lastRun2.push("Job Not Executed Yet");
                    batchId2.push("Batch Id Not Found");
                } else {
                    lastRun2.push(cursor[0].createdAt);
                    batchId2.push(cursor[0]._id);
                }
            }
            for (let i = 0; i < search_results3.length; i++) {
                search_results3[i]["lastRun"] = lastRun2[i];
                search_results3[i]["batchId"] = batchId2[i];
                search_results3[i]["clientName"] = clientName2[i];
            }

            if (search_results3.length >= 1) {
                if (search_results3.length === 1) {
                    let received_id = search_results3[0]._id;
                    let curr_data = await Jobs.findOne({
                        _id: received_id,
                    });
                    let ClientId = curr_data.clientId;
                    let id = curr_data._id;
                    let url =
                        "/jobs/" +
                        ClientId +
                        "/" +
                        id +
                        "/details?" +
                        new URLSearchParams({
                            id: req.query.id,
                        });
                    res.redirect(url);
                    return;
                } else {
                    res.render("jobs/searchlist.pug", {
                        title: "Search Results",
                        results: search_results3,
                        search_field: req.query.id,
                    });
                    return;
                }
            } else {
                req.flash("errorUnsafe", `Search Value not found`);
            }
        } catch (e) {
            req.flash("errorUnsafe", `Search Value not found`);
            console.log(e);
        }
        res.redirect("/");
    },
};
module.exports = searchController;
