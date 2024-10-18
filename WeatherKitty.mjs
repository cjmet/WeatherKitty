let WeatherKittyDebug = 3; // 10 = off, 0 = trivial, 1 = trace, 2 = info, 3 = warn, 4 = error, 5 = fatal
// import "./node_modules/chart.js/dist/chart.umd.js";
import "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";

// strict mode
("use strict");

if (WeatherKittyDebug == 0) WeatherKittyDebug = 10;
let config = {
  FATAL: false,
  FOREVER: Number.MAX_SAFE_INTEGER / 2,
  locCacheTime: 60000 * 5, // 5? minutes just in case we are in a car and chasing a tornado?
  shortCacheTime: 60000 * 6, // 7 (-1) minutes so we can catch weather alerts
  longCacheTime: 60000 * 60 * 24, // 24 hours
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
};

// Function Weather Kitty
export default WeatherKitty;
export async function WeatherKitty() {
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

  // Testing

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
      `[WeatherKitty] WARNING: Unable to find WeatherKitty script path in:\n[${window.location.pathname}]`
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
  // /Testing

  config.WeatherKittyObsImage = path + config.WeatherKittyObsImage;
  config.WeatherKittyForeImage = path + config.WeatherKittyForeImage;

  if (WeatherKittyDebug <= 2) {
    console.log(`[WeatherKitty] Obs : ${config.WeatherKittyObsImage}`);
    console.log(`[WeatherKitty] Fore: ${config.WeatherKittyForeImage}`);
  }

  // Weather Kitty Widget
  if (WeatherKittyDebug <= 2) {
    setTimeout(WeatherWidgetInit(path), 3000);
    setTimeout(WeatherWidget, 6000);
  } else {
    setTimeout(WeatherWidgetInit(path), 5);
    setTimeout(WeatherWidget, 10);
  }

  setInterval(WeatherWidget, config.shortCacheTime);
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
    console.log(`[WeatherWidgetInit] Elements Found: ${count}`);
    return true;
  } else {
    console.log(
      "[WeatherWidgetInit] WARNING: Weather Kitty Elements Not Found"
    );
    config.FATAL = true;
    return false;
  }
}

// Function Weather Widget
function WeatherWidget() {
  if (config.FATAL) return;
  getWeatherLocationAsync(function (weather) {
    // Obs Text
    {
      let text =
        weather.observationShortText +
        " " +
        weather.observationTemperature +
        weather.observationTemperatureUnit;
      let img = weather.observationIconUrl;
      let altimg = config.WeatherKittyObsImage;
      WeatherSquares("weather-kitty-current", text, img, altimg);
    }

    // Forecast Text
    {
      let text =
        findWeatherWords(weather.shortForecast) +
        "<br>" +
        weather.probabilityOfPrecipitation +
        "% " +
        weather.temperature +
        weather.temperatureUnit;
      let img = weather.forecastIconUrl;
      let altimg = config.WeatherKittyForeImage;
      WeatherSquares("weather-kitty-forecast", text, img, altimg);
    }

    // Long Forecast
    let forecast =
      `<b>${weather.geoLocationName}</b><br><br>` +
      "<b>Current:</b><br>" +
      weather.observationShortText +
      " " +
      weather.observationTemperature +
      weather.observationTemperatureUnit +
      "<br>" +
      '<div id="weatherspacer"><br> </div>' +
      "<b>Forecast:</b> <br>" +
      weather.shortForecast +
      " " +
      weather.temperature +
      weather.temperatureUnit +
      "<br>" +
      weather.probabilityOfPrecipitation +
      "% precipitation<br>" +
      '<div id="weatherspacer"><br></div>' +
      weather.detailedForecast;
    // + "<br>" + weather.forecastStartTime;
    let widgets = document.getElementsByTagName("weather-kitty-tooltip");
    for (let widget of widgets) {
      // widget.setAttribute("tooltip", forecast);
      widget.innerHTML = forecast;
    }

    // "Chargoggagoggmanchauggagoggchaubunagungamaugg, MA";
    widgets = document.getElementsByTagName("weather-kitty-geoaddress");
    for (let widget of widgets) {
      let span = widget.getElementsByTagName("span")[0];
      let button = widget.getElementsByTagName("button")[0];
      span.innerHTML = weather.geoLocationName;
      button = RemoveAllEventListeners(button);
      button.addEventListener("click", () => {
        getWeatherLocationByAddressAsync(WeatherWidget);
      });
    }

    // Charting
    // barometricPressure, dewpoint, heatIndex, precipitationLastHour, precipitationLast3Hours, precipitationLast6Hours, relativeHumidity, temperature, visibility, windChill, windGust, windSpeed,
    ObservationCharts(weather.observationData);

    // Forecast Matrix
    ForecastMatrix(weather.forecastData);
  });
}

// Function getWeatherLocationAsync
async function getWeatherLocationAsync(callBack) {
  let cached = { lat: null, lon: null, timestamp: null };

  // localStorage.setItem('user', JSON.stringify(userArray));
  // const userData = JSON.parse(localStorage.getItem('user'));

  cached = JSON.parse(localStorage.getItem("location"));
  //  console.log(
  //   `[getWeatherAsync] Cached Weather Data [${wkElapsedTime(
  //     cached.forecastTimeStamp + config.shortCacheTime
  //   )}]`
  // );
  let elapsed;
  if (cached?.timestamp == null) elapsed = "n/a";
  else if (cached?.timestamp >= config.FOREVER) elapsed = "never expires";
  else elapsed = wkElapsedTime(cached?.timestamp + config.locCacheTime);
  console.log(`[getLocationAsync] Checking Location Data [${elapsed}]`);

  if (
    cached?.lat != null &&
    cached?.lat != "undefined" &&
    cached?.lon != null &&
    cached?.lon != "undefined" &&
    cached?.timestamp !== null &&
    cached?.timestamp > Date.now() - config.locCacheTime
  ) {
    if (WeatherKittyDebug <= 2)
      console.log(
        `[getLocationAsync] Using cached location: ${cached.lat}, ${
          cached.lon
        }, ${cached.timestamp}, [${wkElapsedTime(
          cached.timestamp + config.locCacheTime
        )}]`
      );
    getWeatherAsync(cached.lat, cached.lon, callBack);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (WeatherKittyDebug <= 2) console.log(position);
        let lon = position.coords.longitude;
        let lat = position.coords.latitude;
        if (WeatherKittyDebug <= 2)
          console.log(`[getLocationAsync] Latitude: ${lat}, Longitude: ${lon}`);
        localStorage.setItem(
          "location",
          JSON.stringify({
            lat: String(lat),
            lon: String(lon),
            timestamp: Date.now(),
          })
        );
        getWeatherAsync(lat, lon, callBack);
      },

      (error) => {
        console.log(`[getLocationAsync] Error: ${error.message}`);
        if (
          cached?.lat != null &&
          cached?.lon != null &&
          cached?.lat != "undefined" &&
          cached?.lon != "undefined"
        ) {
          console.log(
            `[getLocationAsync] Using cached location: ${cached.lat}, ${cached.lon}, ${cached.timestamp}`
          );
          getWeatherAsync(cached.lat, cached.lon, callBack);
        } else {
          getWeatherLocationByIPAsync(callBack);
        }
      }
    );
  } else {
    console.log("[getLocationAsync] Error: Geolocation data is not available.");
    getWeatherLocationByIPAsync(callBack);
  }
}

// Function getWeatherLocationByIPAsync {
async function getWeatherLocationByIPAsync(callBack) {
  let cached = { lat: null, lon: null, timestamp: null };

  cached = JSON.parse(localStorage.getItem("location"));
  console.log(`[getLocationByIP] Checking IP Location Data`);

  // n/c - non-commercial use only
  // Site             Limits    Limit/Mth Limit/Day Limit/Min
  // ip-api.com/json  http n/c  75000     2500      45
  // ipapi.com                  100       ---       ---
  // ipapi.co/json              30000     967       0.5
  let locationUrl = "http://ipapi.co/json/";
  await fetch(locationUrl)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (WeatherKittyDebug <= 2) console.log(data);
      let lon = data.longitude ? data.longitude : data.lon;
      let lat = data.latitude ? data.latitude : data.lat;
      if (WeatherKittyDebug <= 2)
        console.log(`[getLocationByIP] Latitude: ${lat}, Longitude: ${lon}`);
      if (
        lat === null ||
        lat === undefined ||
        lon === null ||
        lon === undefined
      ) {
        console.log(
          "[getLocationByIP] *** ABORT *** : No Location Data Available"
        );
        return;
      }
      localStorage.setItem(
        "location",
        JSON.stringify({
          lat: String(lat),
          lon: String(lon),
          timestamp: Date.now(),
        })
      );
      getWeatherAsync(lat, lon, callBack);
    });
}

// Function getWeatherLocationByAddressAsync
// https://geocoding.geo.census.gov/geocoder/locations/address?street=4600+Silver+Hill+Rd&city=Washington&state=DC&zip=20233&benchmark=Public_AR_Current&format=json
async function getWeatherLocationByAddressAsync(callBack) {
  let address = prompt('"Address, City, State" or "Address, ZipCode"');
  if (address === null || address === "") {
    console.log("[getAddress] No Address.");
    let cached = JSON.parse(localStorage.getItem("location"));
    // manually set location does not expire, aka config.FOREVER
    // if it's currently manually set, then clear it.
    if (cached?.timestamp >= config.FOREVER) {
      console.log("Clearing Cache and Reloading.");
      localStorage.removeItem("location");
      localStorage.removeItem("weather");
      await new Promise((r) => setTimeout(r, 1000)); // sleep for 1 second
      getWeatherLocationAsync(callBack);
    }
    return;
  }
  console.log(`[getAddress] "${address}"`);

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
      console.log("[getAddress] Error: Unable to Parse Address");
      return;
  }

  let locationUrl = `https://corsproxy.io/?https://geocoding.geo.census.gov/geocoder/locations/address?street=${street}`;
  if (city !== "") locationUrl += `&city=${city}`;
  if (state !== "") locationUrl += `&state=${state}`;
  if (zip !== "") locationUrl += `&zip=${zip}`;
  locationUrl += `&benchmark=Public_AR_Current&format=json`;

  await fetch(
    locationUrl
    // { mode: "cors" }  // 'cors', 'no-cors', 'same-origin', 'navigate'. 'no-cors' means we can't access it in javascript, so we have to fix this.
  )
    .then(
      (response) => {
        console.log("[getAddress] Response: ", response);
        return response.json();
      },
      (error) => {
        console.log(`[getAddress] Error: ${error.message}`);
        return;
      }
    )
    .then((data) => {
      console.log("[getAddress] ", data);
      if (data.result.addressMatches.length <= 0) {
        console.log("[getAddress] Error: No Address Matches");
        return;
      }
      let lat = data.result.addressMatches[0].coordinates.y;
      let lon = data.result.addressMatches[0].coordinates.x;
      let location = data.result.addressMatches[0].matchedAddress;
      console.log(
        `[getAddress] Location: ${location}', 'Latitude: ${lat}, Longitude: ${lon}`
      );
      if (
        lat === null ||
        lat === undefined ||
        lon === null ||
        lon === undefined
      ) {
        console.log("[getAddress] Error: No Lat/Lon Data Available");
        return;
      } else {
        console.log("[getAddress] Attempting to get weather data");
        // Force Expire the Cache
        // Disable Location Expire
        localStorage.setItem(
          "location",
          JSON.stringify({
            lat: lat,
            lon: lon,
            timestamp: config.FOREVER,
          })
        );
        localStorage.removeItem("weather");
        getWeatherAsync(lat, lon, callBack);
      }
    });
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
async function getWeatherAsync(lat, lon, callBack) {
  if (WeatherKittyDebug <= 2)
    console.log(`[getWeatherAsync] Latitude: ${lat}, Longitude: ${lon}`);
  if (lat == null || lon == null) {
    console.log("[getWeatherAsync] *** ABORT ***: No Location Data Available");
    return;
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

  // localStorage.setItem('user', JSON.stringify(userArray));
  // const userData = JSON.parse(localStorage.getItem('user'));

  // Read Local Storage, if note available, create it
  let cached = JSON.parse(localStorage.getItem("weather"));
  if (cached == null) {
    console.log("[getWeatherAsync] No Cached Weather Data");
    cached = {
      geoLocationName: "",
      forecastUrl: "",
      forecastUrlTimeStamp: "",
      shortForecast: "",
      forecastIconUrl: "",
      temperature: "",
      temperatureUnit: "",
      probabilityOfPrecipitation: "",
      detailedForecast: "",
      forecastStartTime: "",
      forecastTimeStamp: "",

      observationStationsUrl: "",
      observationStationID: "",
      observationStationName: "",
      observationStationTimeStamp: "",

      observationTimeStamp: "",
      observationShortText: "",
      observationIconUrl: "",
      observationTemperature: "",
      observationTemperatureUnit: "",

      // Data Structures for more complex usage
      observationData: [],
      forecastData: [],
    };
    // localStorage.setItem("weather", JSON.stringify(cached));
  } else {
    console.log(
      `[getWeatherAsync] Cached Weather Data [${wkElapsedTime(
        cached.forecastTimeStamp + config.shortCacheTime
      )}]`
    );
    if (WeatherKittyDebug <= 2) console.log(cached);
  }

  // Deal with Cache-ing of Weather Data
  /* 
  var myHeaders = new Headers();
  myHeaders.append('pragma', 'no-cache');
  myHeaders.append('cache-control', 'no-cache');

  var myInit = {
    method: 'GET',
    headers: myHeaders,
  };
  */

  /* 
  {
    headers: {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    }
  }
  */

  // Get the forecast URL
  let weatherForecastUrl = "";
  if (
    cached.forecastUrl !== null &&
    cached.forecastUrlTimeStamp > Date.now() - config.longCacheTime
  ) {
    console.log(
      `[getWeatherAsync] Using Cached Weather Url [${wkElapsedTime(
        cached.forecastUrlTimeStamp + config.longCacheTime
      )}]`
    );
    weatherForecastUrl = cached.forecastUrl;
  } else {
    console.log("[getWeatherAsync] Fetching New Weather Url");
    let stationLocationUrl = `https://api.weather.gov/points/${lat},${lon}`;
    await fetch(stationLocationUrl)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (WeatherKittyDebug <= 2) console.log(data);

        // this is not the best way to handle this, but it works for now
        if (data?.properties === null || data?.properties === undefined) {
          console.log(
            "[getWeatherAsync] *** ABORT ***: Fetch Failed: No Data Available"
          );
          return;
        }

        if (WeatherKittyDebug <= 2) {
          console.log(
            `[stationLocation] cwa: ${data.properties.cwa} GridID: ${data.properties.gridId}, GridX: ${data.properties.gridX}, GridY: ${data.properties.gridY} `
          );
          console.log(
            `[stationLocation] Relative Location: ${data.properties.relativeLocation.properties.city}, ${data.properties.relativeLocation.properties.state}`
          );
          console.log(
            `[stationLocation] Forecast URL: ${data.properties.forecast}`
          );
        }
        weatherForecastUrl = String(data.properties.forecast);
        let city = data.properties.relativeLocation.properties.city;
        let state = data.properties.relativeLocation.properties.state;
        let locationName = `${city}, ${state}`;

        cached.geoLocationName = locationName;
        cached.forecastUrl = String(weatherForecastUrl);
        cached.observationStationsUrl = String(
          data.properties.observationStations
        );
        cached.forecastUrlTimeStamp = Date.now();
        localStorage.setItem("weather", JSON.stringify(cached));
      });
  }

  // Get "Featured" Observation Station ... from Stations
  // https://api.weather.gov/stations/KI35/observations
  if (
    cached?.observationStationsUrl !== null &&
    cached?.observationStationTimeStamp > Date.now() - config.longCacheTime
  ) {
    console.log(
      `[getWeatherAsync] Using Cached Observation Station [${wkElapsedTime(
        cached.observationStationTimeStamp + config.longCacheTime
      )}]`
    );
  } else if (cached?.observationStationsUrl !== "") {
    console.log("[getWeatherAsync] Fetching new Observation Station");
    await fetch(cached.observationStationsUrl)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (WeatherKittyDebug <= 2) console.log(data);

        // this is not the best way to handle this, but it works for now
        if (data?.features === null || data?.features === undefined) {
          console.log(
            "[getWeatherAsync] *** ABORT ***: Fetch Failed: No Data Available"
          );
          return;
        }

        if (WeatherKittyDebug <= 2) {
          console.log(
            `[ObservationStations] Station ID: ${data.features[0].properties.stationIdentifier}`
          );
          console.log(
            `[ObservationStations] Station Name: ${data.features[0].properties.name}`
          );
        }
        cached.observationStationID = String(
          data.features[0].properties.stationIdentifier
        );
        cached.observationStationName = String(
          data.features[0].properties.name
        );
        cached.observationStationTimeStamp = Date.now();
        localStorage.setItem("weather", JSON.stringify(cached));
      });
  }

  // Get Current Observation
  if (cached?.observationStationID === "") {
    console.log("[getWeatherAsync] No Observation Station ID available");
  } else if (
    cached?.observationTimeStamp >
    Date.now() - config.shortCacheTime
  ) {
    console.log(
      `[getWeatherAsync] Using Cached Observation Data [${wkElapsedTime(
        cached.observationTimeStamp + config.shortCacheTime
      )}]`
    );
    /* ... */
  } else {
    console.log("[getWeatherAsync] Fetching New Observation Data");
    let observationUrl = `https://api.weather.gov/stations/${cached.observationStationID}/observations`;
    await fetch(observationUrl)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (WeatherKittyDebug <= 2) console.log(data);

        // this is not the best way to handle this, but it works for now
        if (data?.features === null || data?.features === undefined) {
          console.log(
            "[getWeatherAsync] *** ABORT ***: Fetch Failed: No Data Available"
          );
          return;
        }

        cached.observationTimeStamp = Date.now();
        cached.observationShortText = String(
          data.features[0].properties.textDescription
        );
        if (
          data.features[0].properties.icon !== null &&
          data.features[0].properties.icon !== ""
        )
          cached.observationIconUrl = String(data.features[0].properties.icon);
        else cached.observationIconUrl = "";

        // Temperature, read it first, then convert it to Fahrenheit
        {
          cached.observationTemperature = String(
            data.features[0].properties.temperature.value
          );
          cached.observationTemperatureUnit = String(
            data.features[0].properties.temperature.unitCode
          ).replace(/wmoUnit\:deg/i, "");
          cached.observationTemperature = Fahrenheit(
            cached.observationTemperature,
            cached.observationTemperatureUnit
          );
          cached.observationTemperatureUnit = "°f";
        }

        // Intercept Historical Observation Data for Charting
        cached.observationData = data.features;
        if (WeatherKittyDebug <= 2) console.log(data);

        localStorage.setItem("weather", JSON.stringify(cached));
      });
  }

  // Get the forecast
  // https://api.weather.gov/gridpoints/JKL/65,16/forecast
  if (cached?.forecastTimeStamp > Date.now() - config.shortCacheTime) {
    console.log(
      `[getWeatherAsync] Using Cached Weather Data [${wkElapsedTime(
        cached.forecastTimeStamp + config.shortCacheTime
      )}]`
    );
  } else if (weatherForecastUrl !== "") {
    console.log("[getWeatherAsync] Fetching New weather Data");
    await fetch(weatherForecastUrl)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (WeatherKittyDebug <= 2) console.log(data);

        // this is not the best way to handle this, but it works for now
        if (
          data?.properties?.periods === null ||
          data?.properties?.periods === undefined
        ) {
          console.log(
            "[getWeatherAsync] *** ABORT ***: Fetch Failed: No Data Available"
          );
          return;
        }

        cached.shortForecast = String(data.properties.periods[0].shortForecast);

        // Temperature, read it first, then convert it to Fahrenheit
        {
          cached.temperature = String(data.properties.periods[0].temperature);
          cached.temperatureUnit = String(
            data.properties.periods[0].temperatureUnit
          );
          cached.temperature = Fahrenheit(
            cached.temperature,
            cached.temperatureUnit
          );
          cached.temperatureUnit = "°f";
        }

        let rain = data.properties.periods[0].probabilityOfPrecipitation.value;
        if (rain === null || rain === undefined || rain === "") {
          rain = 0;
        }
        cached.probabilityOfPrecipitation = String(rain);
        cached.detailedForecast = String(
          data.properties.periods[0].detailedForecast
        );
        cached.forecastIconUrl = String(data.properties.periods[0].icon);
        cached.forecastStartTime = String(data.properties.periods[0].startTime);
        cached.forecastTimeStamp = Date.now();

        // Intercept forecast data for matrix
        cached.forecastData = data.properties.periods;
        console.log("[INTERCEPT] Intercepting forecast Data");
        console.log(cached.forecastData);

        localStorage.setItem("weather", JSON.stringify(cached));
      });
  } else {
    console.log(`[getWeatherAsync] No weatherForecastUrl available`);
  }

  // Call the callback function:
  callBack(cached);
  console.log("[getWeatherAsync] Done.");
}

function ForecastMatrix(data) {
  if (data == null || data.length === 0) {
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
    if (WeatherKittyDebug <= 2)
      console.log("[FindAndReplaceTags] innerHTML: ", htmlString);
    if (
      htmlString != undefined &&
      htmlString != null &&
      htmlString != "" &&
      htmlString.includes("<")
    ) {
      if (WeatherKittyDebug <= 2)
        console.log("[FindAndReplaceTags] Custom HTML Detected");
    } else {
      if (WeatherKittyDebug <= 2)
        console.log("[FindAndReplaceTags] Using Default CodeBlock");
      if (WeatherKittyDebug <= 2) console.log(htmlBlock);
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

let WeatherKittyMapForecastBlock = `<img
            src="https://www.wpc.ncep.noaa.gov/noaa/noaad1.gif?1728599137"
            alt="NOAA Forcast"
            onclick="AIshowFullscreenImage(this)"
        />`;

let WeatherKittyMapRadarBlock = `<img
            src="https://radar.weather.gov/ridge/standard/CONUS-LARGE_loop.gif"
            alt="NOAA Radar"
            onclick="AIshowFullscreenImage(this)"
          />`;

let WeatherKittyMapAlertsBlock = `          <img
            src="https://www.weather.gov/wwamap/png/US.png"
            alt="US Weather Alerts Map"
            onclick="AIshowFullscreenImage(this)"
          />`;

function WeatherKittyLocationBlock() {
  let results = `<span></span>
  <button>Set</button>`;
  return results;
}

// Run Weather Kitty
WeatherKitty();
