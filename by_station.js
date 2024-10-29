import "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js";
import WeatherKittyStart, {
  Log,
  LogLevel,
  CreateChart,
} from "./WeatherKitty.mjs";

Log.SetLogLevel(LogLevel.Debug);

async function experiments() {
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
}

experiments();
