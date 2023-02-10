// ----PIN CODE VALIDATOR FUNCTION BEGIN----
function pinCodeFormatter(cityObject){


    // Extract the city name and saving it in an array - `cityNameArray`
    let cityNameArray = Object.keys(cityObject);

    // Define an object to check if all the PIN codes are in correct format
    // If all correct for a given city, assign `true` value, otherwise `false`.
    // let cityPincodeCorrect = {};

    // regex to allow only spaces and numbers
    let onlyNumbersAndSpaces = /^[0-9 ]+$/;

    // Loop over every city
    for(let i=0; i<cityNameArray.length; i++){

        // Object to store the incorrect or invalid pincodes for user reference.
        cityPincodeIncorrect = {};

        // Extract all the pincodes for a city
        let cityPincodeArray = cityObject[cityNameArray[i]].split(',');

        // Loop over all the pin-codes for a city
        for(let j=0; j<cityPincodeArray.length; j++){

            // Remove spaces from each individual pincodes in `cityPinCode` Array
            cityPincodeArray[j] = cityPincodeArray[j].replace(/\s/g,'');

        }

        // THIS IS A COMMA-CHECK TEST
        // This will return an array containing ALL the elements of length 6
        cityPincodeArray = cityPincodeArray.filter(pincodes => pincodes.length === 6);

        // Check if all the pin-codes of a city are of length 6 and don't have any special character other than
        // numbers and spaces.

        // Filter out the correct & incorrect pincodes for a city.
        // save the correct pincodes and log the incorrect pincodes for user reference.

        let correctPincodes = [];
        let incorrectPincodes = [];

        correctPincodes = cityPincodeArray.filter(pincodes => onlyNumbersAndSpaces.test(pincodes));
        incorrectPincodes = cityPincodeArray.filter(pincodes => !onlyNumbersAndSpaces.test(pincodes));

        // join the valid pincodes and save it in DB.
        // join the invalid pincodes and log it on the console.

        cityObject[cityNameArray[i]] = correctPincodes.join();

        cityPincodeIncorrect[`'${cityNameArray[i]}'`] = incorrectPincodes.join();

        console.log(cityPincodeIncorrect);

    }

    // Return the city object
    return cityObject

}
// ---PIN CODE VALIDATOR FUNCTION ENDS---

module.exports  = {pinCodeFormatter};