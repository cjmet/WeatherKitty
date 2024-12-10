import { Log } from "./log.mjs";
import { HistoryGetState } from "./history.mjs";
import { fetchCache } from "./fetchCache.mjs";
import { CheckApiStatus } from "./checkApiStatus.mjs";
import "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js";

// You can convert state to code using the HistoryGetState();
async function GetGnisData(stateCode) {
  if (!stateCode) {
    if (Log.Error()) console.log("[GetGnisZipFile] Error: state is required");
    return null;
  }

  if (stateCode.length != 2) {
    stateCode = await HistoryGetState(stateCode);
  }

  if (!stateCode) {
    if (Log.Error()) console.log("[GetGnisZipFile] Error: state is required");
    return null;
  }

  stateCode = stateCode.toUpperCase();

  CheckApiStatus("wk-status-gnis");

  // https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_MP_Text.jpg
  // https://prd-tnm.s3.amazonaws.com/index.html?prefix=StagedProducts/GeographicNames/DomesticNames/
  // https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_AK_Text.zip
  const url = `https://prd-tnm.s3.amazonaws.com/StagedProducts/GeographicNames/DomesticNames/DomesticNames_${stateCode}_Text.zip`;
  let response = await fetchCache(url);
  if (!response || !response.ok) {
    if (Log.Error())
      console.log(
        "[GetGnisZipFile] Error: fetch for GNIS data failed:",
        response?.status,
        response?.statusText
      );
    throw new Error(response?.status + " - " + response?.statusText);
    return null;
  }
  let buffer;

  buffer = await response.arrayBuffer();
  buffer = await new Uint8Array(buffer);

  //   await fflate.unzip(buffer, (err, data) => {
  //     console.log("err", err);
  //     console.log("data", data);
  //   });

  buffer = await new Promise((resolve, reject) => {
    fflate.unzip(buffer, (err, data) => {
      if (err) {
        if (Log.Error()) console.log("[GetGnisZipFile] Decode Error", err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

  let key = `Text/DomesticNames_${stateCode}.txt`;

  if (!buffer[key]) {
    if (Log.Error()) console.log(`[GetGnisZipFile] Error: key [${key}] not found`, buffer);
    return null;
  }

  buffer = new TextDecoder("utf-8").decode(buffer["Text/DomesticNames_KY.txt"]);

  return buffer;
}

// ---

async function SearchGnisLocation(fileData, locationString) {
  if (!fileData) {
    if (Log.Error()) console.log("[SearchGnisLocation] Error: fileData is required");
    return null;
  }
  if (!locationString) {
    if (Log.Error()) console.log("[SearchGnisLocation] Error: locationString is required");
    return null;
  }

  fileData = fileData.toLowerCase();
  fileData = fileData.replace(/\r/g, "");
  fileData = fileData.split("\n");

  locationString = locationString.toLowerCase().trim();

  let matchData = null;
  let locationStrings = locationString.split(" ");
  for (let searchString of locationStrings) {
    searchString = searchString.trim();
    let newFileData = [];
    for (let line of fileData) {
      let records = line.split("|");
      if (records[1]?.includes(searchString)) {
        newFileData.push(line);
      }
    }
    if (newFileData?.length > 0) {
      fileData = newFileData;
      matchData = newFileData;
    }
  }

  // exact match
  for (let match of matchData) {
    let records = match.split("|");
    if (records && records[1] === locationString) return [match];
  }

  return matchData;
}

// ---

async function FormatGnisData(GnisData) {
  if (!GnisData?.length > 0) {
    if (Log.Error()) console.log("[FormatGnisData] Error: GnisData is required");
    return null;
  }

  let records = [];
  for (let record of GnisData) {
    let data = record.split("|");
    let feature = {
      feature_id: data[0],
      feature_name: data[1],
      feature_class: data[2],
      state_name: data[3],
      state_numeric: data[4],
      county_name: data[5],
      county_numeric: data[6],
      map_name: data[7],
      date_created: data[8],
      date_edited: data[9],
      bgn_type: data[10],
      bgn_authority: data[11],
      bgn_date: data[12],
      prim_lat_dms: data[13],
      prim_long_dms: data[14],
      prim_lat_dec: data[15],
      prim_long_dec: data[16],
      source_lat_dms: data[17],
      source_long_dms: data[18],
      source_lat_dec: data[19],
      source_long_dec: data[20],
    };

    records.push(feature);
  }

  return records;
}

// ---

async function GetGnisLocationData(locationString, stateCode) {
  let gnisData = await GetGnisData(stateCode);
  let searchResults = await SearchGnisLocation(gnisData, locationString);
  let formattedData = await FormatGnisData(searchResults);
  return formattedData;
}

async function GetGnisStation(locationString, stateCode, verbose) {
  let gnisData = await GetGnisData(stateCode);
  let searchResults = await SearchGnisLocation(gnisData, locationString);
  let formattedData = await FormatGnisData(searchResults);

  if (Log.Verbose() || verbose) console.log("[GNIS] formattedData", formattedData);

  let location = formattedData[0];
  let station = {};

  station.id = location.feature_id;
  station.latitude = parseFloat(location.prim_lat_dec);
  station.longitude = parseFloat(location.prim_long_dec);
  station.state = location.state_name;
  station.name = location.feature_name;
  station.county = location.county_name;
  station.map = location.map_name;
  return station;
}

export { GetGnisData, SearchGnisLocation, FormatGnisData, GetGnisLocationData, GetGnisStation };
