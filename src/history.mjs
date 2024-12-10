import { config } from "./config.mjs";
import { Log } from "./log.mjs";
import { fetchCache } from "./fetchCache.mjs";
import { CheckApiStatus, fetchTimeoutOption } from "./checkApiStatus.mjs";
import { ManhattanDistance, DecompressCsvFile, microSleep, Fahrenheit } from "./functions.mjs";

// GetHistoryChartData ------------------------------------------------
// Returns:
//    Map("TMAX", {timestamps: [timestamps], values: [{value: int, unitCode: string}]})

async function HistoryGetChartData(station, latitude, longitude) {
  // cjm
  let location;
  if (station) location = await HistoryGetStation(station);
  if (location?.latitude && location?.longitude) {
  } else if (latitude && longitude) {
    location = { latitude: latitude, longitude: longitude };
  } else {
    //   location = await getWeatherLocationAsync();
    throw new Error("[GetHistoryChartData] *** ERROR *** : Argument Error: No Location Provided ");
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
// HistoricalGetStation(station,);
// HistoricalGetStation(null, latitude, longitude);
// HistoricalGetStation(null, null, null, city);
// HistoricalGetStation(null, null, null, city, state);
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
// if state is not 2-letter-state, then try to fix it ... ghcnd-states ...

async function HistoryGetStation(station, latitude, longitude, city, state) {
  if (state && state.length != 2) {
    let result = await HistoryGetState(state);
    if (result && result.length == 2) state = result;
  }

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
}

// return state code
async function HistoryGetState(state) {
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
}

// Function HistoricalGetCsvFile
async function HistoryGetCsvFile(stationId) {
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
}

// ---
// / GetHistoryChartData ------------------------------------------------

// return list of lines
async function HistoryGetStationList() {
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

  return lines;
}

// return station id object;
// input list, (station id, city, city and state, lat and lon)
// input (list, station)
// input (list, city)
// input (list, city, state)
// input (list, lat, lon)
async function HistorySearchStationList(list, StationCityOrLat, StateOrLon) {
  let lines = list;
  let data = [];

  // overloads
  console.log("StationCityOrLat", StationCityOrLat, "StateOrLon", StateOrLon);
  let latitude = parseFloat(StationCityOrLat);
  let longitude = parseFloat(StateOrLon);
  let station = StationCityOrLat ? StationCityOrLat + "" : null;
  let city = StationCityOrLat ? StationCityOrLat + "" : null;
  let state = StateOrLon ? StateOrLon + "" : null;
  if (state && state.length != 2) {
    let tmp = await HistoryGetState(state);
    if (tmp && tmp.length == 2) state = tmp;
  }

  // /overloads

  let result = {
    id: null,
    latitude: null,
    longitude: null,
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
    if (!state && idString.includes(stationString) && location.id.substring(0, 2) === "US") {
      console.log("MATCH", station, state, "==", location.id, stationString);
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
      location.name.toLowerCase().includes(city.toLowerCase()) &&
      location.id.substring(0, 2) === "US" &&
      (!state || state.toLowerCase() == location.state.toLowerCase())
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
}

async function HistoryParseCsvFile(fileData) {
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
    console.log(`[History] ${keys.join(", ")}`);
  }

  return dataSets;
}

// prettier-ignore
export { HistoryGetChartData, HistoryGetStation, HistoryGetStationList, HistorySearchStationList, 
  HistoryGetState, HistoryGetCsvFile, HistoryParseCsvFile };
