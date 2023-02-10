const express = require("express")
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const uploadCsvController =  {
    viewCsv:async (req,res,next) =>{
  
    res.render("admin/csvUpload.pug");
    },
    templateModal: async (req,res,next)=>{
      try {
        // let url = "http://127.0.0.1:8000/get-csv?template="
        let url = process.env.API_CSVDOWNLOAD + "?template=";
        let template = req.params["template_selected"]
        url += template
        let data = await axios.get(url)
        const fileData = data.data
        console.log("Headers are",(fileData))
        res.send(fileData)
        
       
      }
      catch (e) {
        if (!e.statusCode) {
          e.statusCode = 500;
        }
        next(e);
        return;
      }
    },
    download: async (req, res, next) => {
  
      try {
        // let url = "http://127.0.0.1:8000/get-csv?template="
        let url = process.env.API_CSVDOWNLOAD + "?template=";
        let template = req.params["template_selected"]
        url += template
        let data = await axios.get(url)
        let fileData = data.data.split("\n")
        // writing only the first row i.e. column names of file data
        let templateHeaders=fileData[0]
        const fileName = template + '.csv'
        const fileType = 'text/csv'
      
        res.writeHead(200, {
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Type': fileType,
        })
        const download = Buffer.from(templateHeaders, 'utf-8')
        res.end(download);
      
        

      } catch (e) {
        if (!e.statusCode) {
          e.statusCode = 500;
        }
        next(e);
        return;
      }
    },
   upload: async(req,res,next)=>{
    try{
      
 let name = req.session.passport.user.displayName
 let email = req.session.passport.user.email
 let applyValidation = req.body.applyValidation
 let template = req.body.selectedTemplatesUpload
 if (applyValidation){
    applyValidation = "True"
 }
 else{
  applyValidation = "False"
 }
 if(req.file === undefined){
     req.flash(
         `errorUnsafe`,
         `Template Selected:${template}<br>`,
         `Error: Only CSV files can be uploaded<br>`,
     )
     setTimeout(function(){
         // in the version 4.x of Express we can use 'back'
         res.redirect("back");
     },2000)
     
 }
 else{
  let filename_uploaded = req.file.filename;
  let data = new FormData();
  data.append('csv', fs.createReadStream('/uploads/'+filename_uploaded));
  data.append('Template_Filled',template);
  data.append('Name', name);
  data.append('Email',email);
  data.append('Validation_Applied',applyValidation)
  var config = {
    method: 'post',
    // url: 'http://localhost:8000/upload-csv',
    url: process.env.API_CSVUPLOAD,
    headers: { 
      ...data.getHeaders()
    },
    data : data
  };
  data = JSON.stringify(data)

  axios(config)
  .then(function (response) {
    if(response.data.status === false){
      response_success = "Unsuccessful Dump"
      req.flash(
      `errorUnsafe`,
      `Template Selected: ${template}<br>`,
      `Message: ${response.data.message}<br>`,
      `Status: ${response_success}`
      )
      
    }
    else{
      response_success = "Successful  Dump"
    
    req.flash(
      `successUnsafe`,
      `Template Selected: ${template}<br>`,
      `Message: ${response.data.message}<br>`,
      `Status: ${response_success}`
      
      

  )}
  })
  .catch(function (error) {
    console.log(error);
  });
  
  
  setTimeout(function(){
      // in the version 4.x of Express we can use 'back'
      res.redirect("back");
  },2000)
  
  
}}
catch (e) {
  if (!e.statusCode) {
      e.statusCode = 500;
  }
  next(e);
  return;
}

}}

    
module.exports = uploadCsvController;