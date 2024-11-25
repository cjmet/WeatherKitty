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
  SetLogLevel(level, silent) {
    Log.LogLevel = level;
    if (!silent) console.log(`[WeatherKittyLog] LogLevel: ${Log.GetLogLevelText()}`);
  },
  GetLogLevel() {
    return Log.LogLevel;
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
  Test: () => {
    return LogLevel.Warn >= Log.LogLevel;
  },
};
// /Logging

// CONFIG ---------------------------------------------------------------
let config = {
  PAUSE: false,
  FOREVER: Number.MAX_SAFE_INTEGER / 2,
  locCacheTime: 60000 * 5, // 5? minutes just in case we are in a car and chasing a tornado?
  shortCacheTime: 60000 * 6, // 7 (-1) minutes so we can catch weather alerts
  obsCacheTime: 60000 * 10, // 10 minutes
  forecastCacheTime: 60000 * 60, // 1 hour
  longCacheTime: 60000 * 60 * 24, // 24 hours
  archiveCacheTime: 60000 * 60 * 24 * 30, // 30 days
  defaultCacheTime: 60000 * 30, // 30 minutes

  fetchTimeout: 1000 * 30, // 30 seconds
  RateLimitTtl: 6000 * 1.1, // x seconds
  StatusTtl: 1000 * 60 * 15, // About 15 minutes

  CORSProxy: "https://corsproxy.io/?", // CORS Proxy "https://corsproxy.io/?" or "" for no-proxy

  ForecastMapUrl: "https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?1728599137",
  ForecastMapCacheTime: 60000 * 60 * 1, // 1 hours
  RadarMapUrl: "https://radar.weather.gov/ridge/standard/CONUS-LARGE_loop.gif",
  RadarMapCacheTime: 60000 * 10, // 10 minutes
  AlertsMapUrl: "https://www.weather.gov/wwamap/png/US.png",
  AlertsMapCacheTime: 60000 * 10, // 10 minutes

  SetLocationText: "Set Location",

  KvpTimers: new Map(),

  // These only apply to the HISTORY charts
  CHARTMAXWIDTH: 32000, // this is a constant, more will crash chart.js and/or the browser

  ChartTrimDefault: { weather: "average", history: "truncate" }, // truncate, reverse, average,
  ChartPixelsPerPointDefault: {
    auto: 4,
    default: 4,
    small: 4,
    medium: 14,
    large: 24,
  },
  ChartMaxPointsDefault: 510, // "Auto", 510, or Int.  "Calc" = Math.Floor(config.CHARTMAXWIDTH / ChartPixelsPerPoint),
  ChartAspectDefault: 2.7,
  ChartHeightPuntVh: 66, // in vh   The charts were hidden or failed or errored out.

  maxWidth: 30720,
  maxHeight: 17280,
  defaultWidth: 1920,
  defaultHeight: 1080,

  // /History

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
  WeatherKittyIsLoaded: 0,
  WeatherWidgetIsLoaded: false,
  WeatherKittyPath: "",

  SanityChecks: function () {
    if (config.ChartMaxPointsDefault === "Calc" || config.ChartMaxPointsDefault === "calc")
      config.ChartMaxPointsDefault = Math.floor(
        config.CHARTMAXWIDTH / config.ChartPixelsPerPointDefault["default"]
      );
    if (config.shortCacheTime < 60000) config.shortCacheTime = 60000;
    if (config.longCacheTime < 60000) config.longCacheTime = 60000;
    if (config.defaultCacheTime < 60000) config.defaultCacheTime = 60000;
    if (config.locCacheTime < 60000) config.locCacheTime = 60000;
    if (config.ForecastMapCacheTime < 60000) config.ForecastMapCacheTime = 60000;
    if (config.RadarMapCacheTime < 60000) config.RadarMapCacheTime = 60000;
    if (config.AlertsMapCacheTime < 60000) config.AlertsMapCacheTime = 60000;
  },
};

// /CONFIG ---------------------------------------------------------------

// FUNCTIONS

function GetPixels(pxString) {
  let pixels;
  pxString = pxString.toLowerCase();
  if (pxString.includes("px")) pixels = parseFloat(pxString.replace("px", ""));
  return pixels;
}

function AddPixels(array) {
  let pixels = 0;
  for (let px of array) {
    pixels += GetPixels(px);
  }
  let result = pixels.toFixed(2);
  return result;
}

async function DecompressCsvFile(response) {
  let fileData;
  // let sleep = await new Promise((r) => setTimeout(r, 1000));
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

    let utfDecode;
    let dcmpStrm;
    try {
      Chunks = [];

      let stringData = "";
      utfDecode = new fflate.DecodeUTF8((data, final) => {
        stringData += data;
      });
      dcmpStrm = new fflate.Decompress((chunk, final) => {
        utfDecode.push(chunk, final);
      });

      for await (const chunk of blob_compressed.stream()) {
        TotalSize += chunk.length;
        dcmpStrm.push(chunk);
      }

      result = stringData;
    } catch (e) {
      console.log("*** ERROR *** - Decompression Error: " + e);
      WeatherKittyErrorText(`Decompression Error: ${e}`);
      return null;
    }

    fileData = result.split("\n");
    if (!fileData || fileData.length <= 0) {
      if (Log.Error())
        console.log("[HistoricalGetCsvFile] *** ERROR *** : fileData Error, No Data ");

      return null;
    }
  } else if (Log.Error()) console.log("HTTP-Error: " + response.status);

  return fileData;
}

// Function sleep();
async function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function microSleep(milliSeconds) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}

// Move one page per 4em of movement, Intended for extra large content on touch devices
// GEMINI AI - then completely re-written.  It's 95% mine now.
async function TouchMoveAccelerated(element) {
  let lastX;
  let lastY;
  let isDragging = false;
  let oneEm = parseFloat(window.getComputedStyle(element).fontSize);
  let pageSizeY = element.offsetHeight;
  let pageSizeX = element.offsetWidth;
  if (pageSizeX < 4 * oneEm) pageSizeX = 4 * oneEm;
  if (pageSizeY < 4 * oneEm) pageSizeY = 4 * oneEm;

  element.addEventListener("touchstart", (event) => {
    isDragging = true;
    lastX = null;
    lastY = null;
  });

  element.addEventListener("touchend", () => {
    isDragging = false;
    lastX = null;
    lastY = null;
  });

  // Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) <= 1;
  // element.scrollHeight > element.clientHeight;
  // let AccelY = (element.offsetHeight ) / (4 * oneEm);
  element.addEventListener("touchmove", (event) => {
    event.preventDefault();
    if (isDragging) {
      let x = event.touches[0].clientX; // X
      let dx = x - lastX;
      if (lastX !== null) {
        if (
          dx < 0 &&
          Math.abs(element.scrollWidth - element.clientWidth - element.scrollLeft) > 1
        ) {
          let accelX = Math.max(1, element.offsetWidth / (4 * oneEm));
          element.scrollBy(-dx * accelX, 0); // touch is backwards
        } else if (dx > 0 && element.scrollLeft > 1) {
          let accelX = Math.max(1, element.offsetWidth / (4 * oneEm));
          element.scrollBy(-dx * accelX, 0); // touch is backwards
        } else {
          window.scrollBy(-dx, 0); // touch is backwards
        }
      }
      lastX = x;

      let y = event.touches[0].clientY; // Y
      let dy = y - lastY;
      if (lastY !== null) {
        if (
          dy < 0 &&
          Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) > 1
        ) {
          let accelY = Math.max(1, element.offsetHeight / (4 * oneEm));
          element.scrollBy(0, -dy * accelY); // touch is backwards
        } else if (dy > 0 && element.scrollTop > 1) {
          let accelY = Math.max(1, element.offsetHeight / (4 * oneEm));
          element.scrollBy(0, -dy * accelY); // touch is backwards
        } else {
          window.scrollBy(0, -dy); // touch is backwards
        }
      }
      lastY = y;
    }
  });
}

// Math Functions ---------------------------------------------------------
// ---

// Gemni AI
function isValidNumericString(s) {
  const regex = /^-?\d+(,\d+)*(\.\d+)?$/;
  return regex.test(s);
}

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

// Function WeatherTemperatureFahrenheit
// .replace(/wmoUnit\:deg/i, "")
function Fahrenheit(temperature, temperatureUnit) {
  // ((fahrenheit - 32) * 5 / 9) °F to °C;
  if (temperature === null || temperature === undefined || temperature === "") return NaN;
  // celcius to fahrenheit: (celsius * 9 / 5) + 32
  let fahrenheit = -999;
  temperatureUnit = temperatureUnit.toLowerCase();
  temperatureUnit = temperatureUnit.replace(/wmoUnit\:deg/i, "");
  if (temperatureUnit === "f" || temperatureUnit === "°f") fahrenheit = Math.round(temperature);
  else if (temperatureUnit == "c" || temperatureUnit === "°c")
    fahrenheit = Math.round((temperature * 9) / 5 + 32);
  else if (Log.Verbose()) console.log(`Warning: Invalid Temperature Unit: ${temperatureUnit}`);

  return fahrenheit;
}

// Function Elapsed Time
function wkElapsedTime(startTime) {
  let endTime = new Date();
  let elapsed = startTime - endTime;
  let seconds = (elapsed / 1000).toFixed(0);
  let minutes = (seconds / 60).toFixed(0);
  let hours = (minutes / 60).toFixed(0);

  seconds = seconds % 60;
  minutes = minutes % 60;

  if (Math.abs(hours) >= 1) return `${hours}h`; // DOH! It's 1 hour even
  if (Math.abs(minutes) >= 1) return `${minutes}m`;
  if (Math.abs(seconds) >= 1) return `${seconds}s`;

  // console.log(`${hours}h ${minutes}m ${seconds}s ${elapsed}ms`);
  return `${elapsed}ms`;
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
  return result;
}

// Function WeatherKittyCheckPath
async function WeatherKittyCheckPath(path) {
  path = "/" + path;
  let target = path + config.WeatherKittyObsImage;
  let result = await fetch(target);
  if (result.ok) return path;
  else return null;
}

function IsMobileByBowser() {
  const parser = Bowser.getParser(navigator.userAgent);
  return parser.getPlatformType() === "mobile";
}

function isMobile() {
  if (!config.isMobile) config.isMobile = IsMobileByBowser();
  return config.isMobile;

  // // additional ways to detect mobile; but all, including bowser, have issues.
  // if (window.innerWidth < 450 || window.innerHeight < 450) return true;
  // if ("ontouchstart" in window) return true;
  // // Gemini AI, Chat GPT
  // {
  //   let userAgent = navigator.userAgent.toLowerCase();
  //   if (
  //     /mobile|tablet|ipad|ipod|phone|mobi|android|iphone|ipod|opera mini|iemobile|webos/i.test(
  //       userAgent
  //     )
  //   )
  //     return true;
  // }

  // return false;
}

function ExpireData() {
  localStorage.clear("ttlCache");
  return true;
}

async function PurgeData() {
  console.log("PurgeData");
  localStorage.clear("ttlCache");
  caches.delete("weather-kitty");
  return true;
}

async function clearCache(url) {
  console.log("clearCache");
  let cache = await caches.open("weather-kitty");
  await cache.delete(url);
}

async function setCache(url, response, ttl) {
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  ttlCache[url] = Date.now() + ttl;
  localStorage.setItem("ttlCache", JSON.stringify(ttlCache));

  let cache = await caches.open("weather-kitty");
  await cache.put(url, response);
}

async function getCache(url) {
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  let ttl = ttlCache[url];

  let cache = await caches.open("weather-kitty");
  let response = await cache.match(url);
  return { url: url, ttl: ttl, response: response };
}

// HTML Blocks -----------------------------------
// functions instead of variables, so that path updates to the images can take effect
function WeatherKittyCurrentBlock() {
  let results = `<weather-kitty-tooltip>
    <weather-kitty-geoaddress></weather-kitty-geoaddress>
    <p></p>
  </weather-kitty-tooltip>
  <img src="${config.WeatherKittyObsImage}" class="WeatherKittyImage"/>
  <clip><span class="WeatherKittyText">Loading . . .</span><clip>`; // cj-clip-span
  return results;
}

function WeatherKittyForecastBlock() {
  let results = `<weather-kitty-tooltip>
    <weather-kitty-geoaddress></weather-kitty-geoaddress>
    <p></p>
  </weather-kitty-tooltip>
  <img src="${config.WeatherKittyForeImage}" class="WeatherKittyImage" />
  <clip><span class="WeatherKittyText">Loading . . .</span></clip>`; // cj-clip-span
  return results;
}

let WeatherKittyWidgetBlock = `<weather-kitty-tooltip >
    <weather-kitty-geoaddress></weather-kitty-geoaddress>
    <p></p>
  </weather-kitty-tooltip>
  <weather-kitty-current></weather-kitty-current>
  <div style="width: 0.5em;"></div>
  <weather-kitty-forecast></weather-kitty-forecast>`;

let WeatherKittyChartBlock = `<chartSpan>Loading ...</chartSpan><scrollDiv><canvasBounds><canvas></canvas></canvasBounds></scrollDiv>`;

// src="https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?1728599137"
let WeatherKittyMapForecastBlock = `<img alt="NWS Forecast" />`;

let WeatherKittyMapRadarBlock = `<img alt="NWS Radar" />`;

let WeatherKittyMapAlertsBlock = `<img alt="US Weather Alerts Map" />`;

let WeatherKittyMapLocalRadarBlock = `<img alt="Local Radar" />`;

function WeatherKittyGeoAddressBlock() {
  let results = `<span>Loading ...</span>
  <label>Loading ... </label>
  <button>${config.SetLocationText}</button>`;
  return results;
}

let WeatherKittyStatusBlock = `
    <span>API:</span>
    <wk-status-nws></wk-status-nws>
    <wk-status-ncei></wk-status-ncei>
    <wk-status-ncdc></wk-status-ncdc>
    <wk-status-aws></wk-status-aws>
`;

let WeatherKittySignalBlock = "❔";

// /Blocks -----------------------------------

// EXPORT FUNCTIONS -------------------------------------------------------
// prettier-ignore
export { Log, LogLevel, config, GetPixels, AddPixels, DecompressCsvFile, sleep, microSleep, TouchMoveAccelerated, isValidNumericString, MathAverage, 
  MathDistance, ManhattanDistance, Fahrenheit, wkElapsedTime, BadHyphen, getWidthInEm, WeatherKittyCheckPath, isMobile, IsMobileByBowser, ExpireData, 
  PurgeData, clearCache, setCache, getCache, WeatherKittyCurrentBlock, WeatherKittyForecastBlock, WeatherKittyWidgetBlock, WeatherKittyChartBlock, 
  WeatherKittyMapForecastBlock, WeatherKittyMapRadarBlock, WeatherKittyMapAlertsBlock, WeatherKittyMapLocalRadarBlock, WeatherKittyGeoAddressBlock,
  WeatherKittyStatusBlock, WeatherKittySignalBlock,
};
