"use strict";

import "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
import "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js";

// prettier-ignore
import { Log, LogLevel, config, GetPixels, AddPixels, DecompressCsvFile, sleep, microSleep, TouchMoveAccelerated, isValidNumericString, MathAverage, 
  MathDistance, ManhattanDistance, Fahrenheit, wkElapsedTime, BadHyphen, getWidthInEm, WeatherKittyCheckPath, isMobile, IsMobileByBowser, ExpireData, 
  PurgeData, clearCache, setCache, getCache, WeatherKittyCurrentBlock, WeatherKittyForecastBlock, WeatherKittyWidgetBlock, WeatherKittyChartBlock, WeatherKittyMapForecastBlock, WeatherKittyMapRadarBlock, WeatherKittyMapAlertsBlock, WeatherKittyMapLocalRadarBlock, WeatherKittyGeoAddressBlock,
  WeatherKittyStatusBlock, WeatherKittySignalBlock, RateLimitFetch, CheckApiStatus, assert, fetchTimeoutOption
} from "./src/config.mjs";

// prettier-ignore
export { Log, LogLevel, config, GetPixels, AddPixels, DecompressCsvFile, sleep, microSleep, TouchMoveAccelerated, isValidNumericString, MathAverage, 
  MathDistance, ManhattanDistance, Fahrenheit, wkElapsedTime, BadHyphen, getWidthInEm, WeatherKittyCheckPath, isMobile, IsMobileByBowser, ExpireData, 
  PurgeData, clearCache, setCache, getCache, WeatherKittyCurrentBlock, WeatherKittyForecastBlock, WeatherKittyWidgetBlock, WeatherKittyChartBlock, 
  WeatherKittyMapForecastBlock, WeatherKittyMapRadarBlock, WeatherKittyMapAlertsBlock, WeatherKittyMapLocalRadarBlock, WeatherKittyGeoAddressBlock, 
  WeatherKittyStatusBlock, WeatherKittySignalBlock, RateLimitFetch, CheckApiStatus, assert, fetchTimeoutOption
};

// Function Weather Kitty
async function WeatherKittyStart() {
  let PAUSE = config.PAUSE;
  WeatherKittyIsLoading("Startup", async () => {
    config.SanityChecks();
    if (config.WeatherKittyIsLoaded > 0) {
      if (Log.Error()) console.log("[WeatherKitty] *** ERROR *** : Already Loaded");
      return;
    }
    config.WeatherKittyIsLoaded = 1;
    await microSleep(1); // Just long enough that you can set the log level before it starts.
    let path = "";
    let results;

    let scripts = document.getElementsByTagName("script");
    let script = null;
    for (let subScript of scripts) {
      if (subScript.src.includes("WeatherKitty")) {
        script = subScript;
        break;
      }
    }
    if (script === null) {
    } else {
      let url = new URL(script.src);
      path = url.pathname;
      const lastSlashIndex = path.lastIndexOf("/");
      if (lastSlashIndex >= 0) path = path.substring(0, lastSlashIndex + 1); // Include the trailing slash
      if (Log.Warn()) {
        console.log("[WeatherKittyStart] Loading From: ", path);
      }
      config.WeatherKittyPath = path;
    }

    config.WeatherKittyObsImage = path + config.WeatherKittyObsImage;
    config.WeatherKittyForeImage = path + config.WeatherKittyForeImage;

    await WeatherWidgetInit(path);

    if (!PAUSE) setTimeout(WeatherKitty, 40);

    setInterval(WeatherKitty, config.shortCacheTime);
    config.WeatherKittyIsLoaded = 2;

    if (Log.Warn() && PAUSE) {
      console.log("[WeatherKittyStart] Warning: PAUSED.");
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
    if (config.PAUSE) {
      if (Log.Warn()) console.log("[WeatherKitty] Warning: Temporarily PAUSED");
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
    if (LoadWeather || LoadWeatherCharts) weather = await getWeatherAsync();

    // Insert Local Radar here.
    // https://radar.weather.gov/ridge/standard/KMRX_loop.gif
    let localRadar = weather?.radarStation;
    if (localRadar) {
      let url = `https://radar.weather.gov/ridge/standard/${localRadar}_loop.gif`;
      WeatherMaps("weather-kitty-radar-local", url, config.shortCacheTime - 60000);
    }
    // /Local Radar

    let historyStation = null;
    if (ChartTypes.History.length > 0) {
      let location = await getWeatherLocationAsync();
      if (location && location?.latitude && location?.longitude) {
        let latitude = location.latitude;
        let longitude = location.longitude;
        historyStation = await HistoryGetStation(null, latitude, longitude);
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
      if (precip !== null && precip !== undefined && !isNaN(precip) && precip)
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
      if (precip !== null && precip !== undefined && !isNaN(precip) && precip)
        text += ` - ${precip}%`;

      WeatherSquares("weather-kitty-forecast", text, img, altimg);
    }

    let locationName = null;
    {
      let response = (await getCache("/weatherkittycache/location"))?.response;
      let cachedLocation = await response?.json();
      if (response && response.ok) {
        console.log("[WeatherKitty] Cached Location", cachedLocation);
        locationName = cachedLocation.city ? cachedLocation.city : "";
        locationName += cachedLocation.name ? cachedLocation.name : "";
        locationName += cachedLocation.state ? ", " + cachedLocation.state : "";
        locationName += cachedLocation.id ? " - " + cachedLocation.id : "";
        if (!locationName) {
          locationName = cachedLocation.latitude
            ? parseFloat(cachedLocation?.latitude).toFixed(6)
            : "";
          locationName += cachedLocation.longitude
            ? ", " + parseFloat(cachedLocation?.longitude).toFixed(6)
            : "";
        }
      } else console.log("[WeatherKitty] No Cached Location", cachedLocation);
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
      if (precip !== null && precip !== undefined && !isNaN(precip) && precip)
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

      if (ChartTypes?.Weather?.length > 0) {
        chartData = await GetObservationChartData(weather?.observationData.features);
      }

      if (ChartTypes?.History.length > 0) {
        historyData = await HistoryGetChartData();
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
  });
  // console.log("[WeatherKitty] Exiting Weather Kitty");
}

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

export async function SetLocationAddress(address) {
  if (Log.Info()) console.log("[SetLocationAddress] ", address);
  let result = await getWeatherLocationByAddressAsync(address);
  if (result && result.ok) {
    // Override the location cache, and make it permanent.
    await setCache("/weatherkittycache/location", result, config.FOREVER);
  } else {
    // clear the location cache if you cancel the address or input an invalid address
    if (result) window.alert("No Location Data Available");
    clearCache("/weatherkittycache/location");
  }
  // WeatherKitty();
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
    if (message && message.length > 8) message = message.substring(0, 8);
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
export function WeatherKittyPause(value) {
  config.PAUSE = value;
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

// Function getWeatherLocationAsync
// City, State, Country, ZipCode, Latitude, Longitude
export async function getWeatherLocationAsync() {
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
export async function getLocationAsync() {
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
export async function getWeatherLocationByAddressAsync(address) {
  let error = new Response("Address Error", { status: 400, ok: false });
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
  let street = "";
  let city = "";
  let state = "";
  let zip = "";

  switch (array.length) {
    case 1: {
      // GHCND Station
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
      return error;
      break;
    }
    case 2:
      let word1 = array[0].trim();
      let word2 = array[1].trim();
      word1 = word1.replace(",", "");
      word2 = word2.replace(",", "");

      if (isValidNumericString(word1) && isValidNumericString(word2)) {
        let latitude = parseFloat(word1).toFixed(12);
        let longitude = parseFloat(word2).toFixed(12);
        if (latitude < 18 || latitude > 72 || longitude < -180 || longitude > -66) {
          if (Log.Debug()) console.log("[getAddress] Latitude or Longitude out of range.");
          return error;
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
        street = array[0].trim();
        zip = array[1].trim();
      }
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
      if (Log.Error()) console.log("[getAddress] Error: Unable to Parse Address");
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
    if (data.result.addressMatches.length <= 0) {
      if (Log.Warn()) console.log("[getAddress] Warning: No Address Matches: ", address);
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
  let radarStation = null;
  let resultString = "";

  let locData = await getWeatherLocationAsync();
  let lat = locData?.latitude;
  let lon = locData?.longitude;
  if (!(lat && lon)) {
    window.alert("No Location Data Available");
    if (Log.Error()) console.log("[getWeatherAsync] *** ERROR ***: No Location Data Available");
    return;
  }

  // Get Location and check cached location, ... use, update, etc.
  // check the cached forecasturl, cwa, gridId, gridX, gridY ... use, update, etc.
  // ...

  // Notes
  // -----
  // https://noaa-ghcn-pds.s3.amazonaws.com/index.html - just added
  // https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd_all.tar.gz
  // https://api.weather.gov/points/36.82565689086914%2C-83.32009887695312
  // https://api.weather.gov/gridpoints/JKL/65,16/stations
  // https://api.weather.gov/stations/${Station_ID}/observations

  // We need the GridID, GridX, GridY to get the forecast

  let stationLocationUrl = `https://api.weather.gov/points/${lat},${lon}`;
  let weatherForecastUrl = null;
  let observationStationsUrl = null;
  let response = null;

  CheckApiStatus("wk-status-nws"); // Required API and there is no roll-over

  response = await fetchCache(stationLocationUrl, null, config.longCacheTime);
  if (response && response.ok) {
    let data = await response.json();
    pointData = data;
    weatherForecastUrl = String(data.properties.forecast);
    observationStationsUrl = String(data.properties.observationStations);
    radarStation = String(data.properties.radarStation);
    let city = data.properties.relativeLocation.properties.city;
    let state = data.properties.relativeLocation.properties.state;
    let locationName = `${city}, ${state}`;
    resultString += locationName;
  } else {
    if (Log.Error()) console.log("[getWeatherAsync] *** ERROR ***: No Point Data Available");
    WeatherKittyErrorText("ERROR Location");
    return;
  }

  // Get "Featured" Observation Station ... from Stations
  // https://api.weather.gov/stations/KI35/observations

  let observationStationID = null;
  if (observationStationsUrl) {
    response = await fetchCache(observationStationsUrl, null, config.longCacheTime);
    if (response && response.ok) {
      let data = await response.json();
      stationsData = data;

      observationStationID = String(data.features[0].properties.stationIdentifier);

      resultString += `, ${observationStationID}`;
    } else {
      if (Log.Error()) console.log("[getWeatherAsync] *** ERROR ***: No Stations Data Available");
    }
  } else {
    if (Log.Error()) console.log("[getWeatherAsync] *** ERROR ***: No Observation Stations URL");
  }

  // Get Current Observation

  if (observationStationID) {
    let observationUrl = `https://api.weather.gov/stations/${observationStationID}/observations`;
    response = await fetchCache(observationUrl, null, config.obsCacheTime);
    if (response && response.ok) {
      let data = await response.json();

      observationData = data;
      let temp = data.features[0].properties.temperature.value;
      let units = data.features[0].properties.temperature.unitCode;
      temp = Fahrenheit(temp, units);
      let obs = data.features[0].properties.textDescription;

      resultString += `, ${temp} ${obs}`;
    } else {
      if (Log.Error()) console.log("[getWeatherAsync] *** ERROR ***: No Obs Data Available");
    }
  } else {
    if (Log.Error()) console.log("[getWeatherAsync] *** ERROR ***: No Observation Station ID");
  }

  // Get the forecast
  // https://api.weather.gov/gridpoints/JKL/65,16/forecast

  if (weatherForecastUrl) {
    response = await fetchCache(weatherForecastUrl, null, config.forecastCacheTime);
    if (response && response.ok) {
      let data = await response.json();
      forecastData = data;

      let temp = data.properties.periods[0].temperature;
      let units = data.properties.periods[0].temperatureUnit;
      temp = Fahrenheit(temp, units);
      let forecast = data.properties.periods[0].shortForecast;

      resultString += `, ${temp} ${forecast}`;
    } else {
      if (Log.Error()) console.log("[getWeatherAsync] *** ERROR ***: No Forecast Data Available");
    }
  } else {
    if (Log.Error()) console.log("[getWeatherAsync] *** ERROR ***: No Forecast URL");
  }

  // Call the callback function:
  // callBack(cached);
  return { pointData, stationsData, observationData, forecastData, radarStation };
}
// /Function getWeatherAsync ----------------------------------------------
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
    // if (i === 3) period.shortForecast = "Slight Chance Rain Showers then Slight Chance Rain And Snow Showers"; //  Long Text
    let leftRight = "";
    i++;
    if (i === 1) leftRight = 'class="wk-left"';
    else if (i === data.length) leftRight = 'class="wk-right"';
    text += `
      <weather-kitty-week-card>
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
      </weather-kitty-week-card>
      `;
  }
  let targets = document.getElementsByTagName("weather-kitty-week");

  for (let target of targets) {
    if (target != null) target.innerHTML = text;
  }
}

// Function ObservationCharts
async function GetObservationChartData(data) {
  let obsArray = ["timestamp"];

  if (data !== null && data !== undefined && data.length > 0) {
    let keys = Object.keys(data[0].properties);
    for (let key of keys) {
      if (key == "__proto__")
        throw new Error("[ObservationCharts] *** ERROR *** : __proto__ is not a safe type");
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
      for (let i = 0; i < data.length; i++) {
        let item = data[i]?.properties[observation];
        let timestamp = data[0]?.properties["timestamp"];
        if (item == null || item == "") {
          chartData.get(observation).push(NaN);
        } else {
          // Convert to Fahrenheit
          let value = data[i].properties[observation].value;
          let unitCode = data[i].properties[observation].unitCode;
          if (unitCode !== null && unitCode !== undefined && unitCode === "wmoUnit:degC") {
            data[i].properties[observation].value = Fahrenheit(value, "°C");
            data[i].properties[observation].unitCode = "°F";
          }
          // /Convert to Fahrenheit

          chartData.get(observation).values.push(data[i].properties[observation]);
        }
      }
    }
    if (Log.Info()) {
      let stationID = data[0].properties.station;
      stationID = stationID.substring(stationID.length - 4);

      let message = `[Observations] ${stationID}, `;
      for (let key of obsArray) {
        let unitCode = data[0].properties[key].unitCode;
        if (unitCode !== null && unitCode !== undefined)
          unitCode = unitCode.replace("wmoUnit:", "");
        message += ` ${key}`;

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
    chartData.get(observation).unitCode = data[0].properties[observation].unitCode;
    chartData.get(observation).timestamps = chartData.get("timestamp").values;
  }
  chartData.delete("timestamp");

  return chartData;
  // containers
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

// Cache Caching ------------------------------------------
// Function fetchCache(url, options, ttl)
// ... and special functions
const specialUrlTable = {
  "/weatherkittycache/location": getLocationAsync,
  "/weatherkittycache/geoip": getWeatherLocationByIPAsync,
  "/weatherkittycache/address": getWeatherLocationByAddressAsync,
};

export async function fetchCache(url, options, ttl, failTtl) {
  if (Log.Trace()) console.log(`[fetchCache] ${url}`);
  if (ttl == null || ttl < 0) ttl = config.defaultCacheTime;
  let error = new Response("Fetch Error", { status: 400, ok: false });

  // url, options, ttl, expires, expired, response
  // get expire from localStorage ... I'm avoiding IndexDB for now
  let expires = Date.now() - 3600000;
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  if (ttlCache[url] != null) expires = new Date(ttlCache[url]);
  else ttlCache[url] = 0;

  let expired = expires < Date.now();
  let cache;
  try {
    cache = await caches.open("weather-kitty");
  } catch (error) {
    config.PAUSE = true;
    if (Log.Error()) console.log(`[fetchCache] cache Error: ${error}`);
    WeatherKittyErrorText(`${error}`);
    alert(`ERROR: fetch Error ${error}.`);
  }
  let response = await cache.match(url);

  // if (response && response.ok && !expired) {  // Cached Errors are Now Allowed
  if (response && !expired) {
    if (Log.Info())
      console.log(`[fetchCache] cached: ${url} [${response.ok}] [${wkElapsedTime(expires)}]`);
    return response;
  }

  // If the url is not cached or expired, fetch it
  // If the url is in the specialUrlTable, use the special function
  let fetchResponse = null;

  if (url in specialUrlTable) {
    fetchResponse = await specialUrlTable[url](url, options, ttl);
  } else {
    await RateLimitFetch(url, config.RateLimitTtl); // rate-limit
    try {
      if (Log.Trace()) console.log(`[fetch] ${url}`);
      fetchResponse = await fetch(url, options);
    } catch (error) {
      // WeatherKittyErrorText(`${error}`); //  ... this didn't work out.
      if (Log.Error()) console.log(`[fetchCache] Fetch Error: ${url} ${error} [${failTtl}]`);
      let ErrorResponse = new Response("Fetch Error", { status: 500, ok: false, text: error });
      if (failTtl) {
        if (Log.Error()) console.log(`[fetchCache] setCache(ERROR): ${url} ${failTtl}`);
        setCache(url, ErrorResponse, failTtl);
      }
      return ErrorResponse;
    }
  }

  if (fetchResponse && fetchResponse.ok) {
    expires = Date.now() + ttl;
    if (Log.Info()) console.log(`[fetchCache] fetched: ${url} [${wkElapsedTime(expires)}]`);
    let responseClone = fetchResponse.clone();
    try {
      await cache.put(url, responseClone);
    } catch (error) {
      if (Log.Error()) console.log(`[fetchCache] Cache Error: ${error}`);
      WeatherKittyErrorText(`${error}`);
      let ErrorResponse = new Response("Cache Error", { status: 500, ok: false, text: error });
      return ErrorResponse;
    }
    // ASYNC Issue: We need to fresh read the ttlCache now that we have a rate limit.
    // this could still allow async collisions, but less so.
    ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
    if (ttlCache == null) ttlCache = {};
    ttlCache[url] = expires;
    localStorage.setItem("ttlCache", JSON.stringify(ttlCache));
    return fetchResponse;
  } else if (response) {
    if (Log.Warn()) console.log(`[fetchCache] Warning: Stale: ${url} [${wkElapsedTime(expires)}]`);
    return response;
  } else {
    if (Log.Warn()) console.log(`[fetchCache] Warning: not found: ${url}`);
    return null;
  }
}

export async function corsCache(url, options, ttl, failTtl) {
  let corsUrl = `${config.CORSProxy}${url}`;
  return fetchCache(corsUrl, options, ttl, failTtl);
}
// /Cache Caching -----------------------------------
0;

// GetHistoryChartData ------------------------------------------------
// Returns:
//    Map("TMAX", {timestamps: [timestamps], values: [{value: int, unitCode: string}]})

async function HistoryGetChartData(station, latitude, longitude) {
  let location;
  if (station) location = await HistoryGetStation(station);
  if (location?.latitude && location?.longitude) {
  } else if (latitude && longitude) {
    location = { latitude: latitude, longitude: longitude };
  } else {
    location = await getWeatherLocationAsync();
  }
  if (location && location.latitude && location.longitude) {
  } else {
    if (Log.Error()) console.log("[GetHistoryChartData] *** ERROR *** : Location Error ");
    return;
  }

  station = await HistoryGetStation(null, location.latitude, location.longitude);
  if (station?.id && station?.id.length == 11) {
  } else {
    if (Log.Error())
      console.log(`[GetHistoryChartData] *** ERROR *** : Station Error [${station?.id}]`);
    return;
  }

  let fileData;
  fileData = await HistoryGetCsvFile(station.id);

  if (fileData && fileData?.length > 0) {
  } else {
    if (Log.Error())
      console.log(`[GetHistoryChartData] *** ERROR *** : File Data Error [${station.id}]`);
    return;
  }

  // ... Process the File Data into Data Sets
  // Id, YYYYMMDD, Type, Value, Measurement-Flag, Quality-Flag, Source-Flag, OBS-TIME
  // USW00014739,19360101,TMAX, 17,,,0,2400

  // Data is a mixed hodgepodge so we have to use an array for the first read.
  let dataSets;
  dataSets = {};
  let lineCount = 0;
  for (let line of fileData) {
    lineCount++;
    let properties = line.split(",");
    let [id, date, type, val, mFlag, qFlag, sFlag, obsTime] = properties;
    if (type == "__proto__")
      throw new Error(
        `[GetHistoryChartData] *** CRITICAL *** : __proto__ is not a safe type [${station.id}]`
      );
    if (id == "ID") continue;
    if (id != null && id.length > 0) {
      if (dataSets[type] == null) {
        dataSets[type] = {};
        dataSets[type].history = true; // weather history data
        dataSets[type].timestamps = [];
        dataSets[type].values = [];
      }

      if (date != null) {
        let fDate = date.substring(0, 4) + "-" + date.substring(4, 6) + "-" + date.substring(6, 8);
        date = fDate;
        if (obsTime != null && obsTime.length > 0) {
          let time = obsTime.substring(0, 2) + ":" + obsTime.substring(2, 4) + ":00";
          date += "T" + time;
        } else {
          date += "T24:00:00";
        }
        dataSets[type].timestamps.push(date);
        let value = { value: val, unitCode: type };
        dataSets[type].values.push(value);
      } else {
        if (Log.Error())
          console.log(
            `[GetHistoryChartData] *** ERROR *** : date is null, Line: [${line}] [${station.id}] ${val} ${date}`
          );
      }
    } else if (lineCount === fileData.length) {
      // EOF
    } else {
      if (Log.Error()) {
        console.log(`[GetHistoryChartData] id is null: [${line}]`);
        console.log(`lineCount: ${lineCount} of ${fileData.length}`);
      }
    }
  }

  await microSleep(1);
  dataSets = await HistoryReformatDataSets(dataSets);
  if (Log.Info()) {
    let keys = [];
    for (let key of dataSets.keys()) keys.push(key);
    console.log(`[History] [${station.id}] ${keys.join(", ")}`);
  }

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

  // Create ALIAS
  // Create an Alias "TEMP" that used TOBS, TAVG, or an Average of TMAX and TMIN, in that order
  // Only average if TMAX and TMIN are the same length and start at the same time
  // TMXN

  let tMax = mapSets.get("TMAX");
  let tMin = mapSets.get("TMIN");
  if (tMax && tMin && tMax.timestamps.length > 1 && tMin.timestamps.length > 1) {
    let temp = { history: tMax.history, values: [], timestamps: [] };
    // TMXN - Synchronize TMAX and TMIN for mismatched sizes.
    let m = 0;
    let n = 0;
    let i = 0;
    do {
      if (tMax.timestamps[m] === tMin.timestamps[n]) {
        let avg = Math.round((tMax.values[m].value + tMin.values[n].value) / 2);
        temp.values[i] = { value: avg, unitCode: tMax.values[m].unitCode };
        temp.timestamps[i] = tMax.timestamps[m];
        i++;
        m++;
        n++;
      } else if (tMax.timestamps[m] < tMin.timestamps[n]) m++;
      else n++;
    } while (m < tMax.timestamps.length && n < tMin.timestamps.length);
    if (temp.values.length > 1) {
      mapSets.set("TMXN", temp);
    }
  }
  // /Average
  // TEMP = largest value array of TOBS, TAVG, TMAX, TMIN, TMXN
  {
    let KEY = null;
    let SIZE = 0;
    let keys = ["TOBS", "TAVG", "TMXN", "TMAX", "TMIN"];
    for (let key of keys) {
      let temp = mapSets.get(key)?.values?.length;
      if (temp > SIZE) {
        SIZE = temp;
        KEY = key;
      }
    }
    if (KEY != null) mapSets.set("TEMP", mapSets.get(KEY));
  }

  // WT**, WV** - Weather Types

  return mapSets;
}

async function HistoryConvertUnits(data, key) {
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
export async function HistoryGetStation(station, latitude, longitude, city, state) {
  return WeatherKittyIsLoading("GetStation", async () => {
    // if state is not 2-letter-state, then try to fix it ... ghcnd-states ...
    if (state && state.length != 2) {
      let result = await HistoryGetState(state);
      if (result && result.length == 2) state = result;
    }

    // ERROR BLOCK ghcnd-stations.txt
    // Why does the mobile version die on SSL and CORS errors while desktop works just fine?
    // ---
    // Get List of Stations ghcnd-stations.txt, cache it for a month?
    // https://docs.opendata.aws/noaa-ghcn-pds/readme.html
    // https://noaa-ghcn-pds.s3.amazonaws.com/index.html
    // https://noaa-ghcn-pds.s3.amazonaws.com/csv.gz/by_station/${stationId}.csv.gz
    // https://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station/${stationId}.csv

    // http://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-stations.txt
    // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt
    // https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt
    // https://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station/ACW00011604.csv
    // https://noaa-ghcn-pds.s3.amazonaws.com/csv.gz/by_station/ACW00011604.csv.gz
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

      // Doesn't Help, if it's broke it's broke.
      // if (!response || !response?.ok || response?.status !== 200) {
      //   response = await corsCache(url, null, config.archiveCacheTime);
      //   console.log("RESPONSE:", response);
      // }

      if (response && response?.ok && response?.status === 200) break;
    }

    if (!response || !response?.ok || response?.status !== 200) {
      if (Log.Error())
        console.log(
          `[HistoricalGetStation] *** ERROR *** : Network Error : No Data,  ${response?.ok} ${response?.status}, ${response?.statusText}`
        );
      return null;
    }

    // /ERROR BLOCK

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

    let result = {
      id: station,
      latitude: latitude,
      longitude: longitude,
      distance: Number.MAX_SAFE_INTEGER,
    };

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
      let distance = ManhattanDistance(latitude, longitude, location.lat, location.lon);

      let idString = "" + location.id;
      idString = idString.toLowerCase();
      let stationString = "" + station;
      stationString = stationString.toLowerCase();
      // STATION ID MATCH
      if (idString === stationString) {
        result.id = location.id;
        result.distance = 0;
        result.latitude = location.lat;
        result.longitude = location.lon;
        result.name = location.name;
        result.state = location.state;
        return result; // there should only be one match
      }
      // LOCATION DISTANCE MATCH
      // TestFL: USW000xxxxx
      else if (distance < result.distance) {
        result.id = location.id;
        result.distance = distance;
        result.latitude = location.lat;
        result.longitude = location.lon;
        result.name = location.name;
        result.state = location.state;
      }
      // CITY ONLY MATCH
      // US Cities Only  id === US*
      // Order of Preference USW, USC, US*
      // Return the first match in highest preference category
      // TestFL: USW000xxxxx
      else if (
        city &&
        (!state ||
          // Easy fix to include state!
          (state && state.toLowerCase() == location.state.toLowerCase())) &&
        location.name.toLowerCase().includes(city.toLowerCase()) &&
        location.id.substring(0, 2) === "US"
      ) {
        let locationIdSubString = location.id.substring(0, 3);
        let resultIdSubString = result?.id?.substring(0, 3);

        if (locationIdSubString === "USW" && resultIdSubString !== "USW") result.id = null;
        if (
          locationIdSubString === "USC" &&
          resultIdSubString !== "USC" &&
          resultIdSubString !== "USW"
        )
          result.id = null;

        if (!result.id) {
          result.id = location.id;
          result.distance = distance;
          result.latitude = location.lat;
          result.longitude = location.lon;
          result.name = location.name;
          result.state = location.state;
          if (locationIdSubString === "USW") break;
        }
      }
    }

    return result;
  });
}

async function HistoryGetState(state) {
  return WeatherKittyIsLoading("GetState", async () => {
    if (!state) {
      if (Log.Error()) console.log("[HistoricalGetState] *** ERROR *** : Input Argument Error");
      return null;
    }
    state = state.trim().toLowerCase();

    // https://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-states.txt
    // "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-states.txt",
    // "https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-states.txt",

    let APIs = [
      {
        url: "https://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-states.txt",
        timeout: null,
        apiTag: "wk-status-aws",
      },
      {
        url: "https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-states.txt",
        timeout: config.fetchTimeout,
        apiTag: "wk-status-ncei",
      },
      {
        url: "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-states.txt",
        timeout: config.fetchTimeout,
        apiTag: "wk-status-ncdc",
      },
    ];

    let response;
    for (let api of APIs) {
      if (!(await CheckApiStatus(api.apiTag))) continue;
      let url = api.url;
      let options = fetchTimeoutOption(api.timeout);
      response = await fetchCache(url, options, config.archiveCacheTime);

      // Doesn't Help, if it's broke it's broke.
      // if (!response || !response?.ok || response?.status !== 200) {
      //   response = await corsCache(url, null, config.archiveCacheTime);
      // }

      if (response && response?.ok && response?.status === 200) break;
    }

    let lines;
    if (response?.ok) {
      let result = await response.text();
      lines = result.split("\n");
      if (lines?.length <= 0 || lines[0].length <= 6) {
        if (Log.Error())
          console.log(
            `[HistoricalGetState] *** ERROR*** : Invalid Data or No Data,  ${response?.status}, ${response?.statusText}`
          );
        return null;
      }
    } else {
      if (Log.Error())
        console.log(
          `[HistoricalGetState] *** ERROR*** : HTTP-Error,  ${response?.ok}, ${response?.status}, ${response?.statusText}`
        );
      return null;
    }

    for (let line of lines) {
      if (!line || line.length <= 6) continue;
      let [stateCode, stateName] = line.split(" ");
      stateCode = stateCode.trim().toLowerCase();
      stateName = stateName.trim().toLowerCase();

      if (stateCode.includes(state) || stateName.includes(state)) {
        return stateCode;
      }
    }

    return null;
  });
}

// Function HistoricalGetCsvFile
async function HistoryGetCsvFile(stationId) {
  return WeatherKittyIsLoading("GetCsvFile", async () => {
    //https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt
    // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/
    // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz
    // https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.dly
    // https://noaa-ghcn-pds.s3.amazonaws.com/csv.gz/by_station/ACW00011604.csv.gz
    // https://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station/ACW00011604.csv
    let idString = stationId.toLowerCase().substring(11 - 8);

    // ERROR BLOCK .gz
    // (same as above) Why does the mobile version die on SSL and CORS errors while desktop works just fine?
    let response;
    let fileData;
    let APIs = [
      {
        url: `https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/${stationId}.csv.gz`,
        timeout: config.fetchTimeout,
        apiTag: "wk-status-ncei",
      },
      {
        url: `https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/${stationId}.csv.gz`,
        timeout: config.fetchTimeout,
        apiTag: "wk-status-ncdc",
      },
      {
        url: `https://noaa-ghcn-pds.s3.amazonaws.com/csv.gz/by_station/${stationId}.csv.gz`,
        timeout: config.fetchTimeout,
        apiTag: "wk-status-aws",
      },
      {
        url: `https://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station/${stationId}.csv`,
        timeout: config.fetchTimeout,
        apiTag: "wk-status-aws",
      },
    ];

    for (let api of APIs) {
      if (!(await CheckApiStatus(api.apiTag))) continue;
      let url = api.url;
      let options = fetchTimeoutOption(api.timeout);
      response = await fetchCache(url, null, config.historyCacheTime);

      if (response?.ok && response?.status === 200) {
        if (url.substring(url.length - 3) === ".gz") fileData = await DecompressCsvFile(response);
        else if (url.substring(url.length - 4) === ".csv") {
          fileData = await response.text();
          fileData = fileData.split("\n");
        }
      }

      // // Doesn't Help, if it's broke it's broke.
      // if (!response || !response?.ok || response?.status !== 200) {
      //   response = await corsCache(url, null, config.archiveCacheTime);
      //   console.log("RESPONSE:", response);
      //   if (response?.ok && response?.status === 200) {
      //     if (url.substring(url.length - 3) === ".gz") fileData = await DecompressCsvFile(response);
      //     else if (url.substring(url.length - 4) === ".csv") {
      //       fileData = await response.text();
      //       fileData = fileData.split("\n");
      //     }
      //   }
      // }

      if (fileData && response && response?.ok && response?.status === 200) break;
    }

    return fileData;
  });
}

// ---
// / GetHistoryChartData ------------------------------------------------

async function AssignTouchMoveToCharts(charts) {
  for (let chart of charts) {
    let element = chart.getElementsByTagName("scrollDiv")[0];
    TouchMoveAccelerated(element);
  }
}

// Run Weather Kitty
async function Main() {
  // Once upon a time there was more here.
  await WeatherKittyStart();
}

setTimeout(Main, 40);
