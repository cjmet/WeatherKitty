"use strict";

import "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
import "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js";
// import lodash from "https://cdn.jsdelivr.net/npm/lodash/+esm";

// Logging ---------------------------------------------------------------
// LogLevel.Error     - Critical Errors Only.
// **LogLevel.Warn**  - DEFAULT: Startup Notification, Warnings, and Errors. We don't want to annoy someone that uses our module with info they don't need.
// LogLevel.Info      - Summary of what's happening
// LogLevel.Debug     - Detailed Information
// LogLevel.Trace     - adds LOADING DELAYS, and other detailed information
// LogLevel.Verbose   - EVERYTHING, including all the unit conversions.
let LogLevel = {
  Verbose: 0,
  Trace: 1,
  Debug: 2,
  Info: 3,
  Warn: 4,
  Error: 5,
  Off: 10,
};
let Log = {
  LogLevel: LogLevel.Warn,
  SetLogLevel(level) {
    Log.LogLevel = level;
    console.log(`[WeatherKittyLog] LogLevel: ${Log.GetLogLevelText()}`);
  },
  GetLogLevelText() {
    for (let key in LogLevel) {
      if (LogLevel[key] === Log.LogLevel) return key;
    }
    return "Unknown";
  },
  Verbose: () => {
    return LogLevel.Verbose >= Log.LogLevel;
  },
  Trace: () => {
    return LogLevel.Trace >= Log.LogLevel;
  },
  Debug: () => {
    return LogLevel.Debug >= Log.LogLevel;
  },
  Info: () => {
    return LogLevel.Info >= Log.LogLevel;
  },
  Warn: () => {
    return LogLevel.Warn >= Log.LogLevel;
  },
  Error: () => {
    return LogLevel.Error >= Log.LogLevel;
  },
};
export { Log, LogLevel };
// /Logging

let config = {
  FOREVER: Number.MAX_SAFE_INTEGER / 2,
  locCacheTime: 60000 * 5, // 5? minutes just in case we are in a car and chasing a tornado?
  shortCacheTime: 60000 * 6, // 7 (-1) minutes so we can catch weather alerts
  obsCacheTime: 60000 * 10, // 10 minutes
  forecastCacheTime: 60000 * 60, // 1 hour
  longCacheTime: 60000 * 60 * 24, // 24 hours
  archiveCacheTime: 60000 * 60 * 24 * 30, // 30 days
  defaultCacheTime: 60000 * 30, // 30 minutes

  CORSProxy: "https://corsproxy.io/?", // CORS Proxy "https://corsproxy.io/?" or "" for none

  ForecastMapUrl: "https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?1728599137",
  ForecastMapCacheTime: 60000 * 60 * 1, // 1 hours
  RadarMapUrl: "https://radar.weather.gov/ridge/standard/CONUS-LARGE_loop.gif",
  RadarMapCacheTime: 60000 * 10, // 10 minutes
  AlertsMapUrl: "https://www.weather.gov/wwamap/png/US.png",
  AlertsMapCacheTime: 60000 * 10, // 10 minutes

  HistoryDataMaxLimit: 32000, // Default: 500 // cjm

  historyFormat: {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  },
  timeFormat: {
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: true, // Delete for 24-hour format
    minute: "2-digit",
  },

  WeatherKittyObsImage: "img/WeatherKittyE8.jpeg",
  WeatherKittyForeImage: "img/WeatherKittyC.jpeg",

  // Static Status Variables

  WeatherKittyIsInit: false,
  WeatherKittyIsLoaded: null,
  WeatherKittyIsLoading: false,
  WeatherKittyPath: "",

  SanityChecks: function () {
    if (config.shortCacheTime < 60000) config.shortCacheTime = 60000;
    if (config.longCacheTime < 60000) config.longCacheTime = 60000;
    if (config.defaultCacheTime < 60000) config.defaultCacheTime = 60000;
    if (config.locCacheTime < 60000) config.locCacheTime = 60000;
    if (config.ForecastMapCacheTime < 60000)
      config.ForecastMapCacheTime = 60000;
    if (config.RadarMapCacheTime < 60000) config.RadarMapCacheTime = 60000;
    if (config.AlertsMapCacheTime < 60000) config.AlertsMapCacheTime = 60000;
  },
  isLoadingIsVerbose: false,
  Verbose: function () {
    this.isLoadingIsVerbose = !this.isLoadingIsVerbose;
  },
};
export { config };

// Function Weather Kitty
export default WeatherKittyStart;
export async function WeatherKittyStart() {
  await WeatherKittyIsLoading(true, "startup");
  config.SanityChecks();
  if (config.WeatherKittyIsLoaded) {
    if (Log.Error())
      console.log("[WeatherKitty] *** ERROR *** : Already Loaded");
    return;
  }
  config.WeatherKittyIsLoaded = true;
  await microSleep(1); // Just long enough that you can set the log level before it starts.

  let path = "";
  let results;
  if (Log.Debug()) console.log(`Weather Kitty Loglevel: [${Log.LogLevel}]`);
  else if (Log.Info()) console.log("[WeatherKittyStart] Loading ");

  let scripts = document.getElementsByTagName("script");
  let script = null;
  for (let subScript of scripts) {
    if (subScript.src.includes("WeatherKitty")) {
      script = subScript;
      break;
    }
  }
  if (script === null) {
    if (Log.Debug())
      console.log(
        `[WeatherKittyStart] WARNING: Unable to find WeatherKitty script in:\n[${window.location.pathname}]`
      );
  } else {
    if (Log.Debug()) console.log("[WeatherKittyStart] Script: ", script.src);
    let url = new URL(script.src);
    path = url.pathname;
    const lastSlashIndex = path.lastIndexOf("/");
    if (lastSlashIndex >= 0) path = path.substring(0, lastSlashIndex + 1); // Include the trailing slash
    if (Log.Warn()) console.log("[WeatherKittyStart] Path: ", path);
    config.WeatherKittyPath = path;
  }

  config.WeatherKittyObsImage = path + config.WeatherKittyObsImage;
  config.WeatherKittyForeImage = path + config.WeatherKittyForeImage;

  if (Log.Debug()) {
    console.log(`[WeatherKittyStart] Obs : ${config.WeatherKittyObsImage}`);
    console.log(`[WeatherKittyStart] Fore: ${config.WeatherKittyForeImage}`);
  }

  // Start the Weather Kitty Widget
  if (Log.Trace()) {
    console.log(
      "[WeatherKittyStart] WARNING: Setting Loading Delays for Debugging."
    );
    setTimeout(await WeatherWidgetInit(path), 3000);
    setTimeout(WeatherKitty, 6000);
  } else {
    setTimeout(await WeatherWidgetInit(path), 5);
    setTimeout(WeatherKitty, 10);
  }

  setInterval(WeatherKitty, config.shortCacheTime);
}

// Function Weather Widget Initialization
async function WeatherWidgetInit(path) {
  if (config.WeatherKittyIsInit) return;
  config.WeatherKittyIsInit = true;

  InjectWeatherKittyStyles(path);

  let geoAddressFound = false;
  let widgets;
  let result;

  // --- Order Matters --- ----------------------------------------------
  widgets = FindAndReplaceTags(
    "weather-kitty",
    WeatherKittyWidgetBlock,
    "WeatherKitty"
  ); // Order matters

  result = FindAndReplaceTags(
    "weather-kitty-current",
    WeatherKittyCurrentBlock(),
    "WeatherKittyBlock"
  );
  widgets = [...widgets, ...result];

  result = FindAndReplaceTags(
    "weather-kitty-forecast",
    WeatherKittyForecastBlock(),
    "WeatherKittyBlock"
  );
  widgets = [...widgets, ...result];

  result = FindAndReplaceTags(
    "weather-kitty-geoaddress",
    WeatherKittyGeoAddressBlock(),
    "WeatherKittyGeoAddress"
  );
  widgets = [...widgets, ...result];
  if (result.length > 0) geoAddressFound = true;
  // --- /Order Matters --- ----------------------------------------------

  result = FindAndReplaceTags(
    "weather-kitty-map-forecast",
    WeatherKittyMapForecastBlock,
    "WeatherKittyMapForecast"
  );
  widgets = [...widgets, ...result];

  result = FindAndReplaceTags(
    "weather-kitty-map-radar",
    WeatherKittyMapRadarBlock,
    "WeatherKittyMapRadar"
  );
  widgets = [...widgets, ...result];

  result = FindAndReplaceTags(
    "weather-kitty-map-alerts",
    WeatherKittyMapAlertsBlock,
    "WeatherKittyMapAlerts"
  );
  widgets = [...widgets, ...result];

  result = FindAndReplaceTags(
    "weather-kitty-chart",
    WeatherKittyChartBlock,
    "WeatherKittyChart"
  );
  widgets = [...widgets, ...result];

  if (widgets.length > 0) {
    if (Log.Debug())
      console.log(`[WeatherWidgetInit] Elements Found: ${widgets}`);
    if (!geoAddressFound) {
      if (Log.Warn())
        console.log(
          "[WeatherWidgetInit] WARNING: No GeoAddress Element Found."
        );
      // SetAddLocationButton(widgets[0]);
      InsertGeoAddressElement(widgets[0]);
    }
    return true;
  } else {
    if (Log.Warn())
      console.log(
        "[WeatherWidgetInit] WARNING: Weather Kitty Elements Not Found"
      );
    return false;
  }
}

// Function sleep();
export async function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export async function microSleep(milliSeconds) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}

// Function Weather Widget
export async function WeatherKitty() {
  if (config.PAUSE) {
    if (Log.Warn()) console.log("[WeatherKitty] Warning: PAUSED");
    return;
  }
  await WeatherKittyIsLoading(true, "WeatherKitty"); // in theory this should be ok. otherwise await it.
  // fetchCache the Maps.  Putting it here lets it run async with the getweatherasync
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

  // Get/Update the Weather Data
  let weather = await getWeatherAsync();
  let historyStation = await HistoryGetStation();

  await WeatherKittyIsLoading(true, "widget");
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
    let precip =
      weather.forecastData.properties.periods[0].probabilityOfPrecipitation
        .value;

    let text = `${shortText}`;
    if (temp !== null && temp !== undefined && !isNaN(temp))
      text += ` ${temp}°F`;
    if (precip !== null && precip !== undefined && !isNaN(precip) && precip)
      text += ` - ${precip}%`;

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
    let precip =
      weather.forecastData.properties.periods[0].probabilityOfPrecipitation
        .value;

    let text = `${shortText}`;
    if (temp !== null && temp !== undefined && !isNaN(temp))
      text += ` ${temp}°F`;
    if (precip !== null && precip !== undefined && !isNaN(precip) && precip)
      text += ` - ${precip}%`;

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
    locationName += historyStation?.id ? " - " + historyStation.id : "";

    let shortText = weather.forecastData.properties.periods[0].shortForecast;
    let forecast = weather.forecastData.properties.periods[0].detailedForecast;
    let temp = weather.forecastData.properties.periods[0].temperature;
    let unit = weather.forecastData.properties.periods[0].temperatureUnit;
    temp = Fahrenheit(temp, unit);
    let precip = weather.forecastData.properties.periods[0].detailedForecast; // already above
    let img = weather.forecastData.properties.periods[0].icon;
    let altimg = config.WeatherKittyForeImage;
    let text = "";

    // text += `<b>${locationName}</b><br><br>`;

    text += `<b>Current:</b><br>`;
    text += `${shortText}`;
    if (temp !== null && temp !== undefined && !isNaN(temp))
      text += ` ${temp}°F`;
    if (precip !== null && precip !== undefined && !isNaN(precip) && precip)
      text += ` - ${precip}% precipitation`;
    text += `<br><br>`;

    text += `<b>Forecast:</b><br>`;
    text += `${forecast} ${temp}°F`;

    let widgets = document.getElementsByTagName("weather-kitty-tooltip");
    for (let widget of widgets) {
      // widget.setAttribute("tooltip", forecast);
      let paragraph = widget.getElementsByTagName("p");
      if (paragraph && paragraph.length > 0) paragraph[0].innerHTML = text;
    }
  }

  // weather-kitty-geoaddress Location Block
  // longname
  // "100 lake shore, Village of Grosse Pointe Shores, Michigan"
  // "Chargoggagoggmanchauggagoggchaubunagungamaugg, MA";
  await WeatherKittyIsLoading(true, "GeoAddress");
  let widgets = document.getElementsByTagName("weather-kitty-geoaddress");
  for (let widget of widgets) {
    let span = widget.getElementsByTagName("span")[0];
    if (span) span.innerHTML = locationName;
    SetAddLocationButton(widget);
  }

  // Forecast Matrix
  await WeatherKittyIsLoading(true, "Forecast Matrix");
  ForecastMatrix(weather.forecastData.properties.periods);

  // --------------------------------------------------------------
  // Charting
  // barometricPressure, dewpoint, ...
  // check for chart types, if we don't need them, don't pull the data.
  let ChartTypes = await WeatherKittyGetChartTypes();
  if (Log.Debug())
    console.log(
      `[WeatherKitty] ChartTypes[${ChartTypes.length}]: `,
      ChartTypes
    );

  if (ChartTypes?.length > 0) {
    let chartData = new Map();
    let historyData = new Map();

    if (ChartTypes?.Weather?.length > 0) {
      await WeatherKittyIsLoading(true, "Obs ChartData");
      chartData = await GetObservationChartData(
        weather.observationData.features
      );
    }

    if (ChartTypes?.History.length > 0) {
      await WeatherKittyIsLoading(true, "History ChartData");
      historyData = await HistoryGetChartData();
    }

    // append the history data
    if (ChartTypes?.History.length > 0 && historyData.size > 0) {
      await WeatherKittyIsLoading(true, "Merged ChartData");
      for (let key of historyData.keys()) {
        chartData.set(key, historyData.get(key));
      }
    } else if (ChartTypes?.History.length > 0) {
      chartData = historyData;
    }

    await WeatherCharts(chartData);
  }

  await WeatherKittyIsLoading(false);
}

async function WeatherKittyGetChartTypes() {
  let result = { Weather: [], History: [] };
  let elements = document.getElementsByTagName("weather-kitty-chart");
  for (let element of elements) {
    let chartType = element.getAttribute("type");
    if (chartType) {
      if (chartType.length === 4) result.History.push(chartType);
      else result.Weather.push(chartType);
    }
  }
  result.length = result.Weather.length + result.History.length;
  return result;
}

// Function InsertGeoAddressElement
function InsertGeoAddressElement(widget) {
  if (!widget) return;

  let div = document.createElement("div");
  div.style.width = "100%";
  div.style.display = "flex";
  div.style.justifyContent = "right";
  div.style.alignItems = "center";
  div.style.margin = "0";
  div.style.padding = "0";
  widget.appendChild(div);

  let element = document.createElement("weather-kitty-geoaddress");
  div.appendChild(element);
  let results = FindAndReplaceTags(
    "weather-kitty-geoaddress",
    WeatherKittyGeoAddressBlock(),
    "WeatherKittyGeoAddress"
  );
  if (!results || results.length <= 0) {
    if (Log.Error())
      console.log(
        "[InsertGeoAddressElement] *** ERROR ***: GeoAddress Element Could Not Be Created"
      );
  } else {
    if (Log.Info())
      console.log(
        "[InsertGeoAddressElement] GeoAddress Element Created and Inserted"
      );
  }
}

// Function SetLocation Button
export function SetAddLocationButton(widget) {
  let button = widget.getElementsByTagName("button")[0];
  if (!button) {
    // add the button
    let div = document.createElement("div");
    div.style.position = "relative";
    div.style.right = "0";
    div.style.bottom = "0";
    div.style.flex = "1 1 auto";
    div.style.display = "flex";
    div.style.justifyContent = "flex-end";
    div.style.alignItems = "center";
    div.style.zIndex = "10";
    widget.appendChild(div);

    button = document.createElement("button");
    button.innerHTML = "Set";
    button.style.fontSize = "x-small";
    button.style.margin = 0;
    button.style.padding = 0;
    button.style.textAlign = "center";
    button.style.textJustify = "center";
    // button.style.position = "absolute";
    button.style.right = "0";
    button.style.bottom = "0";
    div.appendChild(button);
  }
  button = RemoveAllEventListeners(button);
  button.addEventListener("click", async () => {
    let result = await getWeatherLocationByAddressAsync();
    if (result && result.ok) {
      // Override the location cache, and make it permanent.
      await setCache("/weatherkittycache/location", result, config.FOREVER);
    } else {
      // clear the location cache if you cancel the address or input an invalid address
      if (result) window.alert("No Location Data Available");
      clearCache("/weatherkittycache/location");
    }
    WeatherKitty();
  });
}

export async function SetLocationAddress(address) {
  let result = await getWeatherLocationByAddressAsync(address);
  if (result && result.ok) {
    // Override the location cache, and make it permanent.
    await setCache("/weatherkittycache/location", result, config.FOREVER);
  } else {
    // clear the location cache if you cancel the address or input an invalid address
    if (result) window.alert("No Location Data Available");
    clearCache("/weatherkittycache/location");
  }
  WeatherKitty();
}

// Function WeatherKittyLoading ... loading indicator
// WeatherKittyLoading(set value);
// WeatherKittyLoading(); // returns true if loading
let loadingTimer = 0;
let lastTimer = 0;
export async function WeatherKittyIsLoading(isLoading, message, verbose) {
  if (isLoading === null || isLoading === undefined) {
    let result = config.WeatherKittyIsLoading || !config.WeatherKittyIsLoaded;
    return result;
  }

  if (config.isLoadingIsVerbose) verbose = true;
  if (isLoading != config.WeatherKittyIsLoading) {
    if (isLoading) {
      loadingTimer = Date.now();
      lastTimer = loadingTimer;
    }
  }
  if (message) {
    message = message.trim();
  }

  if (
    verbose ||
    Log.Trace() ||
    (Log.Warn() && isLoading != config.WeatherKittyIsLoading)
  )
    console.log(
      "[WeatherKittyLoading]",
      isLoading
        ? message + ` [${wkElapsedTime(lastTimer)}]`
        : `Loaded [${wkElapsedTime(lastTimer)}] [${wkElapsedTime(
            loadingTimer
          )}]`
    );

  if (message && message.length > 8) message = message.substring(0, 8);
  if (isLoading) {
    config.WeatherKittyIsLoading = true;
    let widgets = document.getElementsByTagName("weather-kitty-geoaddress");
    for (let widget of widgets) {
      let span = widget.getElementsByTagName("span")[0];
      if (span) span.style.display = "none";
      let label = widget.getElementsByTagName("label")[0];
      if (label) {
        if (message) label.innerHTML = `Loading ${message} ... &nbsp; `;
        else label.innerHTML = "Loading ... &nbsp; ";
        label.style.display = "block";
      }
    }
  } else {
    config.WeatherKittyIsLoading = false;
    let widgets = document.getElementsByTagName("weather-kitty-geoaddress");
    for (let widget of widgets) {
      let span = widget.getElementsByTagName("span")[0];
      if (span) span.style.display = "block";
      let label = widget.getElementsByTagName("label")[0];
      if (label) {
        label.style.display = "none";
      }
    }
  }
  if (Log.Debug())
    console.log(
      `[WeatherKittyLoading]  [${wkElapsedTime(lastTimer)}]`,
      isLoading
    );
  lastTimer = Date.now();
  await microSleep(1);
  return config.WeatherKittyIsLoading;
}

export async function WeatherKittyIsLoaded() {
  while (await WeatherKittyIsLoading()) {
    await microSleep(100);
  }
  return;
}

export function WeatherKittyPause(value) {
  config.PAUSE = value;
}

// Function WeatherMaps
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
      if (Log.Debug()) console.log("[WeatherMaps] Adding Event Listener", img);
      img.removeEventListener("click", AIshowFullscreenImage);
      img.addEventListener("click", AIshowFullscreenImage);
    }
  } else {
    console.log("[WeatherMaps] *** ERROR ***: No Map Data Available");
  }
}

// Function getWeatherLocationAsync
// City, State, Country, ZipCode, Latitude, Longitude
export async function getWeatherLocationAsync() {
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
async function getWeatherLocationByIPAsync() {
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
async function getWeatherLocationByAddressAsync(address) {
  let error = new Response("Address Error", { status: 400, ok: false });
  if (!address)
    address = prompt(
      '"GHCND Station",   "Latitude, Longitude",    "Address, City, State"   or   "Address, ZipCode"'
    );

  if (address === null || address === "") {
    if (Log.Info()) console.log("[getAddress] No Address Provided.");
    return null;
  }
  if (Log.Debug()) console.log(`[getAddress] "${address}"`);

  let array = address.split(",");
  let street = "";
  let city = "";
  let state = "";
  let zip = "";

  switch (array.length) {
    case 1: {
      // GHCND Station
      let name = array[0].trim();
      let length = name.length;
      if (length != 11) {
        if (Log.Error())
          console.log("[getAddress] Error: Invalid GHCND Station");
        return error;
      }
      //
      let result = await HistoryGetStation(name, null, null);
      return CreateResponse(result);
      break;
    }
    case 2:
      let latitude = parseFloat(array[0].trim());
      let longitude = parseFloat(array[1].trim());
      if (!isNaN(latitude) && !isNaN(longitude)) {
        let result = { latitude: latitude, longitude: longitude };
        if (Log.Info()) console.log("[getAddress] Results:", result);
        return CreateResponse(result);
      }
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
      return error;
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
      if (Log.Warn()) console.log("[getAddress] WARNING: No Address Matches");
      return error;
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

// Function CreateResponse
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

// Function getWeatherAsync ----------------------------------------------
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

  await WeatherKittyIsLoading(true, "Location");
  let locData = await getWeatherLocationAsync();
  let lat = locData?.latitude;
  let lon = locData?.longitude;
  if (lat && lon) {
    if (Log.Info()) console.log(`[getWeatherAsync] Location: ${lat}, ${lon}`);
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
  await WeatherKittyIsLoading(true, "Point Data");
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
    await WeatherKittyIsLoading(true, "Obs Station ID");
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
    await WeatherKittyIsLoading(true, "Obs Data");
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
    await WeatherKittyIsLoading(true, "Forecast Data");
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
// /Function getWeatherAsync ----------------------------------------------
0;

// Function ForecastMatrix
async function ForecastMatrix(data) {
  if (!data || data.length <= 0) {
    if (Log.Error())
      console.log("[ForecastMatrix] *** ERROR ***: No Data Available");
    return;
  }
  if (Log.Debug()) console.log("[ForecastMatrix] ", data);
  let text = "";
  for (let period of data) {
    text += `
      <weather-kitty-week-card>
        <weather-kitty-week-title>${period.name}</weather-kitty-week-title>
        <img src=${period.icon} alt="Weather Image"><br>
        <weather-kitty-week-summary>
          <span>
            ${
              period.temperature
            }<small>${period.temperatureUnit.toLowerCase()}</small> 
          </span>
          <span> - </span> 
          <span>
            ${(period.probabilityOfPrecipitation.value ??= 0)}<small>${period.probabilityOfPrecipitation.unitCode.replace(
      "wmoUnit:percent",
      "%"
    )}</small></span>
        </weather-kitty-week-summary>
        <weather-kitty-week-forecast> ${BadHyphen(
          period.shortForecast
        )} </weather-kitty-week-forecast>
      </weather-kitty-week-card>`;
  }
  let targets = document.getElementsByTagName("weather-kitty-week");
  if (Log.Debug()) console.log("Weather Matrix: ", targets);
  for (let target of targets) {
    if (Log.Trace()) console.log("Matrix Targets: ", target);
    if (target != null) target.innerHTML = text;
  }
  if (!targets || targets.length <= 0)
    if (Log.Debug()) console.log("[ForecastMatrix] Matrix Not Found");
}

// Function ObservationCharts
async function GetObservationChartData(data) {
  if (Log.Trace()) console.log("[Obs Chart Data] ", data);

  let obsArray = ["timestamp"];

  if (data !== null && data !== undefined && data.length > 0) {
    let keys = Object.keys(data[0].properties);
    for (let key of keys) {
      if (key == "__proto__")
        throw new Error(
          "[ObservationCharts] *** ERROR *** : __proto__ is not a safe type"
        );
      if (key == "timestamp") continue;
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

  // refactored into data/timestamp pairs: map.get(key).data.unitCode, data.timestamps[], data.values[], data.values[].value, data.values[].unitCode
  // such that current obs and historical obs are the same format and can be charted by the same functions/together
  let chartData = new Map();
  for (let i = 0; i < obsArray.length; i++) {
    chartData.set(obsArray[i], { unitcode: "", timestamps: [], values: [] });
  }

  // is there data to process?
  if (data.length > 0) {
    for (let observation of obsArray) {
      if (Log.Debug())
        console.log(
          "[Obs Chart Data Collect] ",
          observation,
          " : ",
          data[0].properties[observation]
        );

      for (let i = 0; i < data.length; i++) {
        let item = data[i]?.properties[observation];
        let timestamp = data[0]?.properties["timestamp"];
        if (item == null || item == "") {
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

          chartData
            .get(observation)
            .values.push(data[i].properties[observation]);
        }
      }
    }
    if (Log.Info()) {
      let message = "[Observations] ";
      for (let key of obsArray) {
        let unitCode = data[0].properties[key].unitCode;
        if (unitCode !== null && unitCode !== undefined)
          unitCode = unitCode.replace("wmoUnit:", "");
        message += ` ${key}`;
        if (Log.Debug()) message += `:${unitCode}`;
        message += `, `;
      }
      console.log(message);
    }
  } else {
    if (Log.Error()) console.log("[ObservationCharts] *** ERROR ***: No Data");
  }

  // reformat the data into the new format
  // refactor into data/timestamp pairs: map.get(key).data.unitCode, data.timestamps[], data.values[],
  // aka add timestamps to each observation type
  for (let observation of obsArray) {
    if (observation == "timestamp") continue;
    chartData.get(observation).unitCode =
      data[0].properties[observation].unitCode;
    chartData.get(observation).timestamps = chartData.get("timestamp").values;
  }
  chartData.delete("timestamp");

  if (Log.Trace()) console.log("[Observations] ", chartData);
  return chartData;
  // containers
}

// Function Process Chart Elements
export async function WeatherCharts(chartData) {
  if (Log.Trace()) console.log("[WeatherCharts] ", chartData);
  if (chartData == null) {
    if (Log.Warn())
      console.log("[WeatherCharts] *** WARNING ***: No Chart Data Available");
    return;
  }
  await WeatherKittyIsLoading(true, "Charts");
  let types = [];
  for (let value of chartData.keys()) {
    types.push(value);
  }

  let containerArray = document.getElementsByTagName("weather-kitty-chart");
  for (let container of containerArray) {
    await microSleep(1);
    let chartType = container.getAttribute("type");
    if (chartType === null || chartType === undefined) {
      if (Log.Error())
        console.log("[ProcessCharts] *** ERROR ***: Chart Type Not Defined");
      if (Log.Debug()) console.log(container);
      return;
    }
    await WeatherKittyIsLoading(true, chartType.toLowerCase() + " Chart");
    if (types.includes(chartType) === false) {
      container.style.display = "none";
      if (Log.Warn())
        console.log(
          `[ProcessCharts] Warning: Chart Type [${chartType}] Not Found`
        );
      if (Log.Trace()) {
        console.log(container);
        console.log(chartData.keys());
      }
      continue;
    } else {
      container.style.display = "block";
      if (Log.Debug()) console.log(`[ProcessCharts] Chart Type: ${chartType}`);
    }
    let chart = chartData.get(chartType);
    if (Log.Trace()) console.log("[WeatherCharts] ", chart);
    CreateChart(
      container,
      chartType,
      chart.values,
      chart.timestamps,
      null,
      chart.history
    );
  }
  if (Log.Debug()) console.log("[WeatherCharts] Complete");
}

// Function CreateChart
export async function CreateChart( // cjm optimize this
  chartContainer,
  key, // Key value and Title of Chart
  values,
  timestamps,
  aspect, // aspect ratio, 0 or null for auto
  history // history = true for history charts and history date format
) {
  if (values == null || values.length == 0 || values[0].value === undefined) {
    if (Log.Error())
      console.log(
        `[CreateChart] *** ERROR *** Barp! on ${key}.  values are empty`
      );
    if (Log.Trace()) {
      console.log(chartContainer);
      console.log(key);
      console.log(values);
      console.log(timestamps);
    }
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

  if (Log.Debug()) {
    let length = values.length;
    let last = length - 1;
    console.log(`[CreateChart] ${key}, [${length}]}`);
    if (Log.Trace()) {
      console.log(`[CreateChart] ${timestamps[0]}, ${values[0].value}`);
      console.log(`[CreateChart] ${timestamps[last]}, ${values[last].value}`);
    }
    if (Log.Verbose()) console.log(`[CreateChart] ${values}`);
  }

  let data = [];
  let time = [];
  await microSleep(1);
  // cjm optimize this, maybe on-read
  for (let i = 0; i < values.length; i++) {
    data.push(values[i].value);
    let date = new Date(timestamps[i]);
    let label;
    if (Log.Trace()) console.log(`[CreateChart] History: ${history}`);
    if (history) {
      label = date.toLocaleString(undefined, config.historyFormat);
      label = label.replace(/ AM/, "a").replace(/ PM/, "p").replace(/\//g, "-");
    } else {
      label = date.toLocaleString(undefined, config.timeFormat);
      label = label.replace(/ AM/, "a").replace(/ PM/, "p").replace(/\//g, "-");
    }
    time.push(label);
  }
  await microSleep(1);
  // cjm optimize this.  This is about (1 second / 20%) cpu per chart. maybe on-read or use a flag and for-loop reverse-for-loop
  if (!history) {
    // Oldest to Newest
    data = data.reverse();
    time = time.reverse();
  }

  //  6em high labels
  await microSleep(1); // sleep(); // give the container time to grow/shrink
  let oneEm = getComputedStyle(chartContainer).fontSize.replace("px", "");
  let width = getComputedStyle(chartContainer).width.replace("px", "");
  let height = getComputedStyle(chartContainer).height.replace("px", "");
  if (height < oneEm * 18) height = oneEm * 18;
  let chartAspect = (width - oneEm) / height;
  if (chartAspect < 1) chartAspect = 1;
  if (chartAspect > 2.5) chartAspect = 2.5;
  if (aspect != null && aspect != 0) chartAspect = aspect;
  if (isNaN(chartAspect)) chartAspect = 2;

  if (Log.Debug())
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
    if (Log.Debug())
      console.log(
        `[CreateChart New] Type: ${key},   Canvas: ${canvas},   Chart: ${chart}`
      );
    let labelName = `${key} - ${values[0].unitCode}`;
    labelName = labelName.replace("wmoUnit:", "");
    await microSleep(1);
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
    await microSleep(1);
    newChart.update();
  } else {
    if (Log.Debug())
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
// an imageurl of "/null" will not change the image
async function WeatherSquares(
  elementId,
  replacementText,
  replacementImgUrl,
  alternateImgUrl
) {
  if (Log.Debug()) console.log(`[WeatherSquares] ${elementId}`);
  let elements = document.getElementsByTagName(elementId);
  if (elements == undefined || elements == null || elements.length === 0) {
    if (Log.Debug())
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

    if (Log.Verbose())
      console.log(`[WeatherWidget] Text: ${textDiv.innerHTML}`);
    textDiv.innerHTML = replacementText;
    if (Log.Trace())
      console.log(`[WeatherWidget] Text => ${textDiv.innerHTML}`);

    // Icon

    if (Log.Trace()) console.log(`[WeatherWidget] Icon: ${weatherImg.src}`);
    if (replacementImgUrl != null && replacementImgUrl !== "") {
      if (replacementImgUrl.toLowerCase().includes("/null") === false)
        weatherImg.src = replacementImgUrl;
    } else {
      if (alternateImgUrl != null && alternateImgUrl !== "") {
        if (alternateImgUrl.toLowerCase().includes("/null") === false)
          weatherImg.src = alternateImgUrl;
      } else
        weatherImg.src = `url(config.WeatherKittyPath + "img/WeatherKittyE8.png")`;
    }
    if (Log.Debug()) console.log(`[WeatherWidget] Icon => ${weatherImg.src}`);
  }
}

// Function WeatherTemperatureFahrenheit
// .replace(/wmoUnit\:deg/i, "")
export function Fahrenheit(temperature, temperatureUnit) {
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

  if (Log.Verbose())
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
  let seconds = (elapsed / 1000).toFixed(2);
  let minutes = (seconds / 60).toFixed(2);
  let hours = (minutes / 60).toFixed(2);

  seconds = seconds % 60;
  minutes = minutes % 60;

  if (Log.Verbose()) {
    console.log("Start: ", startTime);
    console.log("End: ", endTime);
    console.log("Elapsed: ", elapsed);
  }

  if (hours > 1) return `${hours}h`;
  if (minutes > 1) return `${minutes}m`;
  if (seconds > 1) return `${seconds}s`;

  return `${elapsed}ms`;
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
  if (Log.Debug())
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
  if (Log.Debug())
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
    if (Log.Verbose())
      console.log("[FindAndReplaceTags] innerHTML: ", htmlString);
    if (
      htmlString != undefined &&
      htmlString != null &&
      htmlString != "" &&
      htmlString.includes("<")
    ) {
      if (Log.Trace()) console.log("[FindAndReplaceTags] Custom HTML Detected");
    } else {
      if (Log.Trace())
        console.log("[FindAndReplaceTags] Using Default CodeBlock");
      if (Log.Verbose()) console.log(htmlBlock);
      widget.innerHTML = htmlBlock; // set the outer so we can include any classes or tags.
      if (className !== null && className !== undefined && className !== "")
        widget.className = className;
    }
  }
  return widgets;
}

// Function InjectWeatherKittyStyles
function InjectWeatherKittyStyles(path) {
  let file = path + "WeatherKitty.css";
  if (Log.Debug()) console.log("[InjectWeatherKittyStyles] ", file);

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

// ------------------------------------------------------------------
// Gemini AI, and then edited a fair bit.  It was a bit of a mess at first.
async function AIshowFullscreenImage(imageElement) {
  if (Log.Debug()) console.log("Showing fullscreen image");
  // Zoom Settings
  let zoom = "100%";
  let zoomInit = "200%";
  let zoomMaxInt = 8;

  // Create a new image element for the popup
  let flag = 0;
  const popupImage = new Image();
  popupImage.src = imageElement.srcElement.currentSrc;

  // Create a popup container element
  const popupContainer = document.createElement("div");
  popupContainer.classList.add("fullscreen-image-container");
  popupContainer.appendChild(popupImage);

  // Add event listeners for pan and zoom
  popupImage.addEventListener("mousedown", handleMouseDown);
  popupImage.addEventListener("mousemove", handleMouseMove);
  popupImage.addEventListener("mouseup", handleMouseUp);
  popupImage.addEventListener("wheel", handleWheel);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.keyCode === 27) {
      if (flag++) return; // Prevents double+ close, but not entirely.
      if (Log.Debug()) console.log("Escape: Closing fullscreen image");
      closeFullscreenImage();
      return;
    }
  });

  // Add the popup container to the document body
  document.body.appendChild(popupContainer);

  // Set the popup container's style to cover the entire screen
  popupContainer.style.position = "fixed";
  popupContainer.style.top = "0";
  popupContainer.style.left = "0";
  popupContainer.style.width = zoom;
  popupContainer.style.height = zoom;
  popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)"; // Optional: Add a semi-transparent background
  popupContainer.style.display = "flex";
  popupContainer.style.justifyContent = "center";
  popupContainer.style.alignItems = "center";
  popupContainer.style.zIndex = "10";

  // Set the popup image's style to fit the container
  popupImage.style.maxWidth = zoomInit;
  popupImage.style.maxHeight = zoomInit;

  // Track panning and zooming variables
  let isPanning = false;
  let panX = 0;
  let panY = 0;
  let newPanX = 0;
  let newPanY = 0;
  let zoomLevel = 1;

  function handleMouseDown(event) {
    if (event.detail >= 2) {
      if (Log.Debug()) console.log("Double Click: Closing fullscreen image");
      closeFullscreenImage();
      return;
    }
    isPanning = true;
    // panX = event.clientX + popupImage.offsetLeft;
    panX = event.clientX - newPanX;
    // panY = event.clientY + popupImage.offsetTop;
    panY = event.clientY - newPanY;
    if (Log.Trace()) console.log("Mouse Down: ", panX, panY);
  }

  function handleMouseMove(event) {
    if (isPanning) {
      newPanX = event.clientX - panX;
      newPanY = event.clientY - panY;
      popupImage.style.transform = `translate(${newPanX}px, ${newPanY}px) scale(${zoomLevel})`;
      if (Log.Verbose()) console.log("Mouse Move: ", newPanX, newPanY);
    }
  }

  function handleMouseUp() {
    isPanning = false;
    let panX = popupImage.offsetLeft;
    let panY = popupImage.offsetTop;
    if (Log.Trace()) console.log("Mouse Up: ", panX, panY);
  }

  function handleWheel(event) {
    event.preventDefault();
    const delta = event.deltaY / 1000;
    zoomLevel += delta;
    zoomLevel = Math.max(0.25, Math.min(zoomMaxInt, zoomLevel));
    popupImage.style.transform = `translate(${newPanX}px, ${newPanY}px) scale(${zoomLevel})`;
  }

  // Handle closing the popup (e.g., clicking outside the image)
  popupContainer.addEventListener("click", (event) => {
    if (event.target !== popupImage) {
      if (Log.Debug()) console.log("Click Outside: Closing fullscreen image");
      closeFullscreenImage();
    }
  });

  function closeFullscreenImage() {
    if (document.body.contains(popupContainer))
      document.body.removeChild(popupContainer);
  }
}
// /Gemini AI
// ------------------------------------------------------------------

// Cache Caching ------------------------------------------
// Function fetchCache(url, options, ttl)
// ... and special functions
const specialUrlTable = {
  "/weatherkittycache/location": getLocationAsync,
  "/weatherkittycache/geoip": getWeatherLocationByIPAsync,
  "/weatherkittycache/address": getWeatherLocationByAddressAsync,
};

export async function clearCache(url, verbose) {
  if (Log.Debug() || verbose) console.log(`[clearCache] ${url}`);
  let cache = await caches.open("weather-kitty");
  await cache.delete(url);
}

export async function setCache(url, response, ttl, verbose) {
  if (Log.Debug() || verbose) console.log(`[setCache]`, url, response, ttl);
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  ttlCache[url] = Date.now() + ttl;
  localStorage.setItem("ttlCache", JSON.stringify(ttlCache));

  let cache = await caches.open("weather-kitty");
  await cache.put(url, response);
}

export async function fetchCache(url, options, ttl, verbose) {
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
    if (Log.Info() || verbose)
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
    if (Log.Info() || verbose)
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

async function corsCache(url, options, ttl, verbose) {
  let corsUrl = `${config.CORSProxy}${url}`;
  return fetchCache(corsUrl, options, ttl, verbose);
}
// /Cache Caching -----------------------------------
0;

// GetHistoryChartData ------------------------------------------------
// ---
async function HistoryGetChartData(station, latitude, longitude) {
  let location;
  if (station) location = await HistoryGetStation(station);
  if (location?.latitude && location?.longitude) {
    if (Log.Trace()) console.log(`[GetHistoryChartData] Location: Ok`);
  } else if (latitude && longitude) {
    location = { latitude: latitude, longitude: longitude };
  } else {
    location = await getWeatherLocationAsync();
  }
  if (location && location.latitude && location.longitude) {
    if (Log.Debug()) console.log(`[GetHistoryChartData] Location: Ok`);
  } else {
    if (Log.Error())
      console.log("[GetHistoryChartData] *** ERROR *** : Location Error ");
    return;
  }

  station = await HistoryGetStation(
    null,
    location.latitude,
    location.longitude
  );
  if (station?.id && station?.id.length == 11) {
    if (Log.Debug()) console.log(`[GetHistoryChartData] Station: Ok`);
  } else {
    if (Log.Error())
      console.log(
        `[GetHistoryChartData] *** ERROR *** : Station Error [${station.id}]`
      );
    return;
  }

  let fileData;
  await WeatherKittyIsLoading(true, "History Csv");
  fileData = await HistoryGetCsvFile(station.id);
  if (fileData && fileData?.length > 0) {
    if (Log.Debug()) console.log(`[GetHistoryChartData] fileDataCheck: Ok`);
    // ...
  } else {
    if (Log.Error())
      console.log(
        `[GetHistoryChartData] *** ERROR *** : File Data Error [${station.id}]`
      );
    return;
  }

  // ... what's next ???
  // ... Process the File Data into Data Sets
  // Id, YYYYMMDD, Type, Value, Measurement-Flag, Quality-Flag, Source-Flag, OBS-TIME
  // USW00014739,19360101,TMAX, 17,,,0,2400
  await WeatherKittyIsLoading(true, "Csv Data");
  let dataSets = {};
  let lineCount = 0;
  for (let line of fileData) {
    lineCount++;
    let properties = line.split(",");
    let [id, date, type, val, mFlag, qFlag, sFlag, obsTime] = properties;
    if (type == "__proto__")
      throw new Error(
        `[GetHistoryChartData] *** CRITICAL *** : __proto__ is not a safe type [${station.id}]`
      );
    if (id != null && id.length > 0) {
      if (dataSets[type] == null) {
        if (Log.Trace()) console.log(`Adding Type: ${type}`);
        dataSets[type] = {};
        dataSets[type].history = true; // weather history data
        dataSets[type].timestamps = [];
        dataSets[type].values = [];
      }

      if (date != null) {
        let fDate =
          date.substring(0, 4) +
          "-" +
          date.substring(4, 6) +
          "-" +
          date.substring(6, 8);
        date = fDate;
        if (obsTime != null && obsTime.length > 0) {
          let time =
            obsTime.substring(0, 2) + ":" + obsTime.substring(2, 4) + ":00";
          date += "T" + time;
        } else {
          date += "T24:00:00";
        }
        dataSets[type].timestamps.push(date);
        dataSets[type].values.push(val);
      } else {
        if (Log.Error())
          console.log(
            `[GetHistoryChartData] *** ERROR *** : date is null, Line: [${line}] [${station.id}]`
          );
      }
    } else if (lineCount === fileData.length) {
      if (Log.Debug()) console.log("EOL");
    } else {
      if (Log.Error()) {
        console.log(`[GetHistoryChartData] id is null: [${line}]`);
        console.log(`lineCount: ${lineCount} of ${fileData.length}`);
      }
    }
  }

  await WeatherKittyIsLoading(true, "Trimming");
  await microSleep(1);
  for (let key in dataSets) {
    if (dataSets[key].timestamps.length > config.HistoryDataMaxLimit) {
      dataSets[key].timestamps = dataSets[key].timestamps.slice(
        dataSets[key].timestamps.length - config.HistoryDataMaxLimit
      );
      dataSets[key].values = dataSets[key].values.slice(
        dataSets[key].values.length - config.HistoryDataMaxLimit
      );
    }
  }

  await WeatherKittyIsLoading(true, "Reformatting");
  await microSleep(1);
  dataSets = await HistoryReformatDataSets(dataSets);
  if (Log.Info()) {
    let keys = [];
    for (let key of dataSets.keys()) keys.push(key);
    console.log(`[History] [${station.id}] ${keys.join(", ")}`);
  }
  if (Log.Trace()) console.log("[GetHistoryChartData] ", dataSets);
  return dataSets;
}

// Reformat, Convert, and Create Aliases for Data Sets
async function HistoryReformatDataSets(dataSets) {
  let mapSets = new Map();
  for (let key in dataSets) {
    let dataSet = dataSets[key];
    for (let i = 0; i < dataSet.values.length; i++) {
      let item = await HistoryConvertUnits(dataSet.values[i], key);
      dataSet.values[i] = item;
    }
    mapSets.set(key, dataSet);
  }

  // Create Aliases
  // Create an Alias "TEMP" that used TOBS, TAVG, or an Average of TMAX and TMIN, in that order
  if (!mapSets.has("TAVG") && mapSets.has("TMAX") && mapSets.has("TMIN")) {
    let tMax = mapSets.get("TMAX").values;
    let tMin = mapSets.get("TMIN").values;
    let temp = mapSets.get("TMAX").values;
    for (let i = 0; i < tMax.length; i++) {
      let avg = (tMax[i].value + tMin[i].value) / 2;
      temp[i].value = avg;
    }
    mapSets.set("TAVG", temp);
  }

  if (mapSets.has("TOBS")) {
    mapSets.set("TEMP", mapSets.get("TOBS"));
  } else if (mapSets.has("TAVG")) {
    mapSets.set("TEMP", mapSets.get("TAVG"));
  }

  // WT**, WV** - Weather Types

  return mapSets;
}

async function HistoryConvertUnits(data, key) {
  data = { value: data, unitCode: key };
  if (HistoryDataConversion[key] != null) {
    data = await HistoryDataConversion[key](data);
  }
  return data;
}

let HistoryDataConversion = {
  TempHistory: function (data) {
    let value = parseFloat(data.value) / 10.0;
    if (!isNaN(value)) value = Fahrenheit(value, "c");
    let item = { value: value, unitCode: "°F" };
    return item;
  },
  TOBS: function (data) {
    return HistoryDataConversion.TempHistory(data);
  },
  TMAX: function (data) {
    return HistoryDataConversion.TempHistory(data);
  },
  TMIN: function (data) {
    return HistoryDataConversion.TempHistory(data);
  },
  TAVG: function (data) {
    return HistoryDataConversion.TempHistory(data);
  },
};

// ---

// Function HistoricalGetStation
async function HistoryGetStation(station, latitude, longitude) {
  if (Log.Debug())
    console.log(
      `[HistoricalGetStation] Entry: ${station} - ${latitude}, ${longitude}`
    );
  if (station == null && (latitude == null || longitude == null)) {
    let location = await getWeatherLocationAsync();
    if (location && location?.latitude && location?.longitude) {
      latitude = location.latitude;
      longitude = location.longitude;
      if (Log.Debug()) console.log("[HistoricalGetStation] ", location);
    } else {
      if (Log.Error())
        console.log(
          "[HistoricalGetStation] *** ERROR *** : Location Error ",
          location
        );
      return null;
    }
  }
  if (station == null && (latitude == null || longitude == null)) {
    if (Log.Error())
      console.log("[HistoricalGetStation] *** ERROR *** : Location Error ");
    return null;
  }

  // Get List of Stations ghcnd-stations.txt, cache it for a month?
  // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt
  // https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt
  await WeatherKittyIsLoading(true, "ghcnd stations");
  let response = await fetchCache(
    "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt",
    null,
    config.archiveCacheTime
  );

  let lines;
  if (response?.ok) {
    let result = await response.text();
    lines = result.split("\n");
    if (lines?.length <= 0 || lines[0].length <= 12) {
      if (Log.Error())
        console.log(
          `[HistoricalGetStation] *** ERROR*** : No Data,  ${response?.status}, ${response?.statusText}`
        );
      return null;
    }
    if (Log.Debug())
      console.log(
        `[HistoricalGetStation] lines: ${lines.length}, result: ${result.length}`
      );
    if (Log.Trace()) {
      let firstLines = lines.slice(0, 5);
      let lastLines = lines.slice(-5);
      console.log(firstLines, lastLines);
    }
  } else {
    if (Log.Error())
      console.log(
        `[HistoricalGetStation] *** ERROR*** : HTTP-Error,  ${response?.status}, ${response?.statusText}`
      );
  }

  let data = [];

  let result = {
    id: station,
    latitude: latitude,
    longitude: longitude,
    distance: Number.MAX_SAFE_INTEGER,
  };

  await WeatherKittyIsLoading(true, "station data");
  for (let line of lines) {
    let location = {};
    location.id = line.substring(0, 11).trim();
    location.lat = parseFloat(line.substring(12, 20).trim());
    location.lon = parseFloat(line.substring(21, 30).trim());
    location.elev = line.substring(31, 37).trim();
    location.state = line.substring(38, 40).trim();
    location.name = line.substring(41, 71).trim();
    location.gsn = line.substring(72, 75).trim();
    location.hcn = line.substring(76, 79).trim();
    location.wmo = line.substring(80, 85).trim();

    data.push(location);
    let distance = ManhattanDistance(
      latitude,
      longitude,
      location.lat,
      location.lon
    );

    let idString = "" + location.id;
    let stationString = "" + station;
    if (idString.toLowerCase() == stationString.toLowerCase()) {
      if (Log.Debug())
        console.log(
          `[HistoricalGetStation] ${location.id} - ${location.name}, ${
            location.state
          } - ${distance.toFixed(4)}`
        );
      result.id = location.id;
      result.distance = 0;
      result.latitude = location.lat;
      result.longitude = location.lon;
    } else if (distance < result.distance) {
      if (Log.Trace())
        console.log(
          `[HistoricalGetStation] ${location.id} - ${location.name}, ${
            location.state
          } - ${distance.toFixed(4)}`
        );
      result.id = location.id;
      result.distance = distance;
      result.latitude = location.lat;
      result.longitude = location.lon;
    }
  }

  if (Log.Info()) console.log(`[HistoricalGetStation] Result: `, result);
  if (Log.Trace()) console.log(nearestStation);
  return result;
}

// Function HistoricalGetCsvFile
async function HistoryGetCsvFile(stationId) {
  //https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt
  // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/
  // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz
  let idString = stationId.toLowerCase().substring(11 - 8);
  await WeatherKittyIsLoading(true, `FetchCSV ${idString}`);

  let url = `https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/${stationId}.csv.gz`;
  let response = await fetchCache(url, null, config.longCacheTime);
  let fileData;

  // let sleep = await new Promise((r) => setTimeout(r, 1000));
  if (Log.Trace()) console.log(response);
  let blob_compressed;
  let blob_uncompressed;
  let result = "";
  // get the blob from the response
  if (response.ok) {
    // un-gzip the blob

    let TotalSize = 0;
    let Chunks = [];
    let data_in;
    let data_out;
    blob_compressed = await response.blob();
    if (Log.Debug())
      console.log(`blob_compressed: ${blob_compressed.size}`, blob_compressed);

    let utfDecode;
    let dcmpStrm;
    try {
      Chunks = [];

      let stringData = "";
      utfDecode = new fflate.DecodeUTF8((data, final) => {
        stringData += data;
      });
      dcmpStrm = new fflate.Decompress((chunk, final) => {
        //   console.log(chunk);
        if (Log.Debug())
          console.log("chunk was encoded with GZIP, Zlib, or DEFLATE");
        utfDecode.push(chunk, final);
      });

      for await (const chunk of blob_compressed.stream()) {
        TotalSize += chunk.length;
        if (Log.Debug())
          console.log(`TotalSize[35]: ${chunk.length} += ${TotalSize}`);
        dcmpStrm.push(chunk);
      }

      if (Log.Debug()) {
        console.log(`TotalSize[38]: ${TotalSize}`);
        console.log(`stringData: ${stringData.length}`);
      }
      result = stringData;
    } catch (e) {
      console.log("*** ERROR *** - Decompression Error: " + e);
    } finally {
      if (Log.Info()) console.log("[HistoryDataGzip] Decompression Complete");
    }

    await WeatherKittyIsLoading(true, "history data");
    fileData = result.split("\n");
    if (!fileData || fileData.length <= 0) {
      if (Log.Error())
        console.log(
          "[HistoricalGetCsvFile] *** ERROR *** : fileData Error, No Data "
        );
      return null;
    } else if (Log.Debug()) console.log(`fileDataCheck: Ok `);
  } else {
    console.log("HTTP-Error: " + response.status);
  }
  if (Log.Trace()) {
    let firstLines = fileData.slice(0, 5);
    let lastLines = fileData.slice(-5);
    console.log(`result: ${result.length}, lines: ${fileData.length}`);
    console.log(firstLines, lastLines);
  }
  return fileData;
}
// ---
// / GetHistoryChartData ------------------------------------------------

// Math Functions ---------------------------------------------------------
// ---
function MathAverage(values) {
  if (!values || values.length <= 0) return null;
  let sum = 0.0;
  for (let value of values) {
    sum += parseInt(value);
  }
  let average = sum / values.length;
  return average;
}

function MathDistance(lat1, lon1, lat2, lon2) {
  let dy = lat2 - lat1;
  let dx = lon2 - lon1;
  let distance = Math.SQRT2(dy ** 2 + dx ** 2);
  return distance;
}

function ManhattanDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return NaN;
  let dy = lat2 - lat1;
  let dx = lon2 - lon1;
  let distance = Math.abs(dy) + Math.abs(dx);
  return distance;
}
// ---
// /Math Functions --------------------------------------------------------

// HTML Blocks -----------------------------------
// functions instead of variables, so that path updates to the images can take effect
function WeatherKittyCurrentBlock() {
  let results = `<weather-kitty-tooltip>
    <weather-kitty-geoaddress></weather-kitty-geoaddress>
    <p></p>
  </weather-kitty-tooltip>
  <img src="${config.WeatherKittyObsImage}" class="WeatherKittyImage"/>
  <span class="WeatherKittyText">Loading . . .</span>`;
  return results;
}

function WeatherKittyForecastBlock() {
  let results = `<weather-kitty-tooltip>
    <weather-kitty-geoaddress></weather-kitty-geoaddress>
    <p></p>
  </weather-kitty-tooltip>
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
        />`;

let WeatherKittyMapRadarBlock = `<img
            alt="NWS Radar"
          />`;

let WeatherKittyMapAlertsBlock = `          <img
            alt="US Weather Alerts Map"
          />`;

function WeatherKittyGeoAddressBlock() {
  let results = `<span>Place Holder</span>
  <label>Loading ... </label>
  <button>Set</button>`;
  return results;
}
// /Blocks -----------------------------------

// Run Weather Kitty
async function Main() {
  if (config.PAUSE) {
    if (Log.Warn()) console.log("[WeatherKittyStart] Warning: PAUSED");
    while (config.PAUSE) {
      await microSleep(100);
    }
  }
  WeatherKittyStart();
}
setTimeout(Main, 40);
