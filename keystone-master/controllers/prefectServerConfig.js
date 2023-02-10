const prefectServerConfig = require("../models/prefectServerConfig");
const prefectServer = require("../models/prefectServerConfig");
const userModel = require("../models/user");

const addPrefectServerConfig = async (req, res, next) => {
    // check if ptovided config is already available or not
    try {
        let isPresent = await prefectServer.findOne({ apolloUri: req.body.apolloUri });
        if (isPresent !== null) {
            res.send("This prefect server config already exist.")
        } else {
            let userObjectId = await userModel.findOne({ email: req.session.passport.user.email });

            let PrefectServerConfig = new prefectServer({
                name: req.body.serverName,
                dashboardUri: req.body.dashboardUri,
                apolloUri: req.body.apolloUri,
                comment: req.body.serverComment,
                addedBy: userObjectId
            })
            await PrefectServerConfig.save();
            res.json(prefectServerConfig);
        }
    } catch (err) {
        console.log(err)
    }
};

const getAllPrefectServerConfig = async (req, res, next) => {
    try {
        let requiredPrefectServer = await prefectServer.find();
        res.json({ prefectServerInfo: requiredPrefectServer });
    } catch (err) {
        console.log(err);
    }
};

const getPrefectServerByUri = async (req, res, next) => {
    try {
        let requiredPrefectServer = await prefectServer.findOne({ apolloUri: req.body.apolloUri })
        res.json({ prefectServerInfo: requiredPrefectServer });
    } catch (err) {
        console.log(err);
    }
};

module.exports = { addPrefectServerConfig, getAllPrefectServerConfig, getPrefectServerByUri };