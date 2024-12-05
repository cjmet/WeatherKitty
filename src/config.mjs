import Bowser from "https://cdn.jsdelivr.net/npm/bowser@2.11.0/+esm";
// prettier-ignore

let configFile = {};
// read config.json for api key
{
  let response;
  // prettier-ignore
  try { response = await fetch("/wkConfig.json"); } catch {}
  // prettier-ignore
  if (response && response.ok) try { configFile = await response.json(); } catch {}
  if (configFile != {}) console.log("[WeatherKitty] Config file loaded.");
}

// CONFIG ---------------------------------------------------------------
let config = {
  PAUSE: false,
  FOREVER: Number.MAX_SAFE_INTEGER / 2,
  locCacheTime: 60000 * 5, // 5? minutes just in case we are in a car and chasing a tornado?
  shortCacheTime: 60000 * 6, // 7 (-1) minutes so we can catch weather alerts
  obsCacheTime: 60000 * 10, // 10 minutes
  forecastCacheTime: 60000 * 60, // 1 hour
  mediumCacheTime: 60000 * 60 * 8, // 8 hours
  longCacheTime: 60000 * 60 * 24, // 24 hours
  historyCacheTime: 60000 * 60 * 24 * 3, // 3 days
  archiveCacheTime: 60000 * 60 * 24 * 30, // 30 days
  defaultCacheTime: 60000 * 30, // 30 minutes

  fetchTimeout: 1000 * 30, // 30 seconds
  RateLimitTtl: 6000 * 1.1, // x seconds
  StatusTtl: 1000 * 60 * 15, // About 15 minutes

  // CORS PROXY
  // https://corsproxy.io/?
  // https://cors-proxy.htmldriven.com/?url=
  // https://cors.sh/pricing

  CORSProxy: "https://corsproxy.io/?",
  // CORSApiKey: "insert key here or use ./config.json",

  ForecastMapUrl: "https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?1728599137",
  ForecastMapCacheTime: 60000 * 60 * 1, // 1 hours
  // RadarMapUrl: "https://radar.weather.gov/ridge/standard/CONUS_LARGE_loop.gif",
  RadarMapUrl: "https://radar.weather.gov/ridge/standard/CONUS_loop.gif",
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

  WeatherKittyIsInit: 0,
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
config = { ...config, ...configFile };

// /CONFIG ---------------------------------------------------------------

// HTML Blocks ----------------------------------- -------------------- ------------------------ -------------------
// ----------- ----------------------------------- -------------------- ------------------------ -------------------
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

let WeatherKittyChartBlock = `<chartSpan> Select a Chart </chartSpan><scrollDiv><canvasBounds><canvas></canvas></canvasBounds></scrollDiv>`;

// src="https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?1728599137"
let WeatherKittyMapForecastBlock = `<img alt="NWS Forecast - API Key Required" />`;

let WeatherKittyMapRadarBlock = `<img alt="NWS Radar - API Key Required" />`;

let WeatherKittyMapAlertsBlock = `<img alt="US Weather Alerts Map - API Key Required" />`;

let WeatherKittyMapLocalRadarBlock = `
<img alt="Local Radar - API Key Required" />
<div class="wk-BoxTarget"/>
`;

function WeatherKittyGeoAddressBlock() {
  let results = `<span>...</span>
  <label>Loading ... </label>
  <button>${config.SetLocationText}</button>`;
  return results;
}

let WeatherKittyStatusBlock = `
    <span>API:</span>
    <wk-status-nws></wk-status-nws>
    <wk-status-aws></wk-status-aws>
    <wk-status-ncei></wk-status-ncei>
    <wk-status-ncdc></wk-status-ncdc>
`;

// ✅, 🟢, 🔴, 🟨, 🔴, 🟡, 🟢, ✴️, ☐, ◯, ⍰, ❓, ❔, ◯, ⚪, ⚫, ⚪️, 🔘, ◻️, ⬜️, ◽️
let WeatherKittySignalBlock = `<div style="transform: rotate(180deg);">◯</div>`;

// /Blocks -----------------------------------

// EXPORT FUNCTIONS -------------------------------------------------------
// prettier-ignore
export { config, WeatherKittyCurrentBlock, WeatherKittyForecastBlock, WeatherKittyWidgetBlock, WeatherKittyChartBlock, 
  WeatherKittyMapForecastBlock,  WeatherKittyMapRadarBlock, WeatherKittyMapAlertsBlock, WeatherKittyMapLocalRadarBlock, 
  WeatherKittyGeoAddressBlock, WeatherKittyStatusBlock, WeatherKittySignalBlock
};
