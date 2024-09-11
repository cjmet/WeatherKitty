// WeatherKitty.js Version 240829.15
let WeatherKittyDebug = false;

// strict mode
("use strict");

let locCacheTime = 60000 * 5; // 5? minutes just in case we are in a car and chasing a tornado?
let shortCacheTime = 60000 * 6; // 7 (-1) minutes so we can catch weather alerts
let longCacheTime = 60000 * 60 * 24; // 24 hours
let WeatherKittyObsImage = "img/WeatherKittyE8.jpeg";
let WeatherKittyForeImage = "img/WeatherKittyC.jpeg";

// Static Status Variables

let WeatherKittyIsInit = false;
let WeatherKittyIsLoaded = false;

// Function Weather Kitty
export default WeatherKitty;
export async function WeatherKitty() {
  if (WeatherKittyIsLoaded) {
    console.log("[WeatherKitty] Already Loaded");
    return;
  }
  WeatherKittyIsLoaded = true;

  let path = "";
  let results;
  if (WeatherKittyDebug) console.log("Weather Kitty Debug Mode");
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
    console.log("*** ERROR ***: Unable to find WeatherKitty script path");
  } else {
    if (WeatherKittyDebug) console.log("[WeatherKitty] Script: ", script.src);
    let url = new URL(script.src);
    path = url.pathname;
    const lastSlashIndex = path.lastIndexOf("/");
    if (lastSlashIndex >= 0) path = path.substring(0, lastSlashIndex + 1); // Include the trailing slash
    console.log("[WeatherKitty] Path: ", path);
  }
  // /Testing

  WeatherKittyObsImage = path + WeatherKittyObsImage;
  WeatherKittyForeImage = path + WeatherKittyForeImage;

  if (WeatherKittyDebug) {
    console.log(`[WeatherKitty] Obs : ${WeatherKittyObsImage}`);
    console.log(`[WeatherKitty] Fore: ${WeatherKittyForeImage}`);
  }

  // Weather Kitty Widget
  if (WeatherKittyDebug) {
    setTimeout(WeatherWidgetInit(path), 3000);
    setTimeout(WeatherWidget, 6000);
  } else {
    setTimeout(WeatherWidgetInit(path), 5);
    setTimeout(WeatherWidget, 10);
  }

  setInterval(WeatherWidget, shortCacheTime);
}

// Function Weather Widget Initialization
function WeatherWidgetInit(path) {
  if (WeatherKittyIsInit) return;
  WeatherKittyIsInit = true;

  InjectWeatherKittyStyles(path);

  let count = 0;
  count += FindAndReplaceTags("weather-kitty", WeatherKittyWidgetBlock); // Order matters
  count += FindAndReplaceTags(
    "weather-kitty-current",
    WeatherKittyCurrentBlock
  );
  count += FindAndReplaceTags(
    "weather-kitty-forecast",
    WeatherKittyForecastBlock
  );

  if (WeatherKittyDebug)
    console.log(`[WeatherWidgetInit] Weather Kitty Widgets Found: ${count}`);
  else if (count === 0)
    console.log(
      "[WeatherWidgetInit] *** ERROR ***: Weather Kitty Widgets Not Found"
    );
}

// Function Weather Widget
function WeatherWidget() {
  getWeatherLocationAsync(function (weather) {
    // Obs Text
    {
      let text =
        weather.observationShortText +
        " " +
        weather.observationTemperature +
        weather.observationTemperatureUnit;
      let img = weather.observationIconUrl;
      let altimg = WeatherKittyObsImage;
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
      let altimg = WeatherKittyForeImage;
      WeatherSquares("weather-kitty-forecast", text, img, altimg);
    }

    // Long Forecast
    let forecast =
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
      widget.innerHTML = forecast; // cjm
    }
  });
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

    if (WeatherKittyDebug)
      console.log(`[WeatherWidget] Text: ${textDiv.innerHTML}`);
    textDiv.innerHTML = replacementText;
    if (WeatherKittyDebug)
      console.log(`[WeatherWidget] Text => ${textDiv.innerHTML}`);

    // Icon

    if (WeatherKittyDebug)
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
      else weatherImg.src = `url("img/WeatherKittyE8.png")`;
    }
    if (WeatherKittyDebug)
      console.log(`[WeatherWidget] Icon => ${weatherImg.src}`);
  }
}

// Function getWeatherLocationAsync
async function getWeatherLocationAsync(callBack) {
  let cached = { lat: null, lon: null, timestamp: null };

  // localStorage.setItem('user', JSON.stringify(userArray));
  // const userData = JSON.parse(localStorage.getItem('user'));

  cached = JSON.parse(localStorage.getItem("location"));
  console.log(`[getLocationAsync] Checking Location Data`);

  if (
    cached?.lat != null &&
    cached?.lon != null &&
    cached?.timestamp != null &&
    cached?.timestamp > Date.now() - locCacheTime
  ) {
    if (WeatherKittyDebug)
      console.log(
        `[getLocationAsync] Using cached location: ${cached.lat}, ${
          cached.lon
        }, ${cached.timestamp}, [${wkElapsedTime(
          cached.timestamp + locCacheTime
        )}]`
      );
    getWeatherAsync(cached.lat, cached.lon, callBack);
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // console.log(position);
        let lon = position.coords.longitude;
        let lat = position.coords.latitude;
        if (WeatherKittyDebug)
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
        if (WeatherKittyDebug)
          console.log(`[getLocationAsync] Error: ${error.message}`);
        if (cached?.lat != null && cached?.lon != null) {
          if (WeatherKittyDebug)
            console.log(
              `[getLocationAsync] Using cached location: ${cached.lat}, ${cached.lon}, ${cached.timestamp}`
            );
          getWeatherAsync(cached.lat, cached.lon, callBack);
        }
      }
    );
  } else {
    console.log("*** ERROR ***: Geolocation data is not available.");
  }
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
  console.log(`[getWeatherAsync] Latitude: ${lat}, Longitude: ${lon}`);
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
  if (cached === null) {
    console.log("[getWeatherAsync] No Cached Weather Data");
    cached = {
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
    };
    // localStorage.setItem("weather", JSON.stringify(cached));
  } else {
    console.log(
      `[getWeatherAsync] Cached Weather Data [${wkElapsedTime(
        cached.forecastTimeStamp + shortCacheTime
      )}]`
    );
    if (WeatherKittyDebug) console.log(cached);
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
    cached.forecastUrlTimeStamp > Date.now() - longCacheTime
  ) {
    console.log(
      `[getWeatherAsync] Using Cached Weather Url [${wkElapsedTime(
        cached.forecastUrlTimeStamp + longCacheTime
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
        if (WeatherKittyDebug) console.log(data);

        // this is not the best way to handle this, but it works for now
        if (data?.properties === null || data?.properties === undefined) {
          console.log(
            "[getWeatherAsync] *** ABORT ***: Fetch Failed: No Data Available"
          );
          return;
        }

        console.log(
          `[stationLocation] cwa: ${data.properties.cwa} GridID: ${data.properties.gridId}, GridX: ${data.properties.gridX}, GridY: ${data.properties.gridY} `
        );
        console.log(
          `[stationLocation] Relative Location: ${data.properties.relativeLocation.properties.city}, ${data.properties.relativeLocation.properties.state}`
        );
        console.log(
          `[stationLocation] Forecast URL: ${data.properties.forecast}`
        );
        weatherForecastUrl = String(data.properties.forecast);
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
    cached?.observationStationTimeStamp > Date.now() - longCacheTime
  ) {
    console.log(
      `[getWeatherAsync] Using Cached Observation Station [${wkElapsedTime(
        cached.observationStationTimeStamp + longCacheTime
      )}]`
    );
  } else if (cached?.observationStationsUrl !== "") {
    console.log("[getWeatherAsync] Fetching new Observation Station");
    await fetch(cached.observationStationsUrl)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (WeatherKittyDebug) console.log(data);

        // this is not the best way to handle this, but it works for now
        if (data?.features === null || data?.features === undefined) {
          console.log(
            "[getWeatherAsync] *** ABORT ***: Fetch Failed: No Data Available"
          );
          return;
        }

        console.log(
          `[ObservationStations] Station ID: ${data.features[0].properties.stationIdentifier}`
        );
        console.log(
          `[ObservationStations] Station Name: ${data.features[0].properties.name}`
        );
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
  } else if (cached?.observationTimeStamp > Date.now() - shortCacheTime) {
    console.log(
      `[getWeatherAsync] Using Cached Observation Data [${wkElapsedTime(
        cached.observationTimeStamp + shortCacheTime
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
        if (WeatherKittyDebug) console.log(data);

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
          cached.observationTemperature = WeatherTemperatureFahrenheit(
            cached.observationTemperature,
            cached.observationTemperatureUnit
          );
          cached.observationTemperatureUnit = "°f";
        }

        localStorage.setItem("weather", JSON.stringify(cached));
      });
  }

  // Get the forecast
  // https://api.weather.gov/gridpoints/JKL/65,16/forecast
  if (cached?.forecastTimeStamp > Date.now() - shortCacheTime) {
    console.log(
      `[getWeatherAsync] Using Cached Weather Data [${wkElapsedTime(
        cached.forecastTimeStamp + shortCacheTime
      )}]`
    );
  } else if (weatherForecastUrl !== "") {
    console.log("[getWeatherAsync] Fetching New weather Data");
    await fetch(weatherForecastUrl)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (WeatherKittyDebug) console.log(data);

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
          cached.temperature = WeatherTemperatureFahrenheit(
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
        localStorage.setItem("weather", JSON.stringify(cached));
      });
  } else {
    console.log(`[getWeatherAsync] No weatherForecastUrl available`);
  }

  // Call the callback function
  callBack(cached);
  console.log("[getWeatherAsync] Done.");
}

// Function WeatherTemperatureFahrenheit
function WeatherTemperatureFahrenheit(temperature, temperatureUnit) {
  // ((fahrenheit - 32) * 5 / 9) °F to °C;
  // celcius to fahrenheit: (celsius * 9 / 5) + 32
  let fahrenheit = -999;
  if (
    temperatureUnit == "F" ||
    temperatureUnit == "f" ||
    temperatureUnit == "°F" ||
    temperatureUnit == "°f"
  )
    fahrenheit = Math.round(temperature);
  else fahrenheit = Math.round((temperature * 9) / 5 + 32);
  if (WeatherKittyDebug)
    if (WeatherKittyDebug)
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

// Function WeatherKittyCheckPath
async function WeatherKittyCheckPath(path) {
  path = "/" + path;
  let target = path + WeatherKittyObsImage;
  let result = await fetch(target);
  if (WeatherKittyDebug)
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
    if (WeatherKittyDebug)
      console.log("[FindAndReplaceTags] innerHTML: ", htmlString);
    if (
      htmlString != undefined &&
      htmlString != null &&
      htmlString != "" &&
      htmlString.includes("<")
    ) {
      if (WeatherKittyDebug) {
        console.log("[FindAndReplaceTags] Custom HTML Detected");
      }
    } else {
      if (WeatherKittyDebug)
        console.log("[FindAndReplaceTags] Using Default CodeBlock", htmlBlock);
      widget.outerHTML = htmlBlock; // set the outer so we can include any classes or tags.
      if (className !== null && className !== undefined && className !== "")
        widget.className = className;
    }
  }
  return widgets.length;
}

// Function InjectWeatherKittyStyles
function InjectWeatherKittyStyles(path) {
  let file = path + "WeatherKitty.css";
  if (WeatherKittyDebug) console.log("[InjectWeatherKittyStyles] ", file);

  let link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = file;
  document.head.insertBefore(link, document.head.firstChild);
}

// HTML Block for Weather Kitty
let WeatherKittyCurrentBlock = `
<weather-kitty-current class="WeatherKittyBlock">  
  <weather-kitty-tooltip></weather-kitty-tooltip>
  <img src=${WeatherKittyObsImage} class="WeatherKittyImage"/>
  <span class="WeatherKittyText">text</span>
</weather-kitty-current>
`;
let WeatherKittyForecastBlock = `
<weather-kitty-forecast class="WeatherKittyBlock">
  <weather-kitty-tooltip></weather-kitty-tooltip>
  <img src=${WeatherKittyForeImage} class="WeatherKittyImage" />
  <span class="WeatherKittyText">text</span>
</weather-kitty-forecast>
`;
let WeatherKittyWidgetBlock = `
<weather-kitty class="WeatherKitty">
  <weather-kitty-current></weather-kitty-current>
  <div style="width: 0.5em;"></div>
  <weather-kitty-forecast></weather-kitty-forecast>
</weather-kitty>
`;

// Run Weather Kitty
WeatherKitty();