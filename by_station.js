import "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js";
import WeatherKittyStart, {
  config,
  CreateChart,
  fetchCache,
  getLocationAsync,
  getWeatherLocationAsync,
} from "./WeatherKitty.mjs";

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
// /Logging

// ---

// HistoricalWeatherCharts ------------------------------------------------
// ---
async function HistoricalWeatherCharts() {
  Log.SetLogLevel(LogLevel.Info);

  let location;
  let data;
  location = await getLocationAsync();
  if (location && location.ok) {
    data = await location.json();
    if (data && data.latitude && data.longitude) {
      if (Log.Debug()) console.log("[HistoricalWeatherCharts] Location: Ok");
    } else {
      if (Log.Error())
        console.log(
          "[HistoricalWeatherCharts] *** ERROR *** : Location Data Error "
        );
      return;
    }
  } else {
    if (Log.Error())
      console.log("[HistoricalWeatherCharts] *** ERROR *** : Location Error ");
    return;
  }

  let station;
  station = await HistoricalGetStation(data.latitude, data.longitude);
  if (station?.id && station?.id.length == 11) {
    if (Log.Debug()) console.log(`[HistoricalWeatherCharts] Station: Ok`);
  } else {
    if (Log.Error())
      console.log("[HistoricalWeatherCharts] *** ERROR *** : Station Error ");
    return;
  }

  let fileData;
  fileData = await HistoricalGetCsvFile(station.id);
  if (fileData && fileData?.length > 0) {
    if (Log.Debug()) console.log(`[HistoricalWeatherCharts] fileDataCheck: Ok`);
    // ...
  } else {
    if (Log.Error())
      console.log("[HistoricalWeatherCharts] *** ERROR *** : File Data Error ");
    return;
  }

  // ... what's next ???
  // ... Process the File Data into Data Sets
  // Id, YYYYMMDD, Type, Value, Measurement-Flag, Quality-Flag, Source-Flag, OBS-TIME
  // USW00014739,19360101,TMAX, 17,,,0,2400
  let dataSets = {};
  let lineCount = 0;
  for (let line of fileData) {
    lineCount++;
    let properties = line.split(",");
    let [id, date, type, val, mFlag, qFlag, sFlag, obsTime] = properties;
    if (type == "__proto__")
      throw new Error(
        "[HistoricalWeatherCarts] *** CRITICAL *** : __proto__ is not a safe type"
      );
    if (id != null && id.length > 0) {
      if (dataSets[type] == null) {
        if (Log.Debug()) console.log(`Adding Type: ${type}`);
        dataSets[type] = {};
        dataSets[type].timestamps = [];
        dataSets[type].values = [];
      }

      if (date != null) {
        dataSets[type].timestamps.push(date);
        dataSets[type].values.push(val);
      } else {
        if (Log.Error())
          console.log(
            `[HistoricalWeatherCarts] *** ERROR *** : date is null: [${line}]`
          );
      }
    } else if (lineCount === fileData.length) {
      if (Log.Debug()) console.log("EOL");
    } else {
      if (Log.Error()) {
        console.log(`[HistoricalWeatherCarts] id is null: [${line}]`);
        console.log(`lineCount: ${lineCount} of ${fileData.length}`);
      }
    }
  }
  let dataString = "";
  for (let key in dataSets) {
    dataString += key + ", ";
  }
  // count un-named objects
  if (Log.Info())
    console.log(
      `[HistoricalWeatherCarts] DataSets[${
        Object.values(dataSets).length
      }] - ${dataString}`
    );
  // if (Log.Trace())
  console.log(dataSets);
}

// ---

// Function HistoricalGetStation
async function HistoricalGetStation(latitude, longitude) {
  if (Log.Info()) console.log("[HistoricalGetStation] Start");
  if (latitude == null || longitude == null) {
    if (Log.Error())
      console.log("[HistoricalGetStation] *** ERROR *** : Location Error ");
    return null;
  }

  // Get List of Stations ghcnd-stations.txt, cache it for a month?
  // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt
  let response = await fetchCache(
    "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt",
    null,
    config.archiveCacheTime,
    true
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
  let nearestStation = { distance: Number.MAX_SAFE_INTEGER };

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
    if (distance < nearestStation.distance) {
      nearestStation = location;
      nearestStation.distance = distance;
    }
  }

  if (Log.Info())
    console.log(
      `[HistoricalGetStation] ${nearestStation?.id} - ${
        nearestStation?.name
      }, ${nearestStation?.state} - ${nearestStation?.distance.toFixed(4)}`
    );
  if (Log.Trace()) console.log(nearestStation);
  return nearestStation;
}

// Function HistoricalGetCsvFile
async function HistoricalGetCsvFile(stationId) {
  //https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt
  // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/
  // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz
  let url = `https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/${stationId}.csv.gz`;
  let response = await fetchCache(url, null, config.longCacheTime, true);
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
      console.log("Decompression Complete");
    }

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
// / HistoricalWeatherCharts ------------------------------------------------

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
  let dy = lat2 - lat1;
  let dx = lon2 - lon1;
  let distance = Math.abs(dy) + Math.abs(dx);
  return distance;
}
// ---
// /Math Functions --------------------------------------------------------

if (false) {
  const MAXWIDTH = 32000; // this value is a CONSTANT.  The chart breaks if it's too big.
  let MaxHeight = 640; // this value is visual
  let PixelsPerDataPoint = 4; // this value is visual
  let AverageTheChart = true; // Truncate the chart when we run out of pixels, or average data together to fit on the chart

  let response = await fetch("./files/USW00014739.csv");
  if (response.ok) {
    let result = await response.text();
    let lines = result.split("\n");
    // Id, YYYYMMDD, Type, Value, Measurement-Flag, Quality-Flag, Source-Flag, OBS-TIME
    // USW00014739,19360101,TMAX, 17,,,0,2400
    // first 10 and last 10 lines

    let types = [];
    let data = [];
    for (let line of lines) {
      let properties = line.split(",");
      let [id, date, type, val, mFlag, qFlag, sFlag, obsTime] = properties;
      if (id != null && id.length > 0) {
        if (types.indexOf(type) === -1) {
          types.push(type);
          data[type] = {};
          data[type].timestamps = [];
          data[type].values = [];
        }

        if (date != null) {
          let fDate =
            date.substring(0, 4) +
            "-" +
            date.substring(4, 6) +
            "-" +
            date.substring(6, 8) +
            "T24:00:00";
          let tmp = {};
          tmp.value = fDate;

          data[type].timestamps.push(fDate);
          tmp.value = val;
          data[type].values.push(tmp);
        } else {
          console.log(`date is null: [${line}]`);
        }
      }
    }

    console.log(`READ: lines: ${lines.length}, result: ${result.length}`);
    console.log(types);
    console.log(data);

    // Fit to Chart.  Either Average it or Truncate it or Both.
    let MaxLength = MAXWIDTH / PixelsPerDataPoint;
    if (AverageTheChart && data["TMAX"]?.values?.length > 0) {
      let divisor = Math.ceil(data["TMAX"].values.length / MaxLength);
      console.log(
        `divisor: ${data["TMAX"].values.length} / ${MaxLength} = ${divisor}`
      );
      if (divisor <= 1) {
        let newKvp = {}; // Time/Value Pair
        newKvp.values = [];
        newKvp.timestamps = [];
        let newValues = [];
        let newTimestamps = [];
        for (let key = 0; key < data["TMAX"].values.length; key++) {
          if (key % divisor === 0 && key > 0) {
            newKvp.values.push(MathAverage(newValues));
            newKvp.timestamps.push(newTimestamps[0]);
            newValues = [];
            newTimestamps = [];
          }
          newValues.push(data["TMAX"].values[key].value);
          newTimestamps.push(data["TMAX"].timestamps[key]);
        }
        if (newValues.length > 0) {
          newKvp.values.push(MathAverage(newValues));
          newKvp.timestamps.push(newTimestamps[0]);
        }
        data["TMAX"].values = [];
        for (let value of newKvp.values) {
          data["TMAX"].values.push({ value: value });
        }
        data["TMAX"].timestamps = newKvp.timestamps;
      }
      console.log(`result: ${data["TMAX"].values.length} `);
    }

    // Fit to Chart.  Either Average it or Truncate it or Both.
    if (data["TMAX"].values > MaxLength) {
      data["TMAX"].values = data["TMAX"].values.slice(-MaxLength);
      data["TMAX"].timestamps = data["TMAX"].timestamps.slice(-MaxLength);
    }
    let width = MAXWIDTH;
    let height = MaxHeight;
    let aspect = width / height;
    console.log(
      `Chart: data: ${data["TMAX"]?.values?.length}, width: ${width}, height: ${height}, aspect: ${aspect}`
    );
    let element = document.createElement("div");
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.border = "3px solid black";
    let canvas = document.createElement("canvas");
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.border = "3px solid red";
    element.appendChild(canvas);
    document.body.appendChild(element);

    // CreateChart(chartContainer, key, values, timestamps);
    // console.log("Timestamps: ", data["TMAX"].timestamps);
    // console.log("Values: ", data["TMAX"].values);

    CreateChart(
      element,
      "TMAX",
      data["TMAX"].values,
      data["TMAX"].timestamps,
      aspect,
      "history"
    );
  } else {
    console.log("HTTP-Error: " + response.status);
  }
}

if (false) {
  //https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt
  // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/
  // https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz
  let response = await fetch(
    "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz"
  );

  // let sleep = await new Promise((r) => setTimeout(r, 1000));
  console.log(response);
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
        console.log("chunk was encoded with GZIP, Zlib, or DEFLATE");
        utfDecode.push(chunk, final);
      });

      for await (const chunk of blob_compressed.stream()) {
        TotalSize += chunk.length;
        console.log(`TotalSize[35]: ${chunk.length} += ${TotalSize}`);
        dcmpStrm.push(chunk);
      }

      console.log(`TotalSize[38]: ${TotalSize}`);
      // console.log(`stringData:`, stringData);
      console.log(`stringData: ${stringData.length}`);
      result = stringData;
    } catch (e) {
      console.log("*** ERROR *** - Decompression Error: " + e);
    } finally {
      console.log("Decompression Complete");
    }

    let lines = result.split("\n");
    let firstLines = lines.slice(0, 5);
    let lastLines = lines.slice(-5);
    console.log(`result: ${result.length}, lines: ${lines.length}`);
    console.log(firstLines, lastLines);
  } else {
    console.log("HTTP-Error: " + response.status);
  }
}

HistoricalWeatherCharts();
