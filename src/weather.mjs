// Function getWeatherAsync ----------------------------------------------
import { config } from "./config.mjs";
import { Log } from "./log.mjs";
import { CheckApiStatus } from "./checkApiStatus.mjs";
import { fetchCache } from "./fetchCache.mjs";
import { Fahrenheit } from "./functions.mjs";

/* 
// tldr: Pick 6m for alerts or 1 hour for forecasts.
//
// Cache for 6 minutes so we can setinterval for 7 minutes which is
// about half of the 15 minutes interval the weather service updates
// it's possible we would want to set this as low as 4 or 5 minutes to
// catch weather alerts, or as high as 4 hours which is the forecast interval.
*/
async function getWeatherAsync(locData) {
  let pointData = null;
  let stationsData = null;
  let observationData = null;
  let forecastData = null;
  let radarStation = null;
  let resultString = "";

  if (!locData) {
    if (Log.Error())
      throw new Error("[getWeatherAsync] *** ERROR ***: Argument Error: No Location Data Provided");
    return;
  }
  let lat = locData?.latitude;
  let lon = locData?.longitude;
  if (!(lat && lon)) {
    window.alert("Argument Error: No Location Data Provided");
    if (Log.Error())
      console.log("[getWeatherAsync] *** ERROR ***: Argument Error: No Location Data Provided");
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

// Function ObservationCharts
// data = weather?.observationData.features
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

export { GetObservationChartData, getWeatherAsync };
