"use strict";

import "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";

// prettier-ignore
import {
  config,  WeatherKittyCurrentBlock, WeatherKittyForecastBlock, WeatherKittyWidgetBlock, WeatherKittyChartBlock, 
  WeatherKittyMapForecastBlock, WeatherKittyMapRadarBlock, WeatherKittyMapAlertsBlock, WeatherKittyMapLocalRadarBlock, 
  WeatherKittyGeoAddressBlock, WeatherKittyStatusBlock, WeatherKittySignalBlock,
} from "./src/config.mjs";
import { Log, LogLevel } from "./src/log.mjs";
// prettier-ignore
import { microSleep, sleep, TouchMoveAccelerated, DecompressCsvFile, wkElapsedTime, Fahrenheit, BadHyphen, GetPixels, 
  AddPixels, ManhattanDistance, isMobile } from "./src/functions.mjs";
// prettier-ignore
import { getCache, setCache, clearCache, corsCache, fetchCache, fetchTimeoutOption, ExpireData, PurgeData, } from "./src/fetchCache.mjs";
import { CheckApiStatus } from "./src/checkApiStatus.mjs";
// prettier-ignore
import { getWeatherAsync, GetObservationChartData, getNwsPointData, getNwsObservationStations, getNwsObservationData, 
  GetNwsForecastData, LegacyCombineWeatherData } from "./src/weather.mjs";
// prettier-ignore
import { getWeatherLocationAsync, getWeatherLocationByAddressAsync, SetLocationAddress, } from "./src/location.mjs";
// prettier-ignore
import {HistoryGetChartData, HistoryGetStation, HistoryGetStationList, HistorySearchStationList, HistoryGetState,
  HistoryGetCsvFile, HistoryParseCsvFile, } from "./src/history.mjs";
import { assert } from "./src/assert.mjs";

// prettier-ignore
export { config, Log, LogLevel, microSleep, sleep, getCache, CheckApiStatus, DecompressCsvFile, HistoryGetStation, 
  HistoryGetChartData, assert, corsCache, fetchCache, fetchTimeoutOption, getWeatherLocationByAddressAsync, wkElapsedTime, 
  ExpireData, PurgeData, SetLocationAddress, getWeatherLocationAsync, Fahrenheit, BadHyphen, OnWeatherKitty,  
  WeatherKittyGetAvailableChartTypes, WeatherKittyGetNearbyStations, WeatherKittyEnable,  HistoryGetStationList, 
  HistorySearchStationList, HistoryGetState, HistoryGetCsvFile, HistoryParseCsvFile, };

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

// Function Weather Kitty
async function WeatherKittyStart() {
  let PAUSE = config.ENABLE.widgets === false;
  WeatherKittyIsLoading("Startup", async () => {
    config.SanityChecks();
    if (config.WeatherKittyIsLoaded > 0) {
      if (Log.Error()) console.log("[WeatherKitty] *** ERROR *** : Already Loaded");
      throw new Error("Already Loaded");
      return;
    }
    config.WeatherKittyIsLoaded = 1;
    await microSleep(1); // Just long enough that you can set the log level before it starts.
    let path;
    let results;

    let scriptSrc = import.meta.url;
    let url = new URL(scriptSrc);
    path = url.pathname;
    const lastSlashIndex = path.lastIndexOf("/");
    if (lastSlashIndex >= 0) path = path.substring(0, lastSlashIndex + 1); // Include the trailing slash
    config.WeatherKittyPath = path;

    if (Log.Warn()) {
      console.log("[WeatherKittyStart] Loading From: ", path);
    }

    if (!path) path = "";

    config.WeatherKittyObsImage = path + config.WeatherKittyObsImage;
    config.WeatherKittyForeImage = path + config.WeatherKittyForeImage;

    await WeatherWidgetInit(path);

    if (!PAUSE) setTimeout(WeatherKitty, 40);

    setInterval(WeatherKitty, config.shortCacheTime);
    config.WeatherKittyIsLoaded = 2;

    if (Log.Warn() && PAUSE) {
      console.log("[WeatherKittyStart] *** DISABLED *** : Widgets Disabled");
      console.log("\tYou may need to unpause and load WeatherKitty() manually.");
    }
  });
}

// Function Weather Widget Initialization
async function WeatherWidgetInit(path) {
  if (config.WeatherKittyIsInit > 0) return;
  config.WeatherKittyIsInit = 1;

  if (Log.Debug()) console.log("[WeatherKittyInit] Initializing Weather Kitty");

  InjectWeatherKittyStyles(path);

  let geoAddressFound = false;
  let widgets;
  let result;

  // --- Order Matters --- ----------------------------------------------
  widgets = FindAndReplaceTags("weather-kitty", WeatherKittyWidgetBlock, "WeatherKitty"); // Order matters

  result = FindAndReplaceTags(
    "weather-kitty-current",
    WeatherKittyCurrentBlock(),
    "WeatherKittyBlock"
  );
  widgets = [...widgets, ...result];

  result = FindAndReplaceTags(
    "weather-kitty-status",
    WeatherKittyStatusBlock,
    "WeatherKittyStatus"
  );
  widgets = [...widgets, ...result];

  FindAndReplaceTags("wk-status-nws", WeatherKittySignalBlock, "wk-status-signal");
  FindAndReplaceTags("wk-status-aws", WeatherKittySignalBlock, "wk-status-signal");
  FindAndReplaceTags("wk-status-ncei", WeatherKittySignalBlock, "wk-status-signal");
  FindAndReplaceTags("wk-status-ncdc", WeatherKittySignalBlock, "wk-status-signal");

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
    "weather-kitty-radar-national",
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
    "weather-kitty-radar-local",
    WeatherKittyMapLocalRadarBlock,
    "WeatherKittyMapLocalRadar"
  );
  widgets = [...widgets, ...result];

  result = FindAndReplaceTags("weather-kitty-chart", WeatherKittyChartBlock, "WeatherKittyChart");
  widgets = [...widgets, ...result];

  AssignTouchMoveToCharts(result);

  if (widgets.length > 0) {
    if (!geoAddressFound) {
      if (Log.Debug()) console.log("[WeatherWidgetInit] Warning: No GeoAddress Element Found.");
      // SetAddLocationButton(widgets[0]);
      InsertGeoAddressElement(widgets[0]);
    }
    if (Log.Info()) console.log("[WeatherKittyInit] Initialized.");
    config.WeatherKittyIsInit = 2;
    return true;
  } else {
    if (Log.Debug()) console.log("[WeatherWidgetInit] Warning: Weather Kitty Elements Not Found");
    if (Log.Info()) console.log("[WeatherKittyInit] Initialized.");
    config.WeatherKittyIsInit = 2;
    return false;
  }
}

export async function WeatherKittyWaitOnInit() {
  while (config.WeatherKittyIsInit < 2) {
    await microSleep(100);
  }
  return;
}

// Function Weather Widget
export async function WeatherKitty() {
  WeatherKittyIsLoading("WeatherKitty", async () => {
    if (config.WeatherKittyIsLoaded < 2) return;
    config.WeatherWidgetIsLoaded = true;
    if (config.ENABLE.widgets === false) {
      if (Log.Warn()) console.log("[WeatherKitty] *** DISABLED *** : Widgets Disabled");
      return;
    }

    // fetchCache the Maps.  Putting it here lets it run async with the getweatherasync
    WeatherMaps("weather-kitty-map-forecast", config.ForecastMapUrl, config.ForecastMapCacheTime);
    WeatherMaps("weather-kitty-radar-national", config.RadarMapUrl, config.RadarMapCacheTime);
    WeatherMaps("weather-kitty-map-alerts", config.AlertsMapUrl, config.AlertsMapCacheTime);

    // DATA --------------------------------------------------------------
    // Get/Update the Weather Data
    let LoadWeather = await WeatherKittyGetWeatherTypes();
    let ChartTypes = await WeatherKittyGetChartTypes(); // Move from below so we can apply this
    let LoadWeatherCharts = ChartTypes?.Weather?.length > 0;
    let weather;
    // prettier-ignore
    if (config.ENABLE.weather === false) { if (Log.Info()) console.log("[WeatherKitty] *** DISABLED*** : Weather Disabled"); }
    if ((LoadWeather || LoadWeatherCharts) && config.ENABLE.weather) {
      let locData = await WeatherKittyIsLoading("Location Data", () => {
        return getWeatherLocationAsync();
      });
      let pointData = await WeatherKittyIsLoading("Point Data", () => {
        return getNwsPointData(locData);
      });
      let observationStations = await WeatherKittyIsLoading("Obs Stations", () => {
        return getNwsObservationStations(pointData);
      });
      let observationData = await WeatherKittyIsLoading("Obs Data", () => {
        return getNwsObservationData(observationStations);
      });
      let forecastData = await WeatherKittyIsLoading("Forecast Data", () => {
        return GetNwsForecastData(pointData);
      });
      weather = await WeatherKittyIsLoading("Legacy Data", () => {
        return LegacyCombineWeatherData(
          pointData,
          observationStations,
          observationData,
          forecastData
        );
      });
    }

    // Insert Local Radar here.
    // https://radar.weather.gov/ridge/standard/KMRX_loop.gif
    let localRadar = weather?.radarStation;
    if (localRadar) {
      let url = `https://radar.weather.gov/ridge/standard/${localRadar}_loop.gif`;
      WeatherMaps("weather-kitty-radar-local", url, config.shortCacheTime - 60000);
    }
    // /Local Radar

    let historyStation = null;
    // prettier-ignore
    if (config.ENABLE.history === false) { if (Log.Info()) console.log("[WeatherKitty] *** DISABLED *** : History Disabled"); }
    if (ChartTypes.History.length > 0 && config.ENABLE.history) {
      let location = await getWeatherLocationAsync();
      if (location && location?.latitude && location?.longitude) {
        let latitude = location.latitude;
        let longitude = location.longitude;
        let list = await WeatherKittyIsLoading("Get Station List", () => {
          return HistoryGetStationList();
        });
        historyStation = await WeatherKittyIsLoading("Search Station List", () => {
          return HistorySearchStationList(list, latitude, longitude);
        });
        // historyStation = await HistoryGetStation(null, latitude, longitude);
      }
    }

    if (
      (LoadWeather || LoadWeatherCharts) &&
      (!weather?.observationData || !weather?.forecastData)
    ) {
      if (Log.Info()) console.log("[WeatherKitty] No Weather Data Available");
      // return;  // we can't return here, it breaks the locks and other things.
    }

    // Observation Text
    if (weather?.observationData) {
      let shortText = weather.observationData.features[0].properties.textDescription;
      let temp = weather.observationData.features[0].properties.temperature.value;
      let unit = weather.observationData.features[0].properties.temperature.unitCode;
      temp = Fahrenheit(temp, unit);
      let img = weather.observationData.features[0].properties.icon;
      let altimg = config.WeatherKittyObsImage;
      let precip = weather?.forecastData?.properties.periods[0].probabilityOfPrecipitation.value;
      if (!shortText && Log.Warn()) console.log("[WeatherKitty] Warning: Null shortText");
      if (!img && Log.Warn()) console.log("[WeatherKitty] Warning: Null Icon");

      // debug
      // shortText = "Debugging Clear Cloudy Thunder-Storms Overflow Bottom";
      // temp = 109;
      // precip = 100;

      let text = `${shortText}<br>`;
      if (temp !== null && temp !== undefined && !isNaN(temp)) text += ` ${temp}°`; // degrees °f
      if (precip !== null && precip !== undefined && !isNaN(precip) && parseInt(precip) > 0)
        text += ` - ${precip}%`; // There just isn't room for an ellipse or symbol if the deg/precip is 100% &hellip;

      WeatherSquares("weather-kitty-current", text, img, altimg);
    }

    // Forecast Text
    if (weather?.forecastData) {
      let shortText = weather.forecastData.properties.periods[0].shortForecast;
      let temp = weather.forecastData.properties.periods[0].temperature;
      let unit = weather.forecastData.properties.periods[0].temperatureUnit;
      temp = Fahrenheit(temp, unit);
      let img = weather.forecastData.properties.periods[0].icon;
      let altimg = config.WeatherKittyForeImage;
      let precip = weather.forecastData.properties.periods[0].probabilityOfPrecipitation.value;
      if (!shortText && Log.Warn()) console.log("[WeatherKitty] Warning: Null shortText");
      if (!img && Log.Warn()) console.log("[WeatherKitty] Warning: Null Icon");

      // debug
      // shortText = "Debugging Clear Cloudy Thunder-Storms Overflow Bottom";
      // temp = 109;
      // precip = 100;

      let text = `${shortText}<br>`;
      if (temp !== null && temp !== undefined && !isNaN(temp)) text += ` ${temp}°`; // degrees °f
      if (precip !== null && precip !== undefined && !isNaN(precip) && parseInt(precip) > 0)
        text += ` - ${precip}%`;

      WeatherSquares("weather-kitty-forecast", text, img, altimg);
    }

    let locationName = null;
    {
      let response = (await getCache("/weatherkittycache/location"))?.response;
      let cachedLocation = await response?.json();
      if (response && response.ok) {
      } else console.log("[WeatherKitty] No Cached Location", cachedLocation);

      if (cachedLocation?.name) locationName = cachedLocation.name;
      if (cachedLocation?.city) locationName = cachedLocation.city;
      else if (historyStation?.name) locationName = historyStation.name;

      if (cachedLocation?.state) locationName += ", " + cachedLocation.state;
      else if (historyStation?.state) locationName += ", " + historyStation.state;

      if (cachedLocation?.id) locationName += " - " + cachedLocation.id;
      else if (historyStation?.id) locationName += " - " + historyStation.id;

      if (!locationName) {
        if (cachedLocation?.latitude)
          locationName = parseFloat(cachedLocation?.latitude).toFixed(3);
        if (cachedLocation?.longitude)
          locationName += ", " + parseFloat(cachedLocation.longitude).toFixed(3);
      }
      if (locationName) locationName += "&nbsp;";

      if (Log.Debug()) {
        console.log("[HistoryStation] ", historyStation);
        console.log("[CachedLocation]", cachedLocation);
        console.log("[LocationName]", locationName);
      }
    }

    // Long Forecast
    if (weather?.pointData && weather?.stationsData && weather?.forecastData) {
      locationName = weather.pointData.properties.relativeLocation.properties.city;
      // debug
      // longname long name longest name
      // "100 lake shore, Village of Grosse Pointe Shores, Michigan"
      // "Chargoggagoggmanchauggagoggchaubunagungamaugg, MA";
      // locationName = "Chargoggagoggmanchauggagoggchaubunagungamaugg";
      // DEBUG LONGEST NAME:
      // locationName = "Chargo ggagogg manchau ggagogg chaubu nagung amaugg";

      locationName += ", ";
      locationName += weather.pointData.properties.relativeLocation.properties.state;
      locationName += " - " + weather.stationsData.features[0].properties.stationIdentifier;
      locationName += historyStation?.id ? " " + historyStation.id : "";

      let shortText = weather.forecastData.properties.periods[0].shortForecast;
      let forecast = weather.forecastData.properties.periods[0].detailedForecast;
      let temp = weather.forecastData.properties.periods[0].temperature;
      let unit = weather.forecastData.properties.periods[0].temperatureUnit;
      temp = Fahrenheit(temp, unit);
      let precip = weather.forecastData.properties.periods[0].detailedForecast; // already above
      let img = weather.forecastData.properties.periods[0].icon;
      let altimg = config.WeatherKittyForeImage;
      let text = "";
      {
        let locationTest = weather.pointData.properties.relativeLocation.properties.city;
        if (!locationTest && Log.Warn()) console.log("[WeatherKitty] Warning: Null forecast");
        if (!forecast && Log.Warn()) console.log("[WeatherKitty] Warning: Null forecast");
      }

      // text += `<b>${locationName}</b><br><br>`;

      text += `<b>Current:</b><br>`;
      text += `${shortText}`;
      if (temp !== null && temp !== undefined && !isNaN(temp)) text += ` ${temp}°`; // degrees °f
      if (precip !== null && precip !== undefined && !isNaN(precip) && parseInt(precip))
        text += ` - ${precip}% precipitation`;
      text += `<br><br>`;

      text += `<b>Forecast:</b><br>`;
      text += `${forecast} ${temp}°`; // degrees °f

      let widgets = document.getElementsByTagName("weather-kitty-tooltip");
      for (let widget of widgets) {
        // widget.setAttribute("tooltip", forecast);
        let paragraph = widget.getElementsByTagName("p");
        if (paragraph && paragraph.length > 0) paragraph[0].innerHTML = text;
      }
    }

    // weather-kitty-geoaddress Location Block
    let widgets = document.getElementsByTagName("weather-kitty-geoaddress");
    for (let widget of widgets) {
      let span = widget.getElementsByTagName("span")[0];
      if (locationName) if (span) span.innerHTML = locationName;
      SetAddLocationButton(widget);
    }

    // Forecast Matrix

    if (weather?.forecastData) ForecastMatrix(weather?.forecastData?.properties?.periods);

    // --------------------------------------------------------------
    // Charting
    // barometricPressure, dewpoint, ...
    // check for chart types, if we don't need them, don't pull the data.
    // Moving this above so we can apply it to stationID as well.
    // let ChartTypes = await WeatherKittyGetChartTypes();
    // ---

    if (ChartTypes?.length > 0) {
      let chartData = new Map();
      let historyData = new Map();

      if (ChartTypes?.Weather?.length > 0 && config.ENABLE.weather) {
        chartData = await GetObservationChartData(weather?.observationData.features);
      }

      if (ChartTypes?.History.length > 0 && config.ENABLE.history) {
        let locData = await getWeatherLocationAsync();

        if (!locData?.id) {
          let stationList = await WeatherKittyIsLoading("Get Station List", () => {
            return HistoryGetStationList();
          });
          locData = await WeatherKittyIsLoading("Search Station List", () => {
            return HistorySearchStationList(stationList, locData?.latitude, locData?.longitude);
          });
        }
        console.log("locData.id:", locData.id);
        let fileData = await WeatherKittyIsLoading("Get Csv File", () => {
          return HistoryGetCsvFile(locData?.id);
        });
        historyData = await WeatherKittyIsLoading("Parse Csv File", () => {
          return HistoryParseCsvFile(fileData);
        });
        // historyData = await HistoryGetChartData(null, locData?.latitude, locData?.longitude);
      }

      // append the history data
      if (ChartTypes?.History.length > 0 && historyData?.size > 0 && chartData?.size > 0) {
        for (let key of historyData.keys()) {
          chartData.set(key, historyData.get(key));
        }
      } else if (ChartTypes?.History.length > 0) {
        chartData = historyData;
      }

      await WeatherCharts(chartData, locationName);
    }
    if (config.WeatherKittyIsLoaded < 3) {
      config.WeatherKittyIsLoaded = 3;
      MonitorCharts();
    }

    // API Status.  Update the status of any api that isn't already updated.
    // CheckApiStatus(); // cj - I think I like this bettter disabled. Only load/check APIs as needed.

    WeatherKittyIsLoading("Call_Backs", async () => {
      if (!config.WeatherKittyCallBacks) return;
      for (let callback of config.WeatherKittyCallBacks) {
        if (callback) {
          if (Log.Debug()) console.log("[WeatherKitty] Callback: ", callback.name);
          await callback();
        }
      }
    });
  });

  // console.log("[WeatherKitty] Exiting Weather Kitty");
}

// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

export async function WeatherKittyWaitOnLoad() {
  while (!config.WeatherWidgetIsLoaded || (await WeatherKittyIsLoading())) {
    await microSleep(100);
  }
  return;
}

export function WeatherKittyGetWeatherTypes() {
  let elements;
  elements = document.getElementsByTagName("weather-kitty");
  if (elements.length > 0) return true;
  elements = document.getElementsByTagName("weather-kitty-forecast");
  if (elements.length > 0) return true;
  elements = document.getElementsByTagName("weather-kitty-current");
  if (elements.length > 0) return true;
  elements = document.getElementsByTagName("weather-kitty-tooltip");
  if (elements.length > 0) return true;
  elements = document.getElementsByTagName("weather-kitty-week");
  if (elements.length > 0) return true;
  elements = document.getElementsByTagName("weather-kitty-radar-local");
  if (elements.length > 0) return true;

  return false;
}

export function WeatherKittyErrorText(message) {
  let elements = document.getElementsByTagName("weather-kitty-geoaddress");
  for (let element of elements) {
    let span = element.getElementsByTagName("span")[0];
    if (span) span.innerHTML = message;
    let label = element.getElementsByTagName("label")[0];
    if (label) label.innerHTML = message;
  }
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
    button.innerHTML = config.SetLocationText;
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
    if (await WeatherKittyIsLoading()) return;
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

// --------------------------------------------------------------
// Function WeatherKittyLoading ... loading indicator
// WeatherKittyLoading(set value);
// WeatherKittyLoading(); // returns true if loading
// if isLoading is false and message is null, then clear all indicators
export async function WeatherKittyIsLoading(message, func) {
  // if WKL(null) then return status of loading
  if (message == null || func == null) {
    let result = config.KvpTimers.size > 0;
    return result;
  }

  config.KvpTimers.set(message, Date.now());
  SetLoadingIndicatorMessage(config.KvpTimers);
  if (Log.Debug()) console.log("[WeatherKittyIsLoading]", message);
  let result = await func();
  if (Log.Debug())
    console.log(`[WeatherKittyIsLoading]`, message, wkElapsedTime(config.KvpTimers.get(message)));
  config.KvpTimers.delete(message);
  SetLoadingIndicatorMessage(config.KvpTimers);

  microSleep(1);
  return result;
}

async function SetLoadingIndicatorMessage(kvpMap) {
  if (kvpMap.size > 0) {
    let array = [...kvpMap.entries()];
    let [message, value] = array[array.length - 1];
    message = message.trim().toLowerCase();
    let MAX_MESSAGE_SIZE = 16;
    if (message && message.length > MAX_MESSAGE_SIZE)
      message = message.substring(0, MAX_MESSAGE_SIZE); // LOADING MESSAGE TRUNCATE
    let widgets = document.getElementsByTagName("weather-kitty-geoaddress");
    for (let widget of widgets) {
      let span = widget.getElementsByTagName("span")[0];
      if (span) span.style.display = "none";
      let label = widget.getElementsByTagName("label")[0];
      if (label) {
        if (message) label.innerHTML = `${message} &nbsp; `; // LOADING MESSAGE
        else label.innerHTML = "Loading ... &nbsp; ";
        label.style.display = "block";
      }
    }
  } else {
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
}

// disable the widget and disable the initial loading of the widget
// if you use this you may need to call WeatherKitty() to load the widget
function WeatherKittyEnable(valueObject) {
  if (valueObject === undefined || valueObject === null) return config.ENABLE;
  if (valueObject === true) config.ENABLE.widgets = true;
  else if (valueObject === false) config.ENABLE.widgets = false;
  else {
    if (valueObject.widgets === true) config.ENABLE.widgets = true;
    else if (valueObject.widgets === false) config.ENABLE.widgets = false;
    if (valueObject.weather === true) config.ENABLE.weather = true;
    else if (valueObject.weather === false) config.ENABLE.weather = false;
    if (valueObject.history === true) config.ENABLE.history = true;
    else if (valueObject.history === false) config.ENABLE.history = false;
  }
  return config.ENABLE;
}

// Function WeatherMaps
async function WeatherMaps(elementName, Url, CacheTime) {
  WeatherKittyIsLoading(elementName.replace("weather-kitty-", ""), async () => {
    let maps = document.getElementsByTagName(elementName);
    if (maps.length <= 0) return;
    let response = await corsCache(Url, null, CacheTime);
    if (response != null && response.ok) {
      let blob = await response.blob();
      let url = URL.createObjectURL(blob);
      for (let map of maps) {
        let img = map.getElementsByTagName("img")[0];
        img.src = url;

        // cj - I really probably shouldn't do this ... but it's my map so live with it.
        if (elementName === "weather-kitty-radar-local") {
          let boxTarget = map.getElementsByClassName("wk-BoxTarget")[0];
          if (boxTarget) {
            if (Url.includes("KMRX")) {
              boxTarget.style.display = "block";
              boxTarget.style.left = "calc(52% - var(--box-size) / 2)";
              boxTarget.style.bottom = "calc(63.66% - var(--box-size) / 2)";
            } else if (Url.includes("KJKL")) {
              boxTarget.style.display = "block";
              boxTarget.style.left = "calc(51% - var(--box-size) / 2)";
              boxTarget.style.bottom = "calc(31% - var(--box-size) / 2)";
            } else boxTarget.style.display = "none";
          }
        }

        // --------------------------------------------------------------
        // Thruple Events
        img.removeEventListener("touchstart", () => {
          img.removeEventListener("click", AIshowFullscreenImage);
        });
        img.removeEventListener("touchend", () => {
          setTimeout(() => {
            img.addEventListener("click", AIshowFullscreenImage);
          }, 1);
        });
        img.removeEventListener("click", AIshowFullscreenImage);
        // /Thruple Events
        // --------------------------------------------------------------

        // --------------------------------------------------------------
        // Thruple Events

        img.addEventListener("touchstart", () => {
          // touchstart over-rides mousedown
          img.removeEventListener("click", AIshowFullscreenImage);
        });
        img.addEventListener("touchend", () => {
          // touchend adds mousedown back in
          setTimeout(() => {
            img.addEventListener("click", AIshowFullscreenImage);
          }, 1);
        });
        img.addEventListener("click", AIshowFullscreenImage); // Mouse-Only Click
        // /Thruple Events
        // --------------------------------------------------------------
      }
    } else {
      console.log("[WeatherMaps] *** ERROR ***: No Map Data Available");
    }
  });
}

0;

// Function ForecastMatrix
async function ForecastMatrix(data) {
  if (!data || data.length <= 0) {
    if (Log.Error()) console.log("[ForecastMatrix] *** ERROR ***: No Data Available");
    return;
  }

  let text = "";
  let i = 0;
  for (let period of data) {
    // if (i === 3) period.shortForecast = "Slight Chance Rain Showers then Slight Chance Rain And Snow Showers"; //  Debug Long Text
    let wkCardNight = "";
    if (period.isDaytime === false) wkCardNight = `class="wk-card-night"`;
    i++;
    let leftRight = "";
    if (i === 1) leftRight = `class="wk-left"`;
    else if (i === data.length) leftRight = `class="wk-right"`;
    let precip = period.probabilityOfPrecipitation.value; // cjm
    if (!precip || isNaN(precip) || parseInt(precip) < 1)
      precip = `<span> &nbsp; </span><span> &emsp; </small></span>`;
    else precip = `<span> &nbsp </span><span> ${precip}% </small></span>`; // cjm

    text += `
      <weather-kitty-week-card ${wkCardNight}>
    <weather-kitty-week-title>${period.name}</weather-kitty-week-title>    
    <clip style="display: block;">
      <weather-kitty-week-tip ${leftRight}>
        <span >${period.detailedForecast}</span>
      </weather-kitty-week-tip><img src=${period.icon} alt="Weather Image">
    </clip><br>
        <weather-kitty-week-summary>
          <span>
            ${period.temperature}<small>${period.temperatureUnit.toLowerCase()}</small> 
          </span>
          
          
            ${precip}
        </weather-kitty-week-summary>
        <weather-kitty-week-forecast> ${BadHyphen(
          period.shortForecast
        )} </weather-kitty-week-forecast>
      </weather-kitty-week-card>
      `;
  }
  let targets = document.getElementsByTagName("weather-kitty-week");

  for (let target of targets) {
    if (target != null) target.innerHTML = text;
  }
}

// Function Process Chart Elements
export async function WeatherCharts(chartData, locationName) {
  await WeatherKittyIsLoading("charts", async () => {
    if (chartData == null) {
      if (Log.Warn()) console.log("[WeatherCharts] Warning: No Chart Data Available");
      return;
    }

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
          console.log("[ProcessCharts] *** ERROR ***: Chart Type Not Defined", container);

        continue;
      }
      chartType = chartType.trim();

      // NO-DATA  CHART-NO-DATA // no-data
      if (types.includes(chartType) === false) {
        if (container.getAttribute("NoData")?.toLowerCase() === "hide")
          container.style.display = "none";
        if (Log.Trace()) console.log(`[ProcessCharts] Chart Type [${chartType}] Not Found`);
        // continue;
      } else {
        container.style.display = "block"; // chart-display
      }
      let chart = chartData.get(chartType);

      CreateChart(
        container,
        chartType,
        chart?.values,
        chart?.timestamps,
        null,
        chart?.history,
        locationName
      );
    }
  });
}

// Function CreateChart
export async function CreateChart(
  chartContainer,
  key, // Key value and Title of Chart
  values,
  timestamps,
  aspect, // aspect ratio, 0 or null for auto
  isHistory, // history = true for history charts and history date format
  locationName
) {
  WeatherKittyIsLoading(`${key}`, async () => {
    if (values == null || values.length == 0 || values[0].value === undefined) {
      if (Log.Verbose()) console.log(`[CreateChart] ${key}: values are empty`);
      // return; // no-data - I'm going to allow NO_DATA Charts to render blank. oops.
    }
    if (
      timestamps === null ||
      timestamps === undefined ||
      timestamps.length === 0 ||
      timestamps[0] === undefined
    ) {
      if (Log.Verbose()) {
        console.log(`[CreateChart] ${key}: timestamps are empty`);
      }
      // return; // no-data - I'm going to allow NO_DATA Charts to render blank. oops.
    }
    if (chartContainer === null || chartContainer === undefined || chartContainer.length === 0) {
      console.log("[CreateChart] *** ERROR *** chartContainer is Null! ");
      console.log(chartContainer, key, values, timestamps);
      return;
    }
    if (key === "timestamp") return; // I should just leave that one in for fun.

    // CHART ATTRIBUTES chart
    // - [ ] MaxDataPoints = Set, Calc(MaxWidth/PixelsPerPoint), default: 8000
    // - [ ] PixelsPerPoint, default: 4 . 4 looks best visually to me.
    // - [ ] DataLength: Truncate, ReverseTruncate,
    // - [ ] AverageData: None, Fit, Week, Month, Quarter, Year
    await microSleep(1); // to let the container render

    let maxDataPoints, pixelsPerPoint, averageData, dataLength;
    let width, height, chartAspect;
    let originalDataLength = values?.length;
    let chartDiv = chartContainer.getElementsByTagName("canvasBounds")[0];
    let containerStyle = window.getComputedStyle(chartContainer);
    let chartDivStyle = window.getComputedStyle(chartDiv);
    let oneEm = parseFloat(containerStyle.fontSize);

    maxDataPoints = chartContainer.getAttribute("maxDataPoints");
    pixelsPerPoint = chartContainer.getAttribute("pixelsPerDataPoint");
    dataLength = chartContainer.getAttribute("trimData");
    averageData = chartContainer.getAttribute("averageData");

    if (!maxDataPoints) maxDataPoints = "auto";
    maxDataPoints = maxDataPoints.toLowerCase();
    if (!pixelsPerPoint) pixelsPerPoint = "auto";
    pixelsPerPoint = pixelsPerPoint.toLowerCase();
    if (!averageData) averageData = "none";
    averageData = averageData.toLowerCase();
    if (!dataLength) dataLength = "truncate";
    dataLength = dataLength.toLowerCase();

    // ---------------------  Calculate Width and Height ---------------------

    // Calculate Width and Height in order to later calculate Aspect Ratio
    // Attribute first, then style, then window

    // ATTRIBUTES - These are numbers
    if (!width) width = parseFloat(chartContainer.getAttribute("width"));
    if (!height) height = parseFloat(chartContainer.getAttribute("height"));
    chartContainer.style.width = width + "px";
    chartContainer.style.height = height + "px";
    width = height = null;

    // ELEMENT Div these are numbers
    if (!width) width = chartDiv.offsetWidth;
    if (!height) height = chartDiv.offsetHeight;
    if (width && height) height = height - 0.333 * oneEm;

    if (!width) {
      // STYLES (Computed)- These are px or % or ... em or rem or vw or vh or cm or mm or in or pt or pc
      if (!width) width = GetPixels(containerStyle.width);
      if (!height) height = GetPixels(containerStyle.height);

      // These are numbers
      if (!width) width = window.innerWidth;
      if (!height) height = window.innerHeight;
      if (width && height) {
        width =
          width -
          AddPixels([
            containerStyle.paddingLeft,
            containerStyle.paddingRight,
            chartDivStyle.marginLeft,
            chartDivStyle.marginRight,
            chartDivStyle.borderWidth,
            chartDivStyle.borderWidth,
          ]);
        height =
          height -
          AddPixels([
            containerStyle.paddingTop,
            containerStyle.paddingBottom,
            chartDivStyle.marginTop,
            chartDivStyle.marginBottom,
            chartDivStyle.borderWidth,
            chartDivStyle.borderWidth,
          ]);
      }
    }

    // width = parseFloat(width);
    // height = parseFloat(height);

    if (width < 16 || width > config.maxWidth) width = config.defaultWidth;
    if (height < 16 || height > config.maxHeight) height = config.defaultHeight;

    // Default Aspect Ratio ------------------------------------------------
    chartAspect = width / height;
    if (chartAspect < 1) chartAspect = 1;
    if (chartAspect > 3.56) chartAspect = 3.56;
    // /Default Aspect Ratio

    // MAX DATA POINTS
    // ---
    // if mx then we need to set mx based on input parameters

    let localPx;
    if (pixelsPerPoint in config.ChartPixelsPerPointDefault)
      localPx = config.ChartPixelsPerPointDefault[pixelsPerPoint];
    else localPx = parseFloat(pixelsPerPoint);
    if (isNaN(localPx)) localPx = config.ChartPixelsPerPointDefault["default"];
    localPx = Math.abs(localPx);
    let localMax = Math.floor(config.CHARTMAXWIDTH / localPx);

    if (maxDataPoints === "auto") maxDataPoints = Math.floor(width / localPx);
    else if (maxDataPoints === "default") maxDataPoints = config.ChartMaxPointsDefault;
    else if (maxDataPoints === "max") maxDataPoints = localMax;
    maxDataPoints = Math.abs(maxDataPoints);
    if (maxDataPoints > localMax) maxDataPoints = localMax;

    // ---
    // /MAX DATA POINTS

    // AVERAGE DATA .. then Trim
    // - [ ] AverageData: None, Fit, Week, Month, Quarter, Year
    switch (averageData) {
      case "fit":
      case "auto":
      case "avg":
      case "average":
        {
          let avgValues = [];
          let avgTimestamps = [];
          let step = Math.ceil(values?.length / maxDataPoints);
          let divisionCheck = values?.length / step < maxDataPoints;
          let sum = 0;
          let count = 0;
          for (let i = 0; i < values?.length; i++) {
            sum += values[i].value;
            count++;
            if (count >= step) {
              avgValues.push({
                value: sum / count,
                unitCode: values[i].unitCode,
              });
              avgTimestamps.push(timestamps[i]);
              sum = 0;
              count = 0;
            }
          }
          avgValues.push(sum / count);
          if (values) avgTimestamps.push(timestamps[values.length - 1]);

          values = avgValues;
          timestamps = avgTimestamps;
        }
        break;
      case "wk":
      case "week": {
        // Github Copilot AI,  based on my original human code block above , and then edited again by human
        let avgValues = [];
        let avgTimestamps = [];
        let weekData = {};

        for (let i = 0; i < values?.length; i++) {
          let date = new Date(timestamps[i]);
          // let week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`; // this isn't the type of week I want.
          // get day number from the beginning of the year
          let year = date.getFullYear();
          let dayOfYear = Math.ceil((date - new Date(year, 0, 1)) / 86400000);
          let weekOfYear = dayOfYear / 7;
          weekOfYear = Math.floor(weekOfYear);
          let week = weekOfYear + year * 52;

          if (!weekData[week]) {
            weekData[week] = { sum: 0, count: 0, timestamp: timestamps[i] };
          }

          weekData[week].sum += values[i].value;
          weekData[week].count++;
        }

        for (let week in weekData) {
          avgValues.push({
            value: weekData[week].sum / weekData[week].count,
            unitCode: values[0].unitCode,
          });
          avgTimestamps.push(weekData[week].timestamp);
        }

        values = avgValues;
        timestamps = avgTimestamps;
        break;
      }
      // Github Copilot AI, ... AI did a better job this time.
      // All of this will have to be modified later if I want it to match chart.js data format
      case "mth":
      case "month": {
        let avgValues = [];
        let avgTimestamps = [];
        let monthData = {};

        for (let i = 0; i < values?.length; i++) {
          let date = new Date(timestamps[i]);
          let month = `${date.getFullYear()}-${date.getMonth() + 1}`;

          if (!monthData[month]) {
            monthData[month] = { sum: 0, count: 0, timestamp: timestamps[i] };
          }

          monthData[month].sum += values[i].value;
          monthData[month].count++;
        }

        for (let month in monthData) {
          avgValues.push({
            value: monthData[month].sum / monthData[month].count,
            unitCode: values[0].unitCode,
          });
          avgTimestamps.push(monthData[month].timestamp);
        }

        values = avgValues;
        timestamps = avgTimestamps;
        break;
      }
      case "qtr":
      case "quarter": {
        // Github Copilot AI,
        let avgValues = [];
        let avgTimestamps = [];
        let quarterData = {};

        for (let i = 0; i < values?.length; i++) {
          let date = new Date(timestamps[i]);
          let quarter = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3)}`;

          if (!quarterData[quarter]) {
            quarterData[quarter] = {
              sum: 0,
              count: 0,
              timestamp: timestamps[i],
            };
          }

          quarterData[quarter].sum += values[i].value;
          quarterData[quarter].count++;
        }

        for (let quarter in quarterData) {
          avgValues.push({
            value: quarterData[quarter].sum / quarterData[quarter].count,
            unitCode: values[0].unitCode,
          });
          avgTimestamps.push(quarterData[quarter].timestamp);
        }

        values = avgValues;
        timestamps = avgTimestamps;
        break;
      }
      case "yr":
      case "year": {
        // Github Copilot AI,
        let avgValues = [];
        let avgTimestamps = [];
        let yearData = {};

        for (let i = 0; i < values?.length; i++) {
          let date = new Date(timestamps[i]);
          let year = `${date.getFullYear()}`;

          if (!yearData[year]) {
            yearData[year] = {
              sum: 0,
              count: 0,
              timestamp: timestamps[i],
            };
          }

          yearData[year].sum += values[i].value;
          yearData[year].count++;
        }

        for (let year in yearData) {
          avgValues.push({
            value: yearData[year].sum / yearData[year].count,
            unitCode: values[0].unitCode,
          });
          avgTimestamps.push(yearData[year].timestamp);
        }

        values = avgValues;
        timestamps = avgTimestamps;
        break;
      }
      case "decade":
      case "10yr": {
        // Github Copilot AI,
        let avgValues = [];
        let avgTimestamps = [];
        let decadeData = {};

        for (let i = 0; i < values.length; i++) {
          let date = new Date(timestamps[i]);
          let decade = `${Math.floor(date.getFullYear() / 10) * 10}`;

          if (!decadeData[decade]) {
            decadeData[decade] = { sum: 0, count: 0, timestamp: timestamps[i] };
          }

          decadeData[decade].sum += values[i].value;
          decadeData[decade].count++;
        }

        for (let decade in decadeData) {
          avgValues.push({
            value: decadeData[decade].sum / decadeData[decade].count,
            unitCode: values[0].unitCode,
          });
          avgTimestamps.push(decadeData[decade].timestamp);
        }

        values = avgValues;
        timestamps = avgTimestamps;
        break;
      }
      case "none":
        break;
      default:
        if (Log.Error()) console.log("*** ERROR *** : Invalid Value for AverageData", averageData);
        break;
    }

    // TRIM Data if needed
    if (values?.length > maxDataPoints) {
      switch (dataLength) {
        case "trunc":
        case "truncate":
          ``;
          {
            values = values.slice(values.length - maxDataPoints);
            timestamps = timestamps.slice(timestamps.length - maxDataPoints);
            break;
          }
        case "rev":
        case "reverse": {
          values = values.slice(0, maxDataPoints);
          timestamps = timestamps.slice(0, maxDataPoints);
          break;
        }
        default: {
          if (Log.Error()) console.log("*** ERROR *** : Invalid Value for TrimData", dataLength);
        }
      }
    }
    // /TRIM Data

    // PX PIXELS PER POINT
    // ---
    // if px then we need to set width based on (reduced) number of data points

    let expandedWidth = 0;
    let chartSpan = chartContainer.getElementsByTagName("chartSpan")[0];

    if (pixelsPerPoint !== "auto") {
      if (pixelsPerPoint in config.ChartPixelsPerPointDefault)
        pixelsPerPoint = config.ChartPixelsPerPointDefault[pixelsPerPoint];
      expandedWidth = values.length * pixelsPerPoint;
      if (expandedWidth > config.CHARTMAXWIDTH) expandedWidth = config.CHARTMAXWIDTH;
      chartDiv.style.width = `${expandedWidth}px`;
      // 1em looks pretty good. ... there must be built in margins or padding.
      chartAspect = expandedWidth / (height - 0 * oneEm);
    }

    // chart
    {
      let preFix = `${isHistory ? "History" : ""}${
        averageData != "none" ? `(${averageData})` : ""
      }`;
      if (preFix.length > 0) preFix += ":";
      let suffix;
      if (locationName) suffix = `<br>${locationName}`;
      else suffix = "";
      if (chartSpan)
        chartSpan.innerHTML = `${preFix} ${key} - ${
          values && values[0]?.unitCode ? values[0]?.unitCode : "NO-DATA"
        } ${suffix}`; // no-data
    }

    // ---
    // /PIXELS PER POINT

    let data = [];
    let time = [];
    await microSleep(1);
    // optimize
    for (let i = 0; i < values?.length; i++) {
      data.push(values[i].value);
      let date = new Date(timestamps[i]);
      let label;
      if (isHistory) {
        label = date.toLocaleString(undefined, config.historyFormat);
        label = label.replace(/ AM/, "a").replace(/ PM/, "p").replace(/\//g, "-");
      } else {
        label = date.toLocaleString(undefined, config.timeFormat);
        label = label.replace(/ AM/, "a").replace(/ PM/, "p").replace(/\//g, "-");
      }
      time.push(label);
    }
    await microSleep(1);
    // optimize this.  This is about (1 second / 20%) cpu per chart. maybe on-read or use a flag and for-loop reverse-for-loop
    if (!isHistory) {
      // Oldest to Newest
      data = data.reverse();
      time = time.reverse();
    }

    let canvas = chartContainer.getElementsByTagName("canvas")[0];
    if (canvas === null || canvas === undefined) {
      console.log("[CreateChart] *** ERROR ***: Canvas Element Not Found");
      console.log(chartContainer);

      return;
    }

    canvas.id = key;

    // ------------------------------------------------------------------
    let chart = Chart.getChart(canvas);

    // chart
    // Decimation-Test
    // const decimation = {
    //   enabled: true,
    //   // algorithm: "min-max",
    //   algorithm: "lttb",
    //   samples: 50,
    // };

    // NO CHART - CREATE NEW CHART
    if (chart === null || chart === undefined) {
      let labelName = `${key} - ${values ? values[0]?.unitCode : "NO-DATA"}`; // no-data
      labelName = labelName.replace("wmoUnit:", "");
      await microSleep(1);
      let newChart = new Chart(canvas, {
        type: "line",
        data: {
          labels: time,
          datasets: [
            {
              // label: labelName,
              label: "",
              data: data,
              // "circle", "cross", "crossRot", "dash", "line", "rect", "rectRounded", "rectRot", "star", "triangle", false
              indexAxis: "x",
              pointStyle: false,
            },
          ],
        },
        options: {
          animation: false, // optimize, this cut render time in half.
          // spanGaps: true, // optimize, only a small performance gain, and it makes some of the charts wonky.

          responsive: true,
          aspectRatio: chartAspect,
          maintainAspectRatio: true,
          plugins: {
            // decimation: decimation,  // Data is not in the correct format for this to work.
            legend: { display: false },
          },
          scales: {
            x: {
              // type: "time", // Data is not in the correct format for this to work.
              ticks: {
                maxRotation: 90,
                minRotation: 60,
                sampleSize: 100, // optimize, this cut another 10%-20%
              },
            },
          },
        },
      });
      // give the history charts more time.  In testing I had to add up to a second here a couple of times.
      if (pixelsPerPoint !== "auto") await microSleep(40);
      else await microSleep(1);
      await newChart.update();
    } else {
      // CHART EXISTS - UPDATE CHART
      let labelName = `${key} - ${values ? values[0]?.unitCode : "NO-DATA"}`; // no-data
      chart.data.labels = time;
      chart.data.datasets = [
        {
          label: labelName,
          data: data,
        },
      ];
      if (chartAspect) {
        chart.options.aspectRatio = chartAspect;
        chart.options.maintainAspectRatio = true;
      }
      await chart.resize(width, height);
      await chart.update();
    }
    // ------------------------------------------------------------------
    if (chartContainer) RecalculateChartAspect(chartContainer);
  });
}

async function MonitorCharts() {
  let chartList;
  let i = 0;

  do {
    await sleep(1);

    let newList = [];
    let elements = document.getElementsByTagName("weather-kitty-chart");
    if (!chartList) ReCalcChartAspectAll();
    for (let element of elements) {
      let style = window.getComputedStyle(element);
      let entry = {
        // Ugh.  I missed this issue for so long. element vs style
        innerHeight: element.clientHeight,
        innerWidth: element.clientWidth,
        outerHeight: element.offsetHeight,
        outerWidth: element.offsetWidth,
        display: style.display,
      };
      let stringData = JSON.stringify(entry);
      newList.push(stringData);
      await microSleep(1);
    }
    if (chartList?.length > 0 && JSON.stringify(chartList) != JSON.stringify(newList))
      ReCalcChartAspectAll();
    chartList = newList;
  } while (true);
}

export async function ReCalcChartAspectAll() {
  if (Log.Verbose()) console.log("ReCalcChartAspectAll");
  let chartContainers = document.getElementsByTagName("weather-kitty-chart");
  for (let container of chartContainers) {
    RecalculateChartAspect(container);
    await microSleep(1);
  }
}

// chart
async function RecalculateChartAspect(chartContainer) {
  // chart-display chart-resize chart-reCalc
  let type = chartContainer.getAttribute("type");
  let chartDiv = chartContainer.getElementsByTagName("canvasBounds")[0];
  let oneEm = parseFloat(getComputedStyle(chartContainer).fontSize);

  // testing ...
  if (!chartDiv) return;
  let width = chartDiv.offsetWidth;
  let height = chartDiv.offsetHeight;
  if (!width || !height) return;

  height = height - 0.333 * oneEm;
  let chartAspect = width / height;

  if (!isNaN(chartAspect)) {
    let element = chartContainer.getElementsByTagName("canvas")[0];
    let chart = Chart.getChart(element);
    if (chart) {
      chart.options.aspectRatio = chartAspect;
      chart.options.maintainAspectRatio = true;

      await chart.resize(width, height);
      await chart.update();
    }
  }
}

// Function WeatherSquares
// an imageurl of "/null" will not change the image
async function WeatherSquares(elementId, replacementText, replacementImgUrl, alternateImgUrl) {
  let elements = document.getElementsByTagName(elementId);
  if (elements == undefined || elements == null || elements.length === 0) return;

  for (let element of elements) {
    let weatherImg = element.querySelector("weather-kitty-current >  img");
    let textDiv = element.querySelector("weather-kitty-current > clip > span"); // clip-span
    if (weatherImg === null) {
      weatherImg = element.querySelector("weather-kitty-forecast > img");
      textDiv = element.querySelector("weather-kitty-forecast > clip  > span");
    }
    textDiv.innerHTML = replacementText;

    // Icon
    if (replacementImgUrl != null && replacementImgUrl !== "") {
      if (replacementImgUrl.toLowerCase().includes("/null") === false)
        weatherImg.src = replacementImgUrl;
    } else {
      if (alternateImgUrl != null && alternateImgUrl !== "") {
        if (alternateImgUrl.toLowerCase().includes("/null") === false)
          weatherImg.src = alternateImgUrl;
      } else weatherImg.src = `url(config.WeatherKittyPath + "img/WeatherKittyE8.png")`;
    }
  }
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

// Function FindAndReplaceTags
function FindAndReplaceTags(tagName, htmlBlock, className) {
  let widgets = document.getElementsByTagName(tagName);
  for (let widget of widgets) {
    let htmlString = widget?.innerHTML; // check the inner so we can detect custom html
    if (
      htmlString != undefined &&
      htmlString != null &&
      htmlString != "" &&
      htmlString.includes("<")
    ) {
    } else {
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
  if (isMobile()) return; // Disable on mobile

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
  popupImage.addEventListener("touchstart", closeFullscreenImage); // Immediately close on touchend, aka: disabled on mobile.
  popupImage.addEventListener("touchmove", closeFullscreenImage);
  popupImage.addEventListener("touchend", closeFullscreenImage);
  popupImage.addEventListener("mousedown", handleMouseDown);
  popupImage.addEventListener("mousemove", handleMouseMove);
  popupImage.addEventListener("mouseup", handleMouseUp);
  popupImage.addEventListener("wheel", handleWheel);
  popupImage.addEventListener("dblclick", closeFullscreenImage); // do this instead of checking in mouse down.

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.keyCode === 27) {
      if (flag++) return; // Prevents double+ close, but not entirely.
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
    isPanning = true;
    panX = event.clientX - newPanX;
    panY = event.clientY - newPanY;
  }

  function handleMouseMove(event) {
    if (isPanning) {
      newPanX = event.clientX - panX;
      newPanY = event.clientY - panY;
      popupImage.style.transform = `translate(${newPanX}px, ${newPanY}px) scale(${zoomLevel})`;
    }
  }

  function handleMouseUp() {
    isPanning = false;
    let panX = popupImage.offsetLeft;
    let panY = popupImage.offsetTop;
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
      closeFullscreenImage();
    }
  });

  function closeFullscreenImage() {
    if (document.body.contains(popupContainer)) document.body.removeChild(popupContainer);
  }
}
// /Gemini AI
// ------------------------------------------------------------------

async function AssignTouchMoveToCharts(charts) {
  for (let chart of charts) {
    let element = chart.getElementsByTagName("scrollDiv")[0];
    TouchMoveAccelerated(element);
  }
}

async function OnWeatherKitty(callback) {
  if (!callback) config.WeatherKittyCallBacks = [];

  if (!config.WeatherKittyCallBacks) config.WeatherKittyCallBacks = [];
  if (callback) {
    config.WeatherKittyCallBacks.push(callback);
    return;
  }
}

async function WeatherKittyGetAvailableChartTypes() {
  // cjm
  let locData = await getWeatherLocationAsync();
  let weather = await getWeatherAsync(locData);
  let weatherChartData = await GetObservationChartData(weather?.observationData?.features);
  console.log("locData.id:", locData.id);
  if (!locData?.id) {
    let stationList = await HistoryGetStationList();
    locData = await HistorySearchStationList(stationList, locData?.latitude, locData?.longitude);
  }
  let fileData = await HistoryGetCsvFile(locData?.id);
  let historyChartData = await HistoryParseCsvFile(fileData);
  // let historyChartData = await HistoryGetChartData(null, locData.latitude, locData.longitude);
  let weatherChartTypes = weatherChartData?.keys()?.toArray();
  let historyChartTypes = historyChartData?.keys()?.toArray();
  return { weather: weatherChartTypes, history: historyChartTypes };
}

async function WeatherKittyGetNearbyStations(latitude, longitude, radius, count) {
  return WeatherKittyIsLoading("GetNearbyStations", async () => {
    if (!latitude || !longitude) {
      let location = await getWeatherLocationAsync();
      latitude = location.latitude;
      longitude = location.longitude;
    }
    // GEMINI AI: One degree of latitude is approximately 69 miles.
    if (!radius) radius = 1;
    if (!count) count = 1000;

    if (Log.Debug()) console.log("[GetNearbyStations]", latitude, longitude, radius, count);

    let response;
    let APIs = [
      {
        url: "https://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-stations.txt",
        timeout: null,
        apiTag: "wk-status-aws",
      },
      {
        url: "https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt",
        timeout: config.fetchTimeout,
        apiTag: "wk-status-ncei",
      },
      {
        url: "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt",
        timeout: config.fetchTimeout,
        apiTag: "wk-status-ncdc",
      },
    ];

    for (let api of APIs) {
      let url = api.url;
      if (!(await CheckApiStatus(api.apiTag))) continue;
      let options = fetchTimeoutOption(api.timeout);
      response = await fetchCache(url, options, config.archiveCacheTime);

      if (response && response?.ok && response?.status === 200) break;
    }

    if (!response || !response?.ok || response?.status !== 200) {
      if (Log.Error())
        console.log(
          `[HistoricalGetStation] *** ERROR *** : Network Error : No Data,  ${response?.ok} ${response?.status}, ${response?.statusText}`
        );
      return null;
    }

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
    } else {
      if (Log.Error())
        console.log(
          `[HistoricalGetStation] *** ERROR*** : HTTP-Error,  ${response?.status}, ${response?.statusText}`
        );
      return null;
    }

    let data = [];

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

      let distance = ManhattanDistance(
        latitude,
        longitude,
        parseFloat(location.lat),
        parseFloat(location.lon)
      );
      location.distance = distance;
      data.push(location);
    }

    data.sort((a, b) => a.distance - b.distance);
    data = data.slice(0, count);
    // data = data where distance < radius
    // Copilot AI
    data = data.filter((location) => location.distance < radius);

    return data;
  });
}

// ------------------------------------------------------------------

// ------------------------------------------------------------------

// ------------------------------------------------------------------

// Run Weather Kitty
async function Main() {
  // Once upon a time there was more here.
  await WeatherKittyStart();
}

setTimeout(Main, 40);
