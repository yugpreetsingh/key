// This is the admin router
const express = require("express");
const router = express.Router();
// const languageEncoding = require("detect-file-encoding-and-language");
const fs = require('fs');
const { addETLconfig } = require("../controllers/etl");
const { addPrefectServerConfig } = require("../controllers/prefectServerConfig");
const crawlerController = require("../controllers/dbcrawler");
const uploadCsvController = require("../controllers/csvUpload")
const multer  = require('multer');

const addZero = (i) => {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
let storage = multer.diskStorage({
  destination: async function (req, file, cb) {
      const path = '/uploads'
      if(file.mimetype == "text/csv"){
    // If the folder uploads does not exist creating the folder on recursive check
    //? Multer does not create folder by default if it does not exist.
    fs.mkdirSync(path, {recursive:true}) //? Creating the folder "uploads"  only if it does not exist. 
    cb(null, path)
    }
  },
  filename: function (req, file, cb) {

    let originalFileName = file.originalname;
    let originalFileFrgs = originalFileName.split(".");
    const today = new Date();
    const fullYear = today.getFullYear();
    let month = (today.getMonth())+1; // months range from 0 to 11 where 0 is January and 11 is December
    month = month <10 ? "0"+month: month
    const day = addZero(today.getDate());
    const Hours = today.getHours();
    const Mins = today.getMinutes();
    const Secs = today.getSeconds();
    let fileSuffix = " " + [fullYear,"-",month,"-", day].join("") +" "+[Hours,"-", Mins,"-", Secs].join("");

    originalFileFrgs[0] = originalFileFrgs[0] + fileSuffix;
    file.filename = originalFileFrgs.join(".");
    cb(null, file.filename)
    
}
})
const fileFilter=(req,file,cb)=>{
if(file.mimetype ==='text/csv'){
    cb(null,true);
}
else{
    cb(null,false);
   
}
     
}
const upload = multer({ 
storage:storage,
fileFilter:fileFilter
});






router.get("/", (req, res) => {
    res.render("admin/admin");
});
router.get("/etlconfig", (req, res) => {
    res.render("admin/ETL/etlconfig");
});
router.get("/prefectconfig", (req, res) => {
    res.render("admin/prefect/prefectconfig");
})
router.get("/template",uploadCsvController.viewCsv);   
// router.get("/get-csv/template=/:template_selected",uploadCsvController.download);   
router.get("/get-csv/template/:template_selected",uploadCsvController.download);   
router.get("/show_template/:template_selected",uploadCsvController.templateModal);   

router.post("/upload-csv", upload.single('csv'),uploadCsvController.upload);


router.post("/etlconfig/addconfig", addETLconfig);
router.post("/prefectconfig/addconfig", addPrefectServerConfig);
router.post("/registerdomain", crawlerController.addDomain);
router.post("/registerpipeline", crawlerController.addParserPipeline);
router.post("/registerLabel", crawlerController.addGenericLabel);
router.get("/dbcrawler",crawlerController.getGenericLabel)
module.exports = router;
