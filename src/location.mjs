import { config } from "./config.mjs";
import { Log } from "./log.mjs";
import { fetchCache, corsCache, specialUrlTable, CreateResponse, setCache } from "./fetchCache.mjs";
import { isValidNumericString, microSleep } from "./functions.mjs";
import { HistoryGetStation } from "./history.mjs";
import { GetGnisStation } from "./gnis.mjs";

// specialUrlTable = {
//   "/weatherkittycache/location": getLocationAsync,
//   "/weatherkittycache/geoip": getWeatherLocationByIPAsync,
//   "/weatherkittycache/address": getWeatherLocationByAddressAsync,
// };

specialUrlTable["/weatherkittycache/location"] = getLocationAsync;
specialUrlTable["/weatherkittycache/geoip"] = getWeatherLocationByIPAsync;
specialUrlTable["/weatherkittycache/address"] = getWeatherLocationByAddressAsync;

// Function getWeatherLocationAsync
// City, State, Country, ZipCode, Latitude, Longitude
async function getWeatherLocationAsync() {
  let response = null;

  response = await fetchCache("/weatherkittycache/location", null, config.shortCacheTime);

  if (response == null || response.ok == false) {
    response = await fetchCache("/weatherkittycache/geoip", null, config.mediumCacheTime);
  }

  if (response == null || response.ok == false) {
    response = await fetchCache("/weatherkittycache/address", null, config.FOREVER);
  }

  if (response != null && response.ok) {
    let data = await response.json();

    return data;
  } else {
    if (Log.Error()) console.log("[getWeatherLocationAsync] *** ERROR ***");
    return null;
  }
}

// Function getLocationAsync
// City, State, Country, ZipCode, Latitude, Longitude
async function getLocationAsync() {
  if (navigator.geolocation) {
    let position = await new Promise((position, error) => {
      navigator.geolocation.getCurrentPosition(position, error, {
        enableHighAccuracy: true,
      });
    }).catch((error) => {
      if (Log.Warn()) console.log("[getLocationAsync] Warning: ", error.message);
      return null;
    });
    if (position) {
      let result = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      let response = CreateResponse(result);
      return response;
    } else {
      if (Log.Warn()) console.log("[getLocationAsync] Warning: No Position");
      return null;
    }
  } else {
    if (Log.Error()) console.log("[getLocationAsync] Error: Geolocation data is not available.");
    return null;
  }
  throw new Error("getLocationAsync: Neither Position nor Error.  This Should not Happen.");
}

// Function getWeatherLocationByIPAsync {
// City, State, Country, ZipCode, Latitude, Longitude
// n/c - non-commercial use only
// Site             Limits    Limit/Mth Limit/Day Limit/Min
// ip-api.com/json  http n/c  75000     2500      45
// ipapi.com                  100       ---       ---
// ipapi.co/json              30000     967       0.5
async function getWeatherLocationByIPAsync() {
  let locationUrl = "https://ipapi.co/json/";
  let response = await fetchCache(locationUrl, null, config.mediumCacheTime);

  // City, State, Country, ZipCode, Latitude, Longitude
  if (response != null && response.ok) {
    let data = await response.json();

    let result = {
      city: data.city,
      state: data.region,
      country: data.country_name,
      zip: data.postal,
      latitude: data.latitude,
      longitude: data.longitude,
    };

    return CreateResponse(result);
  }

  return response;
}

// SETLOCATION SET LOCATION SETADDRESS SET ADDRESS
// Function getWeatherLocationByAddressAsync
// https://geocoding.geo.census.gov/geocoder/locations/address?street=4600+Silver+Hill+Rd&city=Washington&state=DC&zip=20233&benchmark=Public_AR_Current&format=json
// City, State, Country, ZipCode, Latitude, Longitude
async function getWeatherLocationByAddressAsync(address) {
  let errorReponse = new Response("Address Error", { status: 400, ok: false });
  if (!address)
    address = prompt(
      'ENTER: "GHCND Station", "Latitude, Longitude", "Address, ZipCode","City, State", or "Address, City, State".  COMMAS REQUIRED.'
    );

  if (address === null || address === "") {
    if (Log.Debug()) console.log("[getAddress] No Address Provided.");
    return null;
  }

  address = "" + address;
  let array = address.split(",");
  let [street, city, state, zip] = ["", "", "", ""];

  switch (array.length) {
    case 1: {
      // GHCND Station
      [street, city, state, zip] = ["", "", "", ""];
      let station = array[0].trim();
      let length = station.length;
      if (length == 11) {
        // It might be a station ID, so check it.
        let result = await HistoryGetStation(station);
        if (result && result.latitude && result.longitude) {
          return CreateResponse(result);
        }
      }

      // Harlan: USC00153629
      // Boston: USW00014739
      // Largest Daily File (17mb): USW00093822  39.8453  -89.6839  179.8 IL SPRINGFIELD ABRAHAM LINCOLN CA         72439
      // TestFL: USW000xxxxx
      // "City, State", "State", "Search" by ghcnd
      // HistoryGetStation(stationId, latitude, longitude);

      // Check City and Search
      city = station;
      let result = await HistoryGetStation(null, null, null, city);
      if (result && result.latitude && result.longitude) {
        return CreateResponse(result);
      }

      if (Log.Warn()) console.log("[getAddress] Warning: Unable to Parse Address");
      return errorReponse;
      break;
    }
    case 2:
      // (Lat, Lon), (City, State, ), (Street, Zip)
      [street, city, state, zip] = ["", "", "", ""];
      let word1 = array[0].trim();
      let word2 = array[1].trim();
      word1 = word1.replace(",", "");
      word2 = word2.replace(",", "");

      if (isValidNumericString(word1) && isValidNumericString(word2)) {
        let latitude = parseFloat(word1).toFixed(12);
        let longitude = parseFloat(word2).toFixed(12);
        if (latitude < 18 || latitude > 72 || longitude < -180 || longitude > -66) {
          if (Log.Debug()) console.log("[getAddress] Latitude or Longitude out of range.");
          return errorReponse;
        }
        let result = { latitude: latitude, longitude: longitude };
        return CreateResponse(result);
      } else {
        // insert city, state ghcnd search here
        city = array[0].trim();
        state = array[1].trim();

        let result = await HistoryGetStation(null, null, null, city, state);
        if (result && result.latitude && result.longitude) {
          return CreateResponse(result);
        }

        let verbose = true;
        result = await GetGnisStation(city, state, verbose); // cjm
        if (result && result.latitude && result.longitude) {
          if (Log.Info()) console.log("[GNIS] Station: ", result); // cjm
          return CreateResponse(result);
        }

        [city, state] = ["", ""];
        street = array[0].trim();
        zip = array[1].trim();
      }
      break;
    case 3:
      [street, city, state, zip] = ["", "", "", ""];
      street = array[0].trim();
      city = array[1].trim();
      state = array[2].trim();
      break;
    case 4:
      [street, city, state, zip] = ["", "", "", ""];
      street = array[0].trim();
      city = array[1].trim();
      state = array[2].trim();
      zip = array[3].trim();
      break;
    default:
      if (Log.Error()) console.log("[getAddress] Error: Unable to Parse Address");
      return errorReponse;
  }

  // *** WARNING *** CORS Proxy Required
  let locationUrl;
  locationUrl = `https://geocoding.geo.census.gov/geocoder/locations/address?street=${street}`;
  if (city !== "") locationUrl += `&city=${city}`;
  if (state !== "") locationUrl += `&state=${state}`;
  if (zip !== "") locationUrl += `&zip=${zip}`;
  locationUrl += `&benchmark=Public_AR_Current&format=json`;
  locationUrl = locationUrl.toLowerCase();
  let response = await corsCache(locationUrl, null, config.FOREVER);

  // City, State, Country, ZipCode, Latitude, Longitude
  if (response && response.ok) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      if (Log.Error()) {
        console.log("[getAddress] Error: ", e);
        console.log(
          "[getAddress] Error: This may be caused by a CorsProxy.io vs Census API issue.  Request a Cors.sh configuration file and API key if you need address geocoding"
        );
        console.log("[getAddress] Error: The Census API may be replaced by GNIS in the future.");
      }
      return errorReponse;
    }

    if (data.result.addressMatches.length <= 0) {
      if (Log.Warn()) console.log("[getAddress] Warning: No Address Matches: ", address);
      return errorReponse;
    }
    let result = {
      city: data.result.addressMatches[0].addressComponents.city,
      state: data.result.addressMatches[0].addressComponents.state,
      country: (data.result.addressMatches[0].addressComponents.country ??= ""),
      zip: data.result.addressMatches[0].addressComponents.zip,
      latitude: data.result.addressMatches[0].coordinates.y,
      longitude: data.result.addressMatches[0].coordinates.x,
    };
    return CreateResponse(result);
  }
  return response;
}

async function SetLocationAddress(address) {
  if (Log.Info()) console.log("[SetLocationAddress] ", address);
  let result = await getWeatherLocationByAddressAsync(address);
  if (result && result.ok) {
    // Override the location cache, and make it permanent.
    result = await setCache("/weatherkittycache/location", result, config.FOREVER);
    return result;
  } else {
    // clear the location cache if you cancel the address or input an invalid address
    if (result) window.alert("No Location Data Available");
    clearCache("/weatherkittycache/location");
    return null;
  }
  // WeatherKitty();
}

export {
  getWeatherLocationAsync,
  getLocationAsync,
  getWeatherLocationByIPAsync,
  getWeatherLocationByAddressAsync,
  SetLocationAddress,
};
