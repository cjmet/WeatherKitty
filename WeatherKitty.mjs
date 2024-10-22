"use strict";

import "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";

let LogLevel = {
  Verbose: 0,
  Trace: 1,
  Debug: 2,
  Info: 3,
  Warn: 4,
  Error: 5,
  Off: 10,
};

let WeatherKittyDebug = LogLevel.Info;

let config = {
  FOREVER: Number.MAX_SAFE_INTEGER / 2,
  locCacheTime: 60000 * 5, // 5? minutes just in case we are in a car and chasing a tornado?
  shortCacheTime: 60000 * 6, // 7 (-1) minutes so we can catch weather alerts
  obsCacheTime: 60000 * 10, // 10 minutes
  forecastCacheTime: 60000 * 60, // 1 hour
  longCacheTime: 60000 * 60 * 24, // 24 hours
  defaultCacheTime: 60000 * 30, // 30 minutes

  CORSProxy: "https://corsproxy.io/?", // CORS Proxy "https://corsproxy.io/?" or "" for none

  ForecastMapUrl: "https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?1728599137",
  ForecastMapCacheTime: 60000 * 60 * 1, // 1 hours
  RadarMapUrl: "https://radar.weather.gov/ridge/standard/CONUS-LARGE_loop.gif",
  RadarMapCacheTime: 60000 * 10, // 10 minutes
  AlertsMapUrl: "https://www.weather.gov/wwamap/png/US.png",
  AlertsMapCacheTime: 60000 * 10, // 10 minutes

  timeFormat: {
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: true, // Delete for 24-hour format
    minute: "2-digit",
  },
  historyFormat: {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  },
  WeatherKittyObsImage: "img/WeatherKittyE8.jpeg",
  WeatherKittyForeImage: "img/WeatherKittyC.jpeg",

  // Static Status Variables

  WeatherKittyIsInit: false,
  WeatherKittyIsLoaded: false,
  WeatherKittyPath: "",

  SanityChecks: async function () {
    if (config.shortCacheTime < 60000) config.shortCacheTime = 60000;
    if (config.longCacheTime < 60000) config.longCacheTime = 60000;
    if (config.defaultCacheTime < 60000) config.defaultCacheTime = 60000;
    if (config.locCacheTime < 60000) config.locCacheTime = 60000;
    if (config.ForecastMapCacheTime < 60000)
      config.ForecastMapCacheTime = 60000;
    if (config.RadarMapCacheTime < 60000) config.RadarMapCacheTime = 60000;
    if (config.AlertsMapCacheTime < 60000) config.AlertsMapCacheTime = 60000;
  },
};

// Logging
export function WeatherKittySetDebug(level) {
  WeatherKittyDebug = level;
}

let Log = {
  Verbose: () => {
    return LogLevel.Verbose >= WeatherKittyDebug;
  },
  Trace: () => {
    return LogLevel.Trace >= WeatherKittyDebug;
  },
  Debug: () => {
    return LogLevel.Debug >= WeatherKittyDebug;
  },
  Info: () => {
    return LogLevel.Info >= WeatherKittyDebug;
  },
  Warn: () => {
    return LogLevel.Warn >= WeatherKittyDebug;
  },
  Error: () => {
    return LogLevel.Error >= WeatherKittyDebug;
  },
};
// /Logging

// Function Weather Kitty
export default WeatherKittyStart;
export async function WeatherKittyStart() {
  await config.SanityChecks();
  if (config.WeatherKittyIsLoaded) {
    console.log("[WeatherKitty] Already Loaded");
    return;
  }
  config.WeatherKittyIsLoaded = true;

  let path = "";
  let results;
  if (WeatherKittyDebug <= 2)
    console.log(`Weather Kitty Debug Mode: [${WeatherKittyDebug}]`);
  else console.log("[WeatherKitty] Loading ...");

  let scripts = document.getElementsByTagName("script");
  let script = null;
  for (let subScript of scripts) {
    if (subScript.src.includes("WeatherKitty")) {
      script = subScript;
      break;
    }
  }
  if (script === null) {
    console.log(
      `[WeatherKitty] WARNING: Unable to find WeatherKitty script in:\n[${window.location.pathname}]`
    );
  } else {
    if (WeatherKittyDebug <= 2)
      console.log("[WeatherKitty] Script: ", script.src);
    let url = new URL(script.src);
    path = url.pathname;
    const lastSlashIndex = path.lastIndexOf("/");
    if (lastSlashIndex >= 0) path = path.substring(0, lastSlashIndex + 1); // Include the trailing slash
    console.log("[WeatherKitty] Path: ", path);
    config.WeatherKittyPath = path;
  }

  config.WeatherKittyObsImage = path + config.WeatherKittyObsImage;
  config.WeatherKittyForeImage = path + config.WeatherKittyForeImage;

  if (WeatherKittyDebug <= 2) {
    console.log(`[WeatherKitty] Obs : ${config.WeatherKittyObsImage}`);
    console.log(`[WeatherKitty] Fore: ${config.WeatherKittyForeImage}`);
  }

  // Start the Weather Kitty Widget
  if (WeatherKittyDebug <= 1) {
    setTimeout(WeatherWidgetInit(path), 3000);
    setTimeout(WeatherKitty, 6000);
  } else {
    setTimeout(WeatherWidgetInit(path), 5);
    setTimeout(WeatherKitty, 10);
  }

  setInterval(WeatherKitty, config.shortCacheTime);
}

// Function Weather Widget Initialization
function WeatherWidgetInit(path) {
  if (config.WeatherKittyIsInit) return;
  config.WeatherKittyIsInit = true;

  InjectWeatherKittyStyles(path);

  let count = 0;
  count += FindAndReplaceTags(
    "weather-kitty",
    WeatherKittyWidgetBlock,
    "WeatherKitty"
  ); // Order matters
  count += FindAndReplaceTags(
    "weather-kitty-current",
    WeatherKittyCurrentBlock(),
    "WeatherKittyBlock"
  );
  count += FindAndReplaceTags(
    "weather-kitty-forecast",
    WeatherKittyForecastBlock(),
    "WeatherKittyBlock"
  );
  count += FindAndReplaceTags(
    "weather-kitty-chart",
    WeatherKittyChartBlock,
    "WeatherKittyChart"
  );
  count += FindAndReplaceTags(
    "weather-kitty-geoaddress",
    WeatherKittyLocationBlock(),
    "WeatherKittyGeoAddress"
  );
  count += FindAndReplaceTags(
    "weather-kitty-map-forecast",
    WeatherKittyMapForecastBlock,
    "WeatherKittyMapForecast"
  );
  count += FindAndReplaceTags(
    "weather-kitty-map-radar",
    WeatherKittyMapRadarBlock,
    "WeatherKittyMapRadar"
  );
  count += FindAndReplaceTags(
    "weather-kitty-map-alerts",
    WeatherKittyMapAlertsBlock,
    "WeatherKittyMapAlerts"
  );

  if (count > 0) {
    if (Log.Debug())
      console.log(`[WeatherWidgetInit] Elements Found: ${count}`);
    return true;
  } else {
    if (Log.Warn())
      console.log(
        "[WeatherWidgetInit] WARNING: Weather Kitty Elements Not Found"
      );
    return false;
  }
}

// Function Weather Widget
async function WeatherKitty() {
  let weather = await getWeatherAsync();

  // Observation Text
  {
    let shortText =
      weather.observationData.features[0].properties.textDescription;
    let temp = weather.observationData.features[0].properties.temperature.value;
    let unit =
      weather.observationData.features[0].properties.temperature.unitCode;
    temp = Fahrenheit(temp, unit);
    let img = weather.observationData.features[0].properties.icon;
    let altimg = config.WeatherKittyObsImage;
    let text = `${shortText} ${temp}°F`;

    WeatherSquares("weather-kitty-current", text, img, altimg);
  }

  // Forecast Text
  {
    let shortText = weather.forecastData.properties.periods[0].shortForecast;
    let temp = weather.forecastData.properties.periods[0].temperature;
    let unit = weather.forecastData.properties.periods[0].temperatureUnit;
    temp = Fahrenheit(temp, unit);
    let img = weather.forecastData.properties.periods[0].icon;
    let altimg = config.WeatherKittyForeImage;
    let text = `${shortText} ${temp}°F`;

    WeatherSquares("weather-kitty-forecast", text, img, altimg);
  }

  // Long Forecast
  let locationName = null;
  {
    locationName =
      weather.pointData.properties.relativeLocation.properties.city;
    locationName += ", ";
    locationName +=
      weather.pointData.properties.relativeLocation.properties.state;
    locationName += " - ";
    locationName +=
      weather.stationsData.features[0].properties.stationIdentifier;

    let shortText = weather.forecastData.properties.periods[0].shortForecast;
    let forecast = weather.forecastData.properties.periods[0].detailedForecast;
    let temp = weather.forecastData.properties.periods[0].temperature;
    let unit = weather.forecastData.properties.periods[0].temperatureUnit;
    temp = Fahrenheit(temp, unit);
    let precip = weather.forecastData.properties.periods[0].detailedForecast;
    let img = weather.forecastData.properties.periods[0].icon;
    let altimg = config.WeatherKittyForeImage;
    let text = `<b>${locationName}</b><br><br>`;

    text += `<b>Current:</b><br>`;
    text += `${shortText} ${temp}°F<br>`;
    text += `${precip}% precipitation<br><br>`;

    text += `<b>Forecast:</b><br>`;
    text += `${forecast} ${temp}°F`;

    let widgets = document.getElementsByTagName("weather-kitty-tooltip");
    for (let widget of widgets) {
      // widget.setAttribute("tooltip", forecast);
      widget.innerHTML = text;
    }
  }

  // weather-kitty-geoaddress Location Block
  // "Chargoggagoggmanchauggagoggchaubunagungamaugg, MA";
  let widgets = document.getElementsByTagName("weather-kitty-geoaddress");
  for (let widget of widgets) {
    let span = widget.getElementsByTagName("span")[0];
    let button = widget.getElementsByTagName("button")[0];
    span.innerHTML = locationName;
    button = RemoveAllEventListeners(button);
    button.addEventListener("click", async () => {
      let result = await getWeatherLocationByAddressAsync();
      if (result && result.ok) {
        // Override the location cache, and make it permanent.
        await setCache("/weatherkittycache/location", result, config.FOREVER);
      } else {
        // clear the location cache if you cancel the address or input an invalid address
        window.alert("No Location Data Available");
        clearCache("/weatherkittycache/location");
      }
      WeatherKitty();
    });
  }

  // Charting
  // barometricPressure, dewpoint, heatIndex, precipitationLastHour, precipitationLast3Hours, precipitationLast6Hours, relativeHumidity, temperature, visibility, windChill, windGust, windSpeed,
  ObservationCharts(weather.observationData.features);

  // fetchCache the Maps
  WeatherMaps(
    "weather-kitty-map-forecast",
    config.ForecastMapUrl,
    config.ForecastMapCacheTime
  );
  WeatherMaps(
    "weather-kitty-map-radar",
    config.RadarMapUrl,
    config.RadarMapCacheTime
  );
  WeatherMaps(
    "weather-kitty-map-alerts",
    config.AlertsMapUrl,
    config.AlertsMapCacheTime
  );

  // Forecast Matrix
  ForecastMatrix(weather.forecastData.properties.periods);
}

async function WeatherMaps(elementName, Url, CacheTime) {
  if (Log.Debug())
    console.log(`[WeatherMaps] ${elementName}, ${Url}, ${CacheTime}`);

  let maps = document.getElementsByTagName(elementName);
  let response = await corsCache(Url, null, CacheTime);
  if (response != null && response.ok) {
    let blob = await response.blob();
    let url = URL.createObjectURL(blob);
    for (let map of maps) {
      let img = map.getElementsByTagName("img")[0];
      img.src = url;
    }
  } else {
    console.log("[WeatherMaps] *** ERROR ***: No Map Data Available");
  }
}

// Function getWeatherLocationAsync
// City, State, Country, ZipCode, Latitude, Longitude
export async function getWeatherLocationAsync(callBack) {
  if (Log.Debug())
    console.log("[getWeatherLocationAsync] Checking Location Data");
  let response = null;

  response = await fetchCache(
    "/weatherkittycache/location",
    null,
    config.shortCacheTime
  );

  if (response == null || response.ok == false) {
    if (Log.Debug()) console.log("[getWeatherLocationAsync] Fetching GeoIp");
    response = await fetchCache(
      "/weatherkittycache/geoip",
      null,
      config.longCacheTime
    );
  }

  if (response == null || response.ok == false) {
    if (Log.Debug()) console.log("[getWeatherLocationAsync] Fetching Address");
    response = await fetchCache(
      "/weatherkittycache/address",
      null,
      config.FOREVER
    );
    if (Log.Debug()) console.log("[getAddress]", response);
  }

  if (response != null && response.ok) {
    let data = await response.json();
    if (Log.Debug()) console.log("[getWeatherLocationAsync]", data);
    return data;
  } else {
    if (Log.Error()) console.log("[getWeatherLocationAsync] *** ERROR ***");
    return null;
  }
}

// Function getLocationAsync
// City, State, Country, ZipCode, Latitude, Longitude
export async function getLocationAsync() {
  if (navigator.geolocation) {
    let position = await new Promise((position, error) => {
      navigator.geolocation.getCurrentPosition(position, error, {
        enableHighAccuracy: true,
      });
    }).catch((error) => {
      if (Log.Warn())
        console.log("[getLocationAsync] Warning: ", error.message);
      return null;
    });
    if (position) {
      if (Log.Debug())
        console.log("[getLocationAsync] Position: ", position.coords);
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
    if (Log.Error())
      console.log(
        "[getLocationAsync] Error: Geolocation data is not available."
      );
    return null;
  }
  throw new Error(
    "getLocationAsync: Neither Position nor Error.  This Should not Happen."
  );
}

// Function getWeatherLocationByIPAsync {
// City, State, Country, ZipCode, Latitude, Longitude
async function getWeatherLocationByIPAsync(callBack) {
  if (Log.Debug()) console.log(`[getLocationByIP] Checking IP Location Data`);

  // n/c - non-commercial use only
  // Site             Limits    Limit/Mth Limit/Day Limit/Min
  // ip-api.com/json  http n/c  75000     2500      45
  // ipapi.com                  100       ---       ---
  // ipapi.co/json              30000     967       0.5
  let locationUrl = "http://ipapi.co/json/";
  let response = await fetchCache(locationUrl, null, config.longCacheTime);

  // City, State, Country, ZipCode, Latitude, Longitude
  if (response != null && response.ok) {
    let data = await response.json();
    if (Log.Debug()) console.log("[getLocationByIP] Data: ", data);
    let result = {
      city: data.city,
      state: data.region,
      country: data.country_name,
      zip: data.postal,
      latitude: data.latitude,
      longitude: data.longitude,
    };
    if (Log.Debug()) console.log("[getLocationByIP] Result: ", result);
    return CreateResponse(result);
  }

  return response;
}

// Function getWeatherLocationByAddressAsync
// https://geocoding.geo.census.gov/geocoder/locations/address?street=4600+Silver+Hill+Rd&city=Washington&state=DC&zip=20233&benchmark=Public_AR_Current&format=json
// City, State, Country, ZipCode, Latitude, Longitude
async function getWeatherLocationByAddressAsync() {
  let address = prompt('"Address, City, State" or "Address, ZipCode"');
  if (address === null || address === "") {
    if (Log.Info()) console.log("[getAddress] No Address.");
    return null;
  }
  if (Log.Debug()) console.log(`[getAddress] "${address}"`);

  let array = address.split(",");
  let street = "";
  let city = "";
  let state = "";
  let zip = "";

  switch (array.length) {
    case 2:
      street = array[0].trim();
      zip = array[1].trim();
      break;
    case 3:
      street = array[0].trim();
      city = array[1].trim();
      state = array[2].trim();
      break;
    case 4:
      street = array[0].trim();
      city = array[1].trim();
      state = array[2].trim();
      zip = array[3].trim();
      break;
    default:
      if (Log.Error())
        console.log("[getAddress] Error: Unable to Parse Address");
      return;
  }

  // *** WARNING *** CORS Proxy Required

  let locationUrl = `https://corsproxy.io/?https://geocoding.geo.census.gov/geocoder/locations/address?street=${street}`;
  if (city !== "") locationUrl += `&city=${city}`;
  if (state !== "") locationUrl += `&state=${state}`;
  if (zip !== "") locationUrl += `&zip=${zip}`;
  locationUrl += `&benchmark=Public_AR_Current&format=json`;
  locationUrl = locationUrl.toLowerCase();
  let response = await fetchCache(locationUrl, null, config.FOREVER);

  // City, State, Country, ZipCode, Latitude, Longitude
  if (response && response.ok) {
    let data = await response.json();
    if (Log.Trace()) console.log("[getAddress] Data: ", data);
    if (data.result.addressMatches.length <= 0) {
      if (Log.Warn())
        console.log("[getAddress] *** WARNING ***: No Address Matches");
      return null;
    }
    let result = {
      city: data.result.addressMatches[0].addressComponents.city,
      state: data.result.addressMatches[0].addressComponents.state,
      country: (data.result.addressMatches[0].addressComponents.country ??= ""),
      zip: data.result.addressMatches[0].addressComponents.zip,
      latitude: data.result.addressMatches[0].coordinates.y,
      longitude: data.result.addressMatches[0].coordinates.x,
    };
    if (Log.Info()) console.log("[getAddress] Results:", result);
    return CreateResponse(result);
  }
  return response;
}

async function CreateResponse(data) {
  let responseOptions = {
    status: 200,
    statusText: "OK",
    ok: true,
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  };

  let responseBody = JSON.stringify(data);
  let response = new Response(responseBody, responseOptions);
  return response;
}

// Function getWeatherAsync
/* 
// tldr: Pick 6m for alerts or 1 hour for forecasts.
//
// Cache for 6 minutes so we can setinterval for 7 minutes which is
// about half of the 15 minutes interval the weather service updates
// it's possible we would want to set this as low as 4 or 5 minutes to
// catch weather alerts, or as high as 4 hours which is the forecast interval.
*/
async function getWeatherAsync() {
  let pointData = null;
  let stationsData = null;
  let observationData = null;
  let forecastData = null;
  let resultString = "";

  let locData = await getWeatherLocationAsync();
  let lat = locData?.latitude;
  let lon = locData?.longitude;
  if (lat && lon) {
    if (Log.Info) console.log(`[getWeatherAsync] Location: ${lat}, ${lon}`);
  } else {
    window.alert("No Location Data Available");
    throw new Error(
      "[getWeatherAsync] *** ERROR ***: No Location Data Available"
    );
  }

  // Get Location and check cached location, ... use, update, etc.
  // check the cached forecasturl, cwa, gridId, gridX, gridY ... use, update, etc.
  // ...

  // Notes
  // -----
  // https://api.weather.gov/points/36.82565689086914%2C-83.32009887695312
  // https://api.weather.gov/gridpoints/JKL/65,16/stations
  // https://api.weather.gov/stations/${Station_ID}/observations

  // We need the GridID, GridX, GridY to get the forecast

  let stationLocationUrl = `https://api.weather.gov/points/${lat},${lon}`;
  let weatherForecastUrl = null;
  let observationStationsUrl = null;
  let response = null;
  response = await fetchCache(stationLocationUrl, null, config.longCacheTime);
  if (response && response.ok) {
    let data = await response.json();
    pointData = data;
    if (Log.Trace()) console.log("[getWeatherAsync] ", data);
    weatherForecastUrl = String(data.properties.forecast);
    observationStationsUrl = String(data.properties.observationStations);
    let city = data.properties.relativeLocation.properties.city;
    let state = data.properties.relativeLocation.properties.state;
    let locationName = `${city}, ${state}`;
    if (Log.Debug()) {
      console.log("[getWeatherAsync] ", locationName);
    }
    resultString += locationName;
  } else {
    throw new Error("[getWeatherAsync] *** ERROR ***: No Point Data Available");
  }

  // Get "Featured" Observation Station ... from Stations
  // https://api.weather.gov/stations/KI35/observations

  let observationStationID = null;
  if (observationStationsUrl) {
    response = await fetchCache(
      observationStationsUrl,
      null,
      config.longCacheTime
    );
    if (response && response.ok) {
      let data = await response.json();
      stationsData = data;
      if (Log.Trace()) console.log("[getWeatherAsync] ", data);
      observationStationID = String(
        data.features[0].properties.stationIdentifier
      );
      if (Log.Debug()) console.log("[getWeatherAsync] ", observationStationID);
      resultString += `, ${observationStationID}`;
    } else {
      if (Log.Error())
        console.log(
          "[getWeatherAsync] *** ERROR ***: No Stations Data Available"
        );
    }
  } else {
    if (Log.Error())
      console.log(
        "[getWeatherAsync] *** ERROR ***: No Observation Stations URL"
      );
  }

  // Get Current Observation

  if (observationStationID) {
    let observationUrl = `https://api.weather.gov/stations/${observationStationID}/observations`;
    response = await fetchCache(observationUrl, null, config.obsCacheTime);
    if (response && response.ok) {
      let data = await response.json();
      if (Log.Trace()) console.log("[getWeatherAsync] ", data);
      observationData = data;
      let temp = data.features[0].properties.temperature.value;
      let units = data.features[0].properties.temperature.unitCode;
      temp = Fahrenheit(temp, units);
      let obs = data.features[0].properties.textDescription;
      if (Log.Debug()) {
        console.log(`[getWeatherAsync] Observation: ${temp} ${obs}`);
      }
      resultString += `, ${temp} ${obs}`;
    } else {
      if (Log.Error())
        console.log("[getWeatherAsync] *** ERROR ***: No Obs Data Available");
    }
  } else {
    if (Log.Error())
      console.log("[getWeatherAsync] *** ERROR ***: No Observation Station ID");
  }

  // Get the forecast
  // https://api.weather.gov/gridpoints/JKL/65,16/forecast

  if (weatherForecastUrl) {
    response = await fetchCache(
      weatherForecastUrl,
      null,
      config.forecastCacheTime
    );
    if (response.ok) {
      let data = await response.json();
      forecastData = data;
      if (Log.Trace()) console.log("[getWeatherAsync] ", data);
      let temp = data.properties.periods[0].temperature;
      let units = data.properties.periods[0].temperatureUnit;
      temp = Fahrenheit(temp, units);
      let forecast = data.properties.periods[0].shortForecast;
      if (Log.Debug()) {
        console.log(`[getWeatherAsync] Forecast: ${temp} ${forecast}`);
      }
      resultString += `, ${temp} ${forecast}`;
    } else {
      if (Log.Error())
        console.log(
          "[getWeatherAsync] *** ERROR ***: No Forecast Data Available"
        );
    }
  } else {
    if (Log.Error())
      console.log("[getWeatherAsync] *** ERROR ***: No Forecast URL");
  }

  // Call the callback function:
  // callBack(cached);
  if (Log.Info()) console.log(`[getWeatherAsync] ${resultString}`);
  return { pointData, stationsData, observationData, forecastData };
}

function ForecastMatrix(data) {
  if (!data || data.length <= 0) {
    console.log("[ForecastMatrix] *** ERROR ***: No Data Available");
    return;
  }
  console.log("[ForecastMatrix] ", data);
  let text = "";
  for (let period of data) {
    text += `<div>`;
    text += `<div>${period.name}</div>`;
    text += `<img src=${period.icon} alt="Weather Image"><br>`;
    text += `<div>`;
    text += `<span>${
      period.temperature
    }<small>${period.temperatureUnit.toLowerCase()}</small></span> - <span>`;
    text += `${(period.probabilityOfPrecipitation.value ??= 0)}<small>${period.probabilityOfPrecipitation.unitCode.replace(
      "wmoUnit:percent",
      "%"
    )}</small><span>`;
    text += `</div>`;
    text += `${BadHyphen(period.shortForecast)}`;
    text += `</div>`;
  }
  let target = document.getElementById("Matrix");
  if (target != null) target.innerHTML = text;
  else console.log("[ForecastMatrix] *** ERROR ***: Target Not Found");
}

function ObservationCharts(data) {
  if (WeatherKittyDebug <= 2) console.log("[Obs Chart Data] ", data);

  let obsArray = ["timestamp"];

  if (data !== null && data !== undefined && data.length > 0) {
    let keys = Object.keys(data[0].properties);
    for (let key of keys) {
      let unitCode = data[0]?.properties[key]?.unitCode;
      if (
        unitCode != null &&
        unitCode != undefined &&
        unitCode != "" &&
        obsArray.includes(key) === false
      )
        obsArray.push(key);
    }
  } else {
    console.log("[ObservationCharts] *** ERROR ***: No Data Available");
    return;
  }

  let chartData = new Map();
  for (let i = 0; i < obsArray.length; i++) {
    chartData.set(obsArray[i], []);
  }

  if (data.length > 0) {
    for (let observation of obsArray) {
      if (WeatherKittyDebug <= 2)
        console.log(
          "[Obs Chart Data Collect] ",
          observation,
          " : ",
          data[0].properties[observation]
        );

      for (let i = 0; i < data.length; i++) {
        if (
          data[i].properties[observation] === null ||
          data[i].properties[observation] === undefined ||
          data[i].properties[observation] === ""
        ) {
          chartData.get(observation).push(NaN);
        } else {
          // Convert to Fahrenheit
          let value = data[i].properties[observation].value;
          let unitCode = data[i].properties[observation].unitCode;
          if (
            unitCode !== null &&
            unitCode !== undefined &&
            unitCode === "wmoUnit:degC"
          ) {
            data[i].properties[observation].value = Fahrenheit(value, "°C");
            data[i].properties[observation].unitCode = "°F";
          }
          // /Convert to Fahrenheit

          chartData.get(observation).push(data[i].properties[observation]);
        }
      }
    }
    if (!WeatherKittyDebug) {
      let message = "[Observation Chart-able Types Found] ";
      for (let key of obsArray) {
        let unitCode = data[0].properties[key].unitCode;
        if (unitCode !== null && unitCode !== undefined)
          unitCode = unitCode.replace("wmoUnit:", "");
        message += ` ${key}:${unitCode}, `;
      }
      console.log(message);
    }
  }

  let containerArray = document.getElementsByTagName("weather-kitty-chart");
  for (let container of containerArray) {
    let chartType = container.getAttribute("type");
    if (chartType === null || chartType === undefined) {
      console.log("[ObservationCharts] *** ERROR ***: Chart Type Not Defined");
      console.log(container);
      return;
    }
    if (obsArray.includes(chartType) === false) {
      console.log(
        "[ObservationCharts] *** ERROR ***: Chart Type Not Found in Observation Data"
      );
      console.log(container);
      console.log(obsArray);
      return;
    }
    CreateChart(
      container,
      chartType,
      chartData.get(chartType),
      chartData.get("timestamp")
    );
  }
}

export async function CreateChart(
  chartContainer,
  key,
  values,
  timestamps,
  aspect,
  history
) {
  if (values == null || values.length == 0 || values[0].value === undefined) {
    console.log(
      `[CreateChart] *** ERROR *** Barp! on ${key}.  values are empty`
    );
    console.log(chartContainer);
    console.log(key);
    console.log(values);
    console.log(timestamps);
    return;
  }
  if (
    timestamps === null ||
    timestamps === undefined ||
    timestamps.length === 0 ||
    timestamps[0] === undefined
  ) {
    console.log(
      `[CreateChart] *** ERROR *** Barp! on ${key}.  timestamps are empty`
    );
    console.log(chartContainer, key, values, timestamps);
    return;
  }
  if (
    chartContainer === null ||
    chartContainer === undefined ||
    chartContainer.length === 0
  ) {
    console.log("[CreateChart] *** ERROR *** chartContainer is Null! ");
    console.log(chartContainer, key, values, timestamps);
    return;
  }
  if (key === "timestamp") return; // I should just leave that one in for fun.

  if (WeatherKittyDebug <= 2)
    console.log("[CreateChart] ", key, values[0].value, timestamps[0]);

  let data = [];
  let time = [];
  for (let i = 0; i < values.length; i++) {
    data.push(values[i].value);
    let date = new Date(timestamps[i]);
    let label;
    if (history) {
      label = date.toLocaleString(undefined, config.historyFormat);
      label = label.replace(/ AM/, "a").replace(/ PM/, "p").replace(/\//g, "-");
    } else {
      label = date.toLocaleString(undefined, config.timeFormat);
      label = label.replace(/ AM/, "a").replace(/ PM/, "p").replace(/\//g, "-");
    }
    time.push(label);
  }
  data = data.reverse();
  time = time.reverse();

  //  6em high labels
  await new Promise((r) => setTimeout(r, 1)); // give the container time to grow/shrink
  let oneEm = getComputedStyle(chartContainer).fontSize.replace("px", "");
  let width = getComputedStyle(chartContainer).width.replace("px", "");
  let height = getComputedStyle(chartContainer).height.replace("px", "");
  if (height < oneEm * 18) height = oneEm * 18;
  let chartAspect = (width - oneEm) / height;
  if (chartAspect < 1) chartAspect = 1;
  if (chartAspect > 2.5) chartAspect = 2.5;
  if (aspect != null && aspect != 0) chartAspect = aspect;

  if (WeatherKittyDebug <= 2)
    console.log(
      `[CreateChart] Em = ${oneEm},   Aspect Ratio: ${width / oneEm} / ${
        height / oneEm
      } = ${chartAspect}`
    );

  let canvas = chartContainer.getElementsByTagName("canvas")[0];
  if (canvas === null || canvas === undefined) {
    console.log("[CreateChart] *** ERROR ***: Canvas Element Not Found");
    console.log(chartContainer);
    return;
  }

  canvas.id = key;

  // ------------------------------------------------------------------
  let chart = Chart.getChart(canvas);

  if (chart === null || chart === undefined) {
    if (WeatherKittyDebug <= 2)
      console.log(
        `[CreateChart New] Type: ${key},   Canvas: ${canvas},   Chart: ${chart}`
      );
    let labelName = `${key} - ${values[0].unitCode}`;
    labelName = labelName.replace("wmoUnit:", "");
    let newChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: time,
        datasets: [
          {
            label: labelName,
            data: data,
            // "circle", "cross", "crossRot", "dash", "line", "rect", "rectRounded", "rectRot", "star", "triangle", false
            pointStyle: false,
          },
        ],
      },
      options: {
        aspectRatio: chartAspect,
        maintainAspectRatio: true,
        scales: {
          x: {
            ticks: {
              maxRotation: 90,
              minRotation: 60,
            },
          },
        },
      },
    });
    newChart.update();
  } else {
    if (WeatherKittyDebug <= 2)
      console.log(
        `[CreateChart Update] Type: ${key},   Canvas: ${canvas},   Chart: ${chart}`
      );
    let labelName = `${key} - ${values[0].unitCode}`;
    chart.data.labels = time;
    chart.data.datasets = [
      {
        label: labelName,
        data: data,
      },
    ];
  }
  // ------------------------------------------------------------------
}

// Function WeatherSquares
function WeatherSquares(
  elementId,
  replacementText,
  replacementImgUrl,
  alternateImgUrl
) {
  let elements = document.getElementsByTagName(elementId);
  if (elements == undefined || elements == null || elements.length === 0) {
    console.log(`[WeatherSquares] Element [${elementId}] Not Found`);
    return;
  }
  for (let element of elements) {
    let weatherImg = element.querySelector("weather-kitty-current > img");
    let textDiv = element.querySelector("weather-kitty-current > span");
    if (weatherImg === null) {
      weatherImg = element.querySelector("weather-kitty-forecast > img");
      textDiv = element.querySelector("weather-kitty-forecast > span");
    }

    if (WeatherKittyDebug <= 2)
      console.log(`[WeatherWidget] Text: ${textDiv.innerHTML}`);
    textDiv.innerHTML = replacementText;
    if (WeatherKittyDebug <= 2)
      console.log(`[WeatherWidget] Text => ${textDiv.innerHTML}`);

    // Icon

    if (WeatherKittyDebug <= 2)
      console.log(`[WeatherWidget] Icon: ${weatherImg.src}`);
    if (
      replacementImgUrl !== null &&
      replacementImgUrl !== "" &&
      replacementImgUrl.includes("/null") === false
    )
      weatherImg.src = replacementImgUrl;
    else {
      if (alternateImgUrl !== null && alternateImgUrl !== "")
        weatherImg.src = alternateImgUrl;
      else
        weatherImg.src = `url(config.WeatherKittyPath + "img/WeatherKittyE8.png")`;
    }
    if (WeatherKittyDebug <= 2)
      console.log(`[WeatherWidget] Icon => ${weatherImg.src}`);
  }
}

// Function WeatherTemperatureFahrenheit
// .replace(/wmoUnit\:deg/i, "")
function Fahrenheit(temperature, temperatureUnit) {
  // ((fahrenheit - 32) * 5 / 9) °F to °C;
  if (temperature === null || temperature === undefined || temperature === "")
    return NaN;
  // celcius to fahrenheit: (celsius * 9 / 5) + 32
  let fahrenheit = -999;
  temperatureUnit = temperatureUnit.toLowerCase();
  temperatureUnit = temperatureUnit.replace(/wmoUnit\:deg/i, "");
  if (temperatureUnit === "f" || temperatureUnit === "°f")
    fahrenheit = Math.round(temperature);
  else if (temperatureUnit == "c" || temperatureUnit === "°c")
    fahrenheit = Math.round((temperature * 9) / 5 + 32);
  else
    console.log(
      `*** WARNING ***: Invalid Temperature Unit: ${temperatureUnit}`
    );

  if (WeatherKittyDebug <= 0)
    console.log(
      `[WeatherTemperatureFahrenheit] ${temperature} ${temperatureUnit} = ${fahrenheit} °F`
    );
  return fahrenheit;
}

// Function Elapsed Time
function wkElapsedTime(startTime) {
  let endTime = new Date();
  // let elapsed = Math.abs(endTime - startTime);
  let elapsed = endTime - startTime;
  let seconds = Math.trunc(elapsed / 1000);
  let minutes = Math.trunc(seconds / 60);
  let hours = Math.trunc(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  if (WeatherKittyDebug <= 0) {
    console.log("Start: ", startTime);
    console.log("End: ", endTime);
    console.log("Elapsed: ", elapsed);
  }

  if (hours) return `${hours}h`;
  if (minutes) return `${minutes}m`;
  if (seconds) return `${seconds}s`;

  return `${hours}h ${minutes}m ${seconds}s`;
}

// Function findWeatherWords
function findWeatherWords(shortForecast) {
  // Weather Phrases sorted by Severity
  let weatherPhrases = [
    "Hurricane",
    "Tornado",
    "Tropical Storm",
    "Blizzard",

    "Ice Storm",
    "Winter Storm",
    "Hail",
    "Freezing Rain",
    "Freezing Drizzle",
    "Sleet",
    "Heavy Snow",
    "Snow",
    "Flurries",

    "Severe Lightning Storm",
    "Severe Lightning",
    "Lightning Storm",
    "Severe Thunderstorm",
    "Freezing Rain",
    "Freezing Drizzle",
    "Thunderstorms",
    "Thunderstorm",
    "Lightning",

    "Rain",
    "Showers",
    "Shower",
    "Drizzle",

    "Smoke",
    "Fog",
    "Haze",

    "Windy",

    "Cloudy",
    "Mostly Cloudy",
    "Partly Cloudy",
    "Scattered Clouds",
    "Overcast",

    "Hot",
    "Cold",
    "Sunny",
    "Clear",
  ];

  for (let i = 0; i < weatherPhrases.length; i++) {
    if (shortForecast.toLowerCase().includes(weatherPhrases[i].toLowerCase())) {
      return BadHyphen(weatherPhrases[i]);
    }
  }

  return "Error";
}
// Function BadHyphen
function BadHyphen(phrase) {
  let split = 7;
  let words = phrase.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (words[i].length > split) {
      words[i] = words[i].substring(0, split) + "-" + words[i].substring(split);
    }
  }
  return words.join(" ");
}

// Function getWidthInEm
function getWidthInEm(element) {
  let fontSize = parseFloat(getComputedStyle(element).fontSize);

  let widthInPixels = getComputedStyle(element).width;
  widthInPixels = parseFloat(widthInPixels.replace("px", ""));

  let result = widthInPixels / fontSize;
  if (WeatherKittyDebug <= 2)
    console.log(
      `[getWidthInEm] ${widthInPixels}px / ${fontSize}px = ${result}em`
    );

  return result;
}

// Function WeatherKittyCheckPath
async function WeatherKittyCheckPath(path) {
  path = "/" + path;
  let target = path + config.WeatherKittyObsImage;
  let result = await fetch(target);
  if (WeatherKittyDebug <= 2)
    console.log(
      `[WeatherKittyCheckPath] Checking Path: [${path}] [${result.ok}]`
    );
  if (result.ok) return path;
  else return null;
}

// Function FindAndReplaceTags
function FindAndReplaceTags(tagName, htmlBlock, className) {
  let widgets = document.getElementsByTagName(tagName);
  for (let widget of widgets) {
    let htmlString = widget?.innerHTML; // check the inner so we can detect custom html
    if (WeatherKittyDebug <= 0)
      console.log("[FindAndReplaceTags] innerHTML: ", htmlString);
    if (
      htmlString != undefined &&
      htmlString != null &&
      htmlString != "" &&
      htmlString.includes("<")
    ) {
      if (WeatherKittyDebug <= 1)
        console.log("[FindAndReplaceTags] Custom HTML Detected");
    } else {
      if (WeatherKittyDebug <= 1)
        console.log("[FindAndReplaceTags] Using Default CodeBlock");
      if (WeatherKittyDebug <= 0) console.log(htmlBlock);
      widget.innerHTML = htmlBlock; // set the outer so we can include any classes or tags.
      if (className !== null && className !== undefined && className !== "")
        widget.className = className;
    }
  }
  return widgets.length;
}

// Function InjectWeatherKittyStyles
function InjectWeatherKittyStyles(path) {
  let file = path + "WeatherKitty.css";
  if (WeatherKittyDebug <= 2) console.log("[InjectWeatherKittyStyles] ", file);

  let link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = file;
  document.head.insertBefore(link, document.head.firstChild);
}

// Function RemoveAllEventListeners
function RemoveAllEventListeners(element) {
  let removedAllEventListeners = element.cloneNode(true);
  element.parentNode.replaceChild(removedAllEventListeners, element);
  return removedAllEventListeners;
}

// ------------------------------------------
// Function fetchCache(url, options, ttl)
// ... and special functions.

const specialUrlTable = {
  "/weatherkittycache/location": getLocationAsync,
  "/weatherkittycache/geoip": getWeatherLocationByIPAsync,
  "/weatherkittycache/address": getWeatherLocationByAddressAsync,
};

export async function clearCache(url) {
  console.log(`[clearCache] ${url}`);
  let cache = await caches.open("weather-kitty");
  await cache.delete(url);
}

export async function setCache(url, response, ttl) {
  console.log(`[setCache]`, url, response, ttl);
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  ttlCache[url] = Date.now() + ttl;
  localStorage.setItem("ttlCache", JSON.stringify(ttlCache));

  let cache = await caches.open("weather-kitty");
  await cache.put(url, response);
}

export async function fetchCache(url, options, ttl) {
  if (ttl == null || ttl < 0) ttl = config.defaultCacheTime;

  // url, options, ttl, expires, expired, response
  // get expire from localStorage ... I'm avoiding IndexDB for now
  let expires = Date.now() - 3600000;
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  if (ttlCache[url] != null) {
    expires = new Date(ttlCache[url]);
    if (Log.Trace())
      console.log(
        `[fetchCacheTtl] : ${url} expires in ${wkElapsedTime(expires)}`
      );
  } else {
    ttlCache[url] = 0;
    if (Log.Trace())
      console.log(`[fetchCacheTtl] ${url} not found in cache or expired`);
  }
  let expired = expires < Date.now();
  let cache = await caches.open("weather-kitty");
  let response = await cache.match(url);

  if (response && response.ok && !expired) {
    if (Log.Info())
      console.log(`[fetchCache] cached: ${url} [${wkElapsedTime(expires)}]`);
    return response;
  }

  // If the url is not cached or expired, fetch it
  // If the url is in the specialUrlTable, use the special function
  let fetchResponse = null;

  if (url in specialUrlTable) {
    if (Log.Debug()) console.log(`[fetchCache] special: ${url} `);
    fetchResponse = await specialUrlTable[url](url, options, ttl);
  } else {
    fetchResponse = await fetch(url, options);
  }
  if (fetchResponse && fetchResponse.ok) {
    expires = Date.now() + ttl;
    if (Log.Info())
      console.log(`[fetchCache] fetch: ${url} [${wkElapsedTime(expires)}]`);
    let responseClone = fetchResponse.clone();
    await cache.put(url, responseClone);
    ttlCache[url] = expires;
    localStorage.setItem("ttlCache", JSON.stringify(ttlCache));
    return fetchResponse;
  } else if (response) {
    if (Log.Warn())
      console.log(
        `[fetchCache] WARNING: Stale: ${url} [${wkElapsedTime(expires)}]`
      );
    return response;
  } else {
    if (Log.Warn()) console.log(`[fetchCache] WARNING: not found: ${url}`);
    return null;
  }
}

// Function corsCache
async function corsCache(url, options, ttl) {
  let corsUrl = `${config.CORSProxy}${url}`;
  return fetchCache(corsUrl, options, ttl);
}

// -----------------------------------

// -----------------------------------

// HTML Block for Weather Kitty
// functions instead of variables, so that path updates to the images can take effect
function WeatherKittyCurrentBlock() {
  let results = `<weather-kitty-tooltip></weather-kitty-tooltip>
  <img src="${config.WeatherKittyObsImage}" class="WeatherKittyImage"/>
  <span class="WeatherKittyText">Loading . . .</span>`;
  return results;
}

function WeatherKittyForecastBlock() {
  let results = `<weather-kitty-tooltip></weather-kitty-tooltip>
  <img src="${config.WeatherKittyForeImage}" class="WeatherKittyImage" />
  <span class="WeatherKittyText">Loading . . .</span>`;
  return results;
}

let WeatherKittyWidgetBlock = `<weather-kitty-current></weather-kitty-current>
  <div style="width: 0.5em;"></div>
  <weather-kitty-forecast></weather-kitty-forecast>`;

let WeatherKittyChartBlock = `<canvas></canvas>`;

// src="https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?1728599137"
let WeatherKittyMapForecastBlock = `<img
            alt="NWS Forecast"
            onclick="AIshowFullscreenImage(this)"
        />`;

let WeatherKittyMapRadarBlock = `<img
            alt="NWS Radar"
            onclick="AIshowFullscreenImage(this)"
          />`;

let WeatherKittyMapAlertsBlock = `          <img
            alt="US Weather Alerts Map"
            onclick="AIshowFullscreenImage(this)"
          />`;

function WeatherKittyLocationBlock() {
  let results = `<span></span>
  <button>Set</button>`;
  return results;
}

// Run Weather Kitty
WeatherKittyStart();
