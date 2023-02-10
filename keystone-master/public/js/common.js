// Displaying the list of pincode cities for Keywords type of Job
function showDomain(domain, isEditMode) {
    domain = domain.replace(/\./g, "_");
    $("#WWW_BIGBASKET_COM").hide();
    $("#WWW_GROFERS_COM").hide();
    $("#BLINKIT_COM").hide();
    $("#WWW_DMART_IN").hide();
    $("#WWW_JIOMART_COM").hide();
    $('#WWW_SWIGGY_COM').hide();
    $("#WWW_AMAZON_IN").hide();
    $("#AMAZON_IN_PANTRY_FRESH").hide();
    $("#FLIPKART_COM").hide();
    $("#FLIPKART_COM_GROCERY").hide();
    // console.log(isEditMode)

    // Reset values For Pantry/Fresh/Grocery
    if (isEditMode == false) {
        document.getElementById("sourceData[keywords][page_type][amz]").value =
            "serp";
        document.getElementById("sourceData[keywords][page_type][fk]").value =
            "serp";
    }
    // if (isEditMode == false && domain == "FLIPKART_COM"){
    //     console.log(true)
    // document.getElementById("sourceData[keywords][page_type]").value = "serp";
    // }
    // domain = domain.replace(/\./g, "_");
    if (domain !== "") {
        $("#" + domain).show();
    }
}
let currentSourceType 
function showSourceType(sourceType) {
    currentSourceType = sourceType
    $("#generic").hide();
    $("#categories").hide();
    $("#keywords").hide();
    $("#customasin").hide();
    $("#customurlasin").hide();
    $("#searchbyasin").hide();
    $("#reviews").hide();
    $("#amazonseller").hide();
    $("#flipkartseller").hide();
    if (sourceType !== "") {
        $("#" + sourceType).show();
    }
}
// Displaying the list of pincode cities for CustomAsin type of Job 
function showCurrentDomain(domain, isEditMode){
    if (domain !== "AMAZON-IN-SELENIUM" || domain !== "FLIPKART-COM-SELENIUM" || domain !== "NYKAA-COM-SELENIUM"){
    domain = domain.replace(/\./g, "-");
    }
    $("#WWW-BIGBASKET-COM").hide();
    $("#BLINKIT-COM").hide();
    $("#WWW-SWIGGY-COM").hide();
    $("#NYKAA-COM-SELENIUM").hide();
    $("#AMAZON-IN-SELENIUM").hide();
    $("#AMAZON-IN-PANTRY-FRESH").hide();
    $("#FLIPKART-COM-SELENIUM").hide();
    $("#FLIPKART-COM-GROCERY").hide();
    $("#FLIPKART-COM").hide(); // Non selenium/regular

    // Reset values For Pantry/Fresh/Grocery
    if (isEditMode == false) {
        document.getElementById("sourceData[customasin][page_type][amazon]").value = "marketplace";
        document.getElementById("sourceData[customasin][page_type][flipkart]").value = "marketplace"
    }
    if (domain !== "") {
        $("#" + domain).show();
    }
}
// meant for Amazon.in Pantry / Fresh dropdown (for Cities)
function showAZSearch(page_type) {
    // console.log(page_type)
    let showDiv = false;
    $("#AMAZON_IN_PANTRY_FRESH").hide();
    if (page_type == "pantry" || page_type == "fresh") {
        showDiv = true;
    }
    if (showDiv) {
        $("#AMAZON_IN_PANTRY_FRESH").show();
    }
}
// meant for AMAZON-IN-SELENIUM CustomAsin type job Pantry and Fresh city dropdown
function showAmazonCustomAsin(page_type){
    let showDiv = false;
    $("#AMAZON-IN-PANTRY-FRESH").hide();
    if (page_type == "pantry" || page_type == "fresh") {
        showDiv = true;
    }
    if (showDiv) {
        $("#AMAZON-IN-PANTRY-FRESH").show();
    }
}

// meant for FLIPKART-COM-SELENIUM CustomAsin type job Grocery city dropdown
function showFlipkartCustomAsin(page_type){
    let showDiv = false;
    $("#FLIPKART-COM-GROCERY").hide();
    if (page_type == "grocery") {
        showDiv = true;
    }
    if (showDiv) {
        $("#FLIPKART-COM-GROCERY").show();
    } 
}
// meant for Flipkart.com (Grocery) dropdown (for Cities)

function showFlipSearch(page_type) {
    // console.log(page_type)
    let showDivFlip = false;
    $("#FLIPKART_COM_GROCERY").hide();
    if (page_type == "grocery") {
        showDivFlip = true;
    }

    if (showDivFlip) {
        $("#FLIPKART_COM_GROCERY").show();
        // console.log(showDivFlip)
    }
}

function removeCity(city) {
    $("#" + city + "name").remove();
    $("#" + city)
        .val(null)
        .parent()
        .remove();
    $("#" + city + "name-clear")
        .parent()
        .remove();
}
// Adding city field with input box and remove/delete button for keywords type of job.
function addPincode(city, divid, citypin) {
    // if (isEditMode == false) {

    // console.log(citypin)
    if ($("#" + city).length == false) {
        $("#" + divid).append(
// <<<<<<< HEAD
            `<div class='input-group input-group-sm mb-2'><span class='input-group-text' id='${
                city + "name"
            }'>${city}</span>
                 <input type="text" name="sourceData[keywords][city][${city}]" id="${city}" class="form-control " onblur="pincodeValidate('${city}')" value = "${citypin}" placeholder="Pincode for ${city}">  
            <button type="button" id='${
                city + "name-clear"
            }' onclick = removeCity('${city}') class="btn btn-sm btn-danger"><i class="fa fa-times"></i></button></div>`
// =======
//             `<div class='col-sm-2 col-form-label mb-4' id='${city + "name"
//             }'>${city}</div>
//                  <div class="col-sm-8"><input type="text" name="sourceData[keywords][city][${city}]" id="${city}" class="form-control mb-2" onblur="pincodeValidate('${city}')" value = "${citypin}" placeholder="Pincode for ${city}"></div>
//             <div class="col-sm-2"><button type="button" id='${city + "name-clear"
//             }' onclick = removeCity('${city}')  style="background-color:red;color:white;">X</button></div>`
// >>>>>>> 684da65d266c988419b74a0c5645047950a58cc5
        );
    }
}
// Adding city field with input box and remove/delete button for customasin type of job.
function addPincodeCustomAsin(customasincity, customasindivid, customasincitypin) {
    if ($("#"  + customasincity).length == false) {
        $("#" + customasindivid).append(
            `<div class='input-group input-group-sm mb-2'><span class='input-group-text' id='${
                customasincity  +  "name"
            }'>${customasincity}</span>
                 <input type="text" name="sourceData[customasin][city][${customasincity}]" id="${customasincity}" class="form-control " onblur="pincodeValidate('${customasincity}')" value = "${customasincitypin}" placeholder="Pincode for ${customasincity}">  
            <button type="button" id='${
                customasincity  + "name-clear"
            }' onclick = removeCity('${customasincity}') class="btn btn-sm btn-danger"><i class="fa fa-times"></i></button></div>`
        );
    }
}
function pincodeValidate(city,customasincity) {
    let pincodes = document.getElementById(city);
    if (pincodes != null){
        // console.log("--123",pincodes)
        // regex to allow ONLY numbers, spaces and comma => /^[0-9, ]+$/
        let onlyNumbersAndSpaces = /^[0-9, ]+$/;
        if (!onlyNumbersAndSpaces.test(pincodes.value)) {
            alert(`Invalid pincodes for ${city}`);
        }
    }
    else if (pincodes === null)   {
        let pincodes = document.getElementById(customasincity);
        if(pincodes !== null){
        let onlyNumbersAndSpaces = /^[0-9, ]+$/;
        if (!onlyNumbersAndSpaces.test(pincodes.value)) {
            alert(`Invalid pincodes for ${customasincity}`);
        }
        }
    }

}
function copyToClipboard(element) {
    var $temp = $("<textarea>");
    
    $("body").append($temp);
    $temp.val($(element).text()).select();
    console.log($temp.val($(element).text()).select())
    document.execCommand("copy");

    // alert($(element).text());
    // console.info("Line 107",$(element).text())
    // console.log("Line 108",$temp)
    // $temp.remove();
    // console.log("Line 110",$temp.remove())
}

function onSubmitPincodeValidation() {
    // Boolean to set true if all the cities have valid pincodes
    let allow = false;
    // Object having city name as key and true or false as value if all the pincodes are correct
    let city_pincode_allow = {};
    // Get the domain
    if (currentSourceType === "keywords"){
        let domain = document.getElementById("sourceData[keywords][domain]");
        // if domain == 'WWW.GROFERS.COM', pincode_tables = pincodesgf
        // if domain == 'WWW.BIGBASKET.COM' pincode_tables = pincodesbb
        // if domain == 'WWW.AMAZON.IN' pincode_tables = pincodeAMZIN
        // in all other cases, pincodes are not applicable.
        let pincode_id = null;
        if (domain.value === "WWW.GROFERS.COM") {
            pincode_id = "pincodesgf";
        }
        if (domain.value === "BLINKIT.COM"){
            pincode_id = "pincodesbk"
        }
        else if(domain.value === "WWW.SWIGGY.COM"){
            pincode_id = "pincodessg"
        }
        else if (domain.value === "WWW.BIGBASKET.COM") {
            pincode_id = "pincodesbb";}
        else if (domain.value === "WWW.JIOMART.COM") {
            pincode_id = "pincodesjm";
        } 
        else if (domain.value === "WWW.DMART.IN") {
            pincode_id = "pincodesdm";
        } 
        else if (domain.value === "WWW.AMAZON.IN") {
            pincode_id = "pincodesAMZIN";
        } else if (domain.value === "FLIPKART.COM") {
            pincode_id = "pincodesFLIPKART";
        } else {
            pincode_id = null;
        }
        // Get the HTML element where pincodes will be entered
        let pincode_tables = document.getElementById(pincode_id);
        // PINCODES are required that's why NOT NULL
        if (pincode_tables !== null) {
            // if such domains are selected where city name and pin code is required
            // then ask the user to do so by raising an alert.
            if (
                pincode_tables.getElementsByClassName("form-control").length !== 0
            ) {
                // Get the individual city form to check the pincodes entered are correct or not
                let individual_forms =
                    pincode_tables.getElementsByClassName("form-control");
                // Regex to check for alaphabets and symbols
                let onlyNumbersAndSpaces = /^[0-9, ]+$/;
                // Loop to check for invalid characters(alphabets and/or symbols) in pincodes enetered
                for (let i = 0; i < individual_forms.length; i++) {
                    // if cities are selected and job is tried to submit, them it will throw an error
                    // showing one MUST enter atleast one pin codes for each of the selected cities
                    // if(individual_forms[i].value.length === 0){
                    //     allow = false;
                    //     alert('Enter the pincodes for all the cities selected')
                    //     return allow;
                    // }
                    let city = individual_forms[i].id;
                    // If there is SOME pincodes for a city, check for valid characters
                    // if there are no any pincodes for a selected city, allow the users to submit the job having cities with no pincodes entered
                    if (individual_forms[i].value.length !== 0) {
                        if (!onlyNumbersAndSpaces.test(individual_forms[i].value)) {
                            city_pincode_allow[`'${city}'`] = false;
                            alert(`Invalid pincode for ${city}`);
                        } else {
                            city_pincode_allow[`'${city}'`] = true;
                        }
                    }
                }
                // Check if any of the city has false as their value in case of having individual invalid pincodes
                // If all the cities have `true` as their value, allow will be set to `true` other wise it will be set to `false`
                if (Object.values(city_pincode_allow).includes(false)) {
                    allow = false;
                } else {
                    allow = true;
                }
                // Return true or false as the final value of this function
                return allow;
            } else {
                // alert(domain.value)

                // if page_type == pantry or page_type == fresh in case of amazon india, pincode is must
                if (domain.value === "WWW.AMAZON.IN") {
                    let page_type = document.getElementById(
                        "sourceData[keywords][page_type][amz]"
                    );
                    // alert("Line 196 commonjs",page_type)
                    // alert(page_type)
                    if (
                        page_type.options[page_type.selectedIndex].value ===
                        "pantry" ||
                        page_type.options[page_type.selectedIndex].value === "fresh"
                    ) {
                        // console.log("Line 199 commonjs",page_type.options[page_type.selectedIndex].value )
                        alert(
                            "Select at least one city for the selected domain and enter its pincode"
                        );
                        allow = false;
                        return allow;
                    } else {
                        //    pincode is not required in case of 'serp' (default search) when domain is amazon.in
                        allow = true;
                        return allow;
                    }
                } else if (domain.value === "FLIPKART.COM") {
                    // alert(domain.value)
                    let page_type = document.getElementById(
                        "sourceData[keywords][page_type][fk]"
                    );
                    // alert("Line 216 commonjs",grocery_page_type)

                    if (
                        page_type.options[page_type.selectedIndex].value ===
                        "grocery"
                    ) {
                        // alert(page_type.options[page_type.selectedIndex].value)
                        alert(
                            "Select at least one city for the selected domain and enter its pincode"
                        );
                        allow = false;
                        return allow;
                    } else {
                        //    pincode is not required in case of 'serp' (default search) when domain is amazon.in
                        allow = true;
                        return allow;
                    }
            }
                // check if grofers or big-basket cities are selected and their pincodes are entered
                else if (
                    domain.value === "WWW.BIGBASKET.COM" ||
                    domain.value === "WWW.GROFERS.COM"||
                    domain.value === "BLINKIT.COM"||
                    domain.value === "WWW.JIOMART.COM"||
                    domain.value === "WWW.DMART.IN"||
                    domain.value === "WWW.SWIGGY.COM"

                ) {
                    alert(
                        "Select at least one city for the selected domain and enter its pincode"
                    );
                    allow = false;
                    return allow;
                } else {
                    //pincode is not required in all other domains.
                    allow = true;
                    return allow;
                }
            }
        } else {
            // PINCODES are not required that's why NULL
            // allow the form to be submitted
            allow = true;
            return allow;
        }
    }
    else if (currentSourceType === "customasin"){
        let domain = document.getElementById("sourceData[customasin][domain]");
        let pincode_id = null;
        if (domain.value === "AMAZON-IN-SELENIUM") {
            pincode_id = "customasinpincodesamzselenium";
        }
        else if (domain.value === "WWW.BIGBASKET.COM") {
            pincode_id = "customasinpincodesbb";
        }
        else if (domain.value === "BLINKIT.COM"){
            pincode_id = "customasinpincodesbk"
        }
        else if(domain.value === "WWW.SWIGGY.COM"){
            pincode_id = "customasinpincodessg"
        }
        else if(domain.value === "NYKAA-COM-SELENIUM"){
            pincode_id = "customasinpincodesnykaa"
        }
        else if(domain.value === "FLIPKART-COM-SELENIUM"){
            pincode_id = "customasinpincodesflipselenium"
        }
        else if(domain.value === "FLIPKART.COM"){
            pincode_id = "customasinpincodesflipregular"  // Non Selenium or regular
        }
        else{
            pincode_id = null
        }
        let pincode_tables = document.getElementById(pincode_id);
        if (pincode_tables !== null) {
            // if such domains are selected where city name and pin code is required
            // then ask the user to do so by raising an alert.
            if (
                pincode_tables.getElementsByClassName("form-control").length !== 0
            ) {
                // Get the individual city form to check the pincodes entered are correct or not
                let individual_forms =
                    pincode_tables.getElementsByClassName("form-control");
                // Regex to check for alaphabets and symbols
                let onlyNumbersAndSpaces = /^[0-9, ]+$/;
                // Loop to check for invalid characters(alphabets and/or symbols) in pincodes enetered
                for (let i = 0; i < individual_forms.length; i++) {
                    // if cities are selected and job is tried to submit, them it will throw an error
                    // showing one MUST enter atleast one pin codes for each of the selected cities
                    // if(individual_forms[i].value.length === 0){
                    //     allow = false;
                    //     alert('Enter the pincodes for all the cities selected')
                    //     return allow;
                    // }
                    let city = individual_forms[i].id;
                    // If there is SOME pincodes for a city, check for valid characters
                    // if there are no any pincodes for a selected city, allow the users to submit the job having cities with no pincodes entered
                    if (individual_forms[i].value.length !== 0) {
                        if (!onlyNumbersAndSpaces.test(individual_forms[i].value)) {
                            city_pincode_allow[`'${city}'`] = false;
                            alert(`Invalid pincode for ${city}`);
                        } else {
                            city_pincode_allow[`'${city}'`] = true;
                        }
                    }
                }
                // Check if any of the city has false as their value in case of having individual invalid pincodes
                // If all the cities have `true` as their value, allow will be set to `true` other wise it will be set to `false`
                if (Object.values(city_pincode_allow).includes(false)) {
                    allow = false;
                } else {
                    allow = true;
                }
                // Return true or false as the final value of this function
                return allow;
            } else {
                // if page_type == pantry or page_type == fresh in case of amazon india selenium, pincode is must
                if (domain.value === "AMAZON-IN-SELENIUM") {
                    let page_type = document.getElementById(
                        "sourceData[customasin][page_type][amazon]"
                    );
                    if (
                        page_type.options[page_type.selectedIndex].value ===
                        "pantry" ||
                        page_type.options[page_type.selectedIndex].value === "fresh"
                    ) {
                        alert(
                            "Select at least one city for the selected domain and enter its pincodes"
                        );
                        allow = false;
                        return allow;
                    } else {
                        //    pincode is not required in case of 'marketplace' (default search) when domain is amazon.in
                        allow = true;
                        return allow;
                    }
                }

                // if page_type == grocery in case of flipkart.com selenium, pincode is must
                else if (domain.value === "FLIPKART-COM-SELENIUM") {
                   let page_type = document.getElementById(
                       "sourceData[customasin][page_type][flipkart]"
                   );
                   // alert("Line 196 commonjs",page_type)
                   // alert(page_type)
                   if (
                       page_type.options[page_type.selectedIndex].value === "grocery" ) {
                       alert(
                           "Select at least one city for the selected domain and enter its pincodes"
                       );
                       allow = false;
                       return allow;
                   } else {
                       //    pincode is not required in case of 'marketplace' (default search) when domain is amazon.in
                       allow = true;
                       return allow;
                   }
               }
                // check if blinkit or big-basket or swiggy.com cities are selected and their pincodes are entered
                 else if (
                    domain.value === "WWW.BIGBASKET.COM" ||
                    domain.value === "BLINKIT.COM" ||
                    domain.value === "WWW.SWIGGY.COM" 
                    // domain.value === "NYKAA-COM-SELENIUM"  
                    // domain.value === "FLIPKART-COM-SELENIUM" ||
                    // domain.value === "AMAZON-IN-SELENIUM"
                ) {
                    alert(
                        "Select at least one city for the selected domain and enter its pincodes"
                    );
                    allow = false;
                    return allow;
                } else {
                    //pincode is not required in all other domains.
                    allow = true;
                    return allow;
                }
            }
        } else {
            // PINCODES are not required that's why NULL
            // allow the form to be submitted
            allow = true;
            return allow;
        }
    }}
function selectSpider(parser) {
    $("#selectspider").hide();
    if (parser !== "") {
        $("#selectspider").show();
        fetch("/jobs/spider/" + parser)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                let select = document.getElementById("version");
                for (index in data) {
                    select.options[select.options.length] = new Option(
                        data[index],
                        data[index]
                        // index
                    );
                }
            });
    }
}
function showOutputStream(output) {
    $("#amazon-categories-fetcher-category").hide();
    $("#amazon-categories-fetcher-raw_cat_file_path").hide();
    if (output == "amazon-categories-fetcher,categories") {
        $("#amazon-categories-fetcher-category").show();
        $("#amazon-categories-fetcher-raw_cat_file_path").show();
    }
}
function showDetails(parser) {
    $("[id^=parserinfo-]").hide();
    $("#parserinfo-" + $.escapeSelector(parser)).show();
    // $("#parserinfo-" + encodeURIComponent(parser)).show();
}
function cleanText(textarea) {
    let ta = $("#" + $.escapeSelector(textarea));
    let ta_arr = ta.val().replace("\r\n","\n").split("\n")
    let entity_arr = []
    let final_entity_arr = []
    // Pushing all the entities(keywords/asins etc) in entity_arr array.
    for (let element of ta_arr){
        entity_arr.push(element.trim())
    }
    // Removing those elements where the length of element is zero i.e where no entity(keywords,asins,urls etc) is added in line.
    for (let entity of entity_arr){
        // entity is any keyword/url/asin etc
        if(entity.length === 0){
            // final_entity_arr should be an array which should have every element trimmed, sorted and but can have non-unique/repeating entities.
            continue
        }   
        final_entity_arr.push(entity)
    }
    final_entity_arr.sort() //Sorting the final entity array.
    ta.val(
        $.uniqueSort(
            final_entity_arr // Making it unique
            // ta.val().trim().split("\n").replace("\r\n", "\n").sort()
        ).join("\n")
    );
    ta.trigger("change");
}
function countLines(textarea, updateid) {
    let ta = $("#" + $.escapeSelector(textarea));
    let lines = 0;
    if (ta.val().trim().length > 0) {
        lines = ta.val().trim().replace("\r\n", "\n").split("\n").length;
    }
    $("#" + updateid).html(lines);
}
function changeFrequencyModal(modalId, btn) {
    //let modal = $("#" + modalId);
    let jobName = $(btn).data("jobName");
    let jobId = $(btn).data("jobId");
    let frequency = $(btn).data("frequency");
    $("#changeJobId").val(jobId);
    $("#changeFrequency").val(frequency);
    $("#showJobName").html(jobName);
    $("#showJobId").html("(" + jobId + ")");
   // modal.modal();
}
function ExportToExcel(mytblId) {
    var htmltable = document.getElementById(mytblId);
    var html = htmltable.outerHTML;
    var link = document.createElement("a");
    link.href = "data:application/vnd.ms-excel," + encodeURIComponent(html);
    link.download = "Report.xls";
    link.click();
    // var htmltable = document.getElementById(mytblId);
    // var html = htmltable.outerHTML;
    // window.open("data:application/vnd.ms-excel," + encodeURIComponent(html));
}



// Splitting all the cookies where semi-colon acts as delimiter and storing them in an object as key-value pair.
// Before storing them as an object, we need to split it on basis of = sign.
// Get the  cookie by name for key "selectedTimezone" from a list of cookies stored in object.
function getCookie(cookieName) {
    let cookie = {};
    document.cookie.split(';').forEach(function(el) {
      let [key,value] = el.split('=');
      cookie[key.trim()] = value;
    })
    return cookie[cookieName];
  }
function Timezone() {
    const _t = (s) => {
        return s;
    };
    // document.getElementById("614085cb4390434d803bdfa5").dataset.batchstarted
    let timezones = [
    //     "Asia/Kolkata",
    //     "America/Toronto",
    //     "America/Los_Angeles",
    //     "America/New_York",
    //     "America/Mexico_City",
    //     "GMT",
    //     "Asia/Dubai",
    //     "Asia/Singapore",
    //     "Asia/Manila",
    //     "Asia/Jakarta",
    //     "Asia/Bangkok",
    //     "Asia/Kuala_Lumpur",
    //     "Asia/Ho_Chi_Minh",
    //     "Pacific/Auckland",
    //     "Asia/Riyadh",
    //     "Asia/Tokyo",
    //     "Europe/Paris",
    ];
    let dateTimeUtc = moment().utc();
    document.querySelector(".js-TimeUtc").innerHTML = dateTimeUtc.format(
        "dddd, DD MMM YYYY HH:mm:ss"
    );

    let selectorOptions = moment.tz
        .names()
        /** 
         * 
         * ? Commenting out the filter function below.
         * ? And using all the default timezones provided by moment.tz library.
         * 
         */


        // .filter((tz) => {           
        //     return timezones.includes(tz);
        // })
        .reduce((memo, tz) => {
            memo.push({
                name: tz,
                offset: moment.tz(tz).utcOffset(),
               
            });
            //-

            return memo;
        }, [])
        .sort((a, b) => {
            return a.offset - b.offset
          })
        .reduce((memo, tz) => {
            const timezone = tz.offset ? moment.tz(tz.name).format("Z") : "";
            
            return memo.concat(
                `<option value="${tz.name}">(GMT${timezone}) ${_t(
                    tz.name
                )}</option>`
            );

        
        }, "");
        

    document.querySelector(".js-Selector").innerHTML = selectorOptions; 
}
    // $(".js-Selector").on("change", e => {
    //     let timestamp = dateTimeUtc.unix();
    //     // let timestamp =  moment.tz(status.createdAt)
    //     let offset = moment.tz(e.target.value).utcOffset() * 60;
    //     let dateTimeLocal = moment.unix(timestamp + offset).utc();

    //     document.querySelector(".js-TimeLocal").innerHTML = dateTimeLocal.format("dddd, DD MMM YYYY HH:mm:ss");
    // });

    // document.querySelector(".js-Selector").dispatchEvent(event);
    // $(".js-Selector").select2(); 
    
    


function Timezone_Calc() {
    $(document).ready(function () {
        document.querySelectorAll(".time").forEach((item) => {
            // let id=`a${i+1}`
            // let timestamp = document.getElementById(id).dataset.finaldate

           let timestamp = item.dataset.finaldate;      
            timestamp = parseInt(timestamp);
            if (getCookie('selectedTimezone') === undefined) {
                let timezone = (document.querySelector(".js-Selector").value =
                    "Asia/Kolkata");
                let offset = moment.tz(timezone).utcOffset() * 60;
                let dateTimeLocal = moment.unix(timestamp + offset).utc();
                // console.log(dateTimeLocal);
                // document.getElementById(id).innerHTML = dateTimeLocal.format("DD-MMM-YYYY LTS")
                item.innerHTML = dateTimeLocal.format("ddd, DD-MMM-YYYY LTS");
            } else {
                let timezone = document.querySelector(".js-Selector").value = getCookie('selectedTimezone');
                let offset = moment.tz(timezone).utcOffset() * 60;
                let dateTimeLocal = moment.unix(timestamp + offset).utc();
                // console.log(dateTimeLocal);
                // document.getElementById(id).innerHTML = dateTimeLocal.format("DD-MMM-YYYY LTS")
                item.innerHTML = dateTimeLocal.format("ddd, DD-MMM-YYYY LTS");
            }

            // Handler for .load() called.
        });
    });

    $(".js-Selector").on("change", (e) => {
        let timezone = document.querySelector(".js-Selector").value;
        let exp_date = 60 * 60 * 24 * 365;
        document.cookie = `selectedTimezone=${timezone}; max-age=${exp_date}; path=/`;
        document.querySelectorAll(".time").forEach((item) => {
            // let id=`a${i+1}`
            let timestamp = item.dataset.finaldate;
            timestamp = parseInt(timestamp);
            let offset = moment.tz(e.target.value).utcOffset() * 60;
            let dateTimeLocal = moment.unix(timestamp + offset).utc();
            item.innerHTML = dateTimeLocal.format("ddd, DD-MMM-YYYY LTS");
        });
    });
}

async function addEtlConfig(domain, type, threshold, projectName, flowName, etlParserPipeline, pageType, schemaName, tableName, etlParameter, etlContext, prefectServerId) {
    try {
        const res = await fetch("/admin/etlconfig/addconfig", {
            method: "POST",
            body: new URLSearchParams({
                domain: domain,
                type: type,
                threshold: threshold,
                projectName: projectName,
                flowName: flowName,
                parserPipeline: etlParserPipeline,
                pageType: pageType,
                schemaName: schemaName,
                tableName: tableName,
                parameter: etlParameter,
                context: etlContext,
                prefectServerId: prefectServerId
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        window.location.reload();
    } catch (err) {
        console.log(err);
    }
}

async function getFlowRunData(pipeline_id, projectName, flowName, prefectServerId) {

    try {
        let data = await fetch(
            `/api/getflowrun/${pipeline_id}/${projectName}/${flowName}/${prefectServerId}`
        );
        let flow_data = await data.json();
        return flow_data;
    } catch (err) {
        console.log(err);
    }
}

async function getParserData(pipelineId, parserCollectionName) {
    try {
        let res = await fetch(
            `/parserData/${pipelineId}/${parserCollectionName}`
        );
        let parser_info_data = await res.json();
        return parser_info_data;
    } catch (err) {
        console.log(err);
    }
}

async function getconfigByName(parserPipeline, pageType) {
    try {
        let res = await fetch(
            `/etlconfig/getconfigbyname/${parserPipeline}/${pageType}`
        );
        let flow_info = await res.json();
        return flow_info;
    } catch (err) {
        console.log(err);
    }
}

function showDiv(value) {
    // reset the value of div and hide them
    document.getElementsByClassName("flow-name")[0].value = "";
    document.getElementsByClassName("parser-pipeline")[0].value = "";
    document.getElementsByClassName("project-name")[0].value = "";

    if (value.length !== 0) {
        // show the div
        document.getElementById("ETLflowname").style["display"] = "flex";
        document.getElementById("ETLparserpipeline").style["display"] = "flex";
        document.getElementById("ETLprojectname").style["display"] = "flex";

    } else 
    {
        document.getElementById("ETLparserpipeline").style["display"] = "none";
        document.getElementById("ETLflowname").style["display"] = "none";
        document.getElementsById("ETLprojectname").style["display"] = "none";
    }
}

async function getFlowNames(projectName) {
    try {
        let prefectServerId = document.getElementById("prefectservername").value;

        let flow_names = await fetch(`/etlconfig/getflownames/${projectName}/${prefectServerId}`);

        let res = await flow_names.json();

        let flowname_element = document.getElementById("etlflowname");

        for (let i = 0; i < res.length; i++) {
            let option = document.createElement("option");
            option.text = option.value = res[i].name;
            flowname_element.add(option, 0);
        }
    } catch (err) {
        console.log(err);
    }
}

async function getProjectNames(prefect_server_id) {
    try {
        let prefect_project_names = await fetch(`/etlconfig/getproject/${prefect_server_id}`);
        let res = await prefect_project_names.json();

        let projectname_element = document.getElementById("projectname");

        for (let i = 0; i < res.length; i++) {
            let option = document.createElement("option");
            option.text = option.value = res[i].name;
            projectname_element.add(option, 0);
        }
    } catch (err) {
        console.log(err);
    }
}

function secondsToHms(d) {
    d = Number(d);

    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);

    return (
        ("0" + h).slice(-2) +
        ":" +
        ("0" + m).slice(-2) +
        ":" +
        ("0" + s).slice(-2)
    );
}

async function getTotalRecordsFound(databaseNameArray, batchId) {
    let totalRecordsFound = {};

    for (const databaseName of databaseNameArray) {
        try {
            let record_found = await fetch(
                `/etlconfig/gettotalrecords/${batchId}/${databaseName}`
            );
            record_found = await record_found.json();
            totalRecordsFound[`${databaseName}`] = Number(record_found);
        } catch (err) {
            console.log(err);
        }
    }
    return totalRecordsFound;
}

// send a mutation query to execute the ETL
async function executeEtl(flowId, flowRunName, parameters, context, prefectServerId) {
    try {
        let execute_flow_run = await fetch("/etlconfig/runetlnow", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prefectServerId: prefectServerId,
                etlFlowId: flowId,
                etlFlowRunName: flowRunName,
                etlParamerers: parameters,
                etlContext: context,
            }),
        });
        let flow_execution_data = await execute_flow_run.json();
        let modal_refresh_btn = document.getElementById("modal-refresh");

        alert(`The flow-run-Id is ${flow_execution_data.flowRunId}`);

        // refresh the modal window information
        modal_refresh_btn.click();

        return flow_execution_data;
    } catch (err) {
        console.log(err);
    }
}

// set-up an ETL job
async function runETLnow() {
    // Get the pipeline_id/batch_id
    let pipeline_id = document.getElementById("batch-id").innerHTML;
    let flowName = document.getElementById("batch-flowname").innerHTML;

    let date = new Date();
    let flowRunName =
        date.getDate() +
        moment.monthsShort(date.getMonth()) +
        date.getFullYear() +
        "-" +
        pipeline_id;

    // Get the flowId and parameters to execute an ETL:
    let etlConfigDetails = await fetch("/etlconfig/getconfig");
    etlConfigDetails = await etlConfigDetails.json();

    let requiredConfig = await etlConfigDetails.ETLdata.filter(
        (item) => item.etlFlowName === flowName
    )[0];

    let table = requiredConfig.tableName;
    let schema = requiredConfig.schemaName;
    let prefectServerId = requiredConfig.prefectServerId;
    let projectName = requiredConfig.etlProjectName;
    let mongodbType = "production";
    let postgresdbType = "production";
    let preferred_seller;

    if (requiredConfig.etlParserPipeline === "amazon_product_page_fetcher") {
        preferred_seller = '["cloudtail","Electronics Bazaar Store"]';
    } else if (requiredConfig.etlParserpipeline === "flipkart_sellers") {
        preferred_seller = '["RetailNet","Corseca", "Omnitech retail"]';
    } else {
        preferred_seller = "unknown";
    }

    let parameters = JSON.stringify({
        pipeline_id: pipeline_id,
        translate_fields: ["title"],
    });

    let context = JSON.stringify({
        table: table,
        schema: schema,
        mongodb_type: mongodbType,
        postgresdb_type: postgresdbType,
        preferred_seller: preferred_seller,
    });

    // Get the latest flow-Id for ETL execution
    let flowId;
    try {
        flowId = await fetch(`/api/getflowid/${flowName}/${projectName}/${prefectServerId}`)
        flowId = await flowId.json();
    } catch (err) {
        console.log(err);
    }
    // let flowId = document.getElementById("batch-flowid").innerHTML;

    // validation, check if the pipelineId already exists in prefect.
    // If it exists, show a confirmation box asking if the user wants to run the job

    let currentEtlStatus = await getFlowRunData(
        pipeline_id,
        flowName,
        projectName,
        prefectServerId
    );

    if (currentEtlStatus.id) {
        bootbox.confirm({
            title: "Confirm ETL execution",
            message:
                "It is not recommended to run the ETL. <ul><li>Either the ETL has already been run, or <li>The data is probably not available</ul> Running ETL may lead to incomplete records, or data duplicity. Please confirm if you still want to run the ETL.",
            centerVertical: true,
            buttons: {
                confirm: {
                    label: "Yes, I understand",
                    className: "btn-danger",
                },
                cancel: {
                    label: "Cancel",
                    className: "btn-secondary",
                },
            },
            callback: function (result) {
                if (result) {
                    executeEtl(flowId, flowRunName, parameters, context, prefectServerId);
                    return;
                }
            },
        });
    } else {
        executeEtl(flowId, flowRunName, parameters, context, prefectServerId);
        return;
    }

    document.getElementsByClassName("modal-content")[1].style[
        "background-color"
    ] = " #4a4a4a";
    document.getElementsByClassName("modal-content")[1].style["color"] =
        "white";
}

// add Prefect server config
async function addPrefectConfig(serverName, dashboardUri, apolloUri, serverComment) {
    try {
        const res = await fetch("/admin/prefectconfig/addconfig", {
            method: "POST",
            body: new URLSearchParams({
                serverName: serverName,
                dashboardUri: dashboardUri,
                apolloUri: apolloUri,
                serverComment: serverComment
            }),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            }
        });

        window.location.reload()
    } catch (err) {
        console.log(err);
    }
}

async function getPrefectServers() {
    try {
        let prefect_servers = await fetch("/prefectconfig/getallconfig");
        let res = await prefect_servers.json();

        let prefect_server_name_element = document.getElementById("prefectservername");

        for (let i = 0; i < res.prefectServerInfo.length; i++) {
            let option = document.createElement("option");
            console.log(res.prefectServerInfo[i]);
            option.text = res.prefectServerInfo[i].name;
            option.value = res.prefectServerInfo[i]._id;
            prefect_server_name_element.add(option, 0);
        }
    } catch (err) {
        console.log(err);
    }
}

async function resetOptionsValue(id) {
    try {
        let projectNamesDropdown = document.getElementById(id);
        projectNamesDropdown.options.length = 0;
    } catch (err) {
        console.log(err);
    }
}

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

async function showTemplate(template_url){
    try{
    const template = await fetch(template_url)
    let template_header= await template.text()
    return template_header //string value is returned
    
}
catch(e){
    console.log(e)
}
}