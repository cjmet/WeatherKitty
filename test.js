import {
  Log,
  LogLevel,
  config,
  DecompressCsvFile,
  getWeatherLocationByAddressAsync,
  HistoryGetStation,
  fetchCache,
  corsCache,
  wkElapsedTime,
  fetchTimeoutOption,
  assert,
} from "./WeatherKitty.mjs";

// -------------------------------------
// TESTING
// ---
let assertText = document.getElementById("WK-assert");
let statusText = document.getElementById("WK-status");

async function testStationIdAddress(address, expected) {
  let result = null;
  let response = await getWeatherLocationByAddressAsync(address);
  if (response && response.ok) {
    result = await response.json();
    if (result && !result.id)
      result = await HistoryGetStation(null, result.latitude, result.longitude);
  }
  await assert(`StationId "${address}"`, result?.id === expected, assertText);
}

// -------------------------------------

async function TestNWSAPI() {
  // TestAPI
  assert(
    "NWS Points API",
    await (async () => {
      let result = await fetchCache(
        "https://api.weather.gov/points/36.82565689086914%2C-83.32009887695312",
        fetchTimeoutOption(1000 * 30),
        config.shortCacheTime
      );
      if (result && result.ok) {
        let json = await result.json();
        return json?.properties?.cwa === "JKL";
      }
      return false;
    })(),
    assertText
  );
  // /assert

  assert(
    "NWS Observations KI35 API",
    await (async () => {
      let result = await fetchCache(
        "https://api.weather.gov/stations/KI35/observations",
        fetchTimeoutOption(1000 * 30),
        config.shortCacheTime
      );
      if (result && result.ok) {
        let json = await result.json();
        return (
          json?.features?.length >= 1 &&
          json?.features[0]?.properties?.station === "https://api.weather.gov/stations/KI35"
        );
      }
      return false;
    })(),
    assertText
  );
  // /assert

  assert(
    "NWS Forecast JKL API",
    await (async () => {
      let result = await fetchCache(
        "https://api.weather.gov/gridpoints/JKL/65,16/forecast",
        fetchTimeoutOption(1000 * 30),
        config.shortCacheTime
      );
      if (result && result.ok) {
        let json = await result.json();
        return (
          json?.properties?.periods.length >= 1 &&
          json?.properties?.periods[0]?.shortForecast.length >= 1
        );
      }
      return false;
    })(),
    assertText
  );
  // /assert
}

// -------------------------------------

async function TestGhcndStationStates() {
  let response;
  let urls = [
    "https://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-stations.txt",
    "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt",
    "https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt",
    "https://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-states.txt",
    "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-states.txt",
    "https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-states.txt",
  ];

  for (let url of urls) {
    response = await fetchCache(url, fetchTimeoutOption(1000 * 30), config.archiveCacheTime);
    assert(url, response && response.ok && response.status === 200, assertText);
    if (!response || !response?.ok || response?.status !== 200) {
      response = await corsCache(url, null, config.archiveCacheTime);
      assert(url, response && response.ok && response.status === 200, assertText);
    }
  }
}

// -------------------------------------

async function TestGhcndCsv() {
  let stationId;
  // stationId = "USC00153622"; // Harlan, KY
  stationId = "USW00014739"; // Boston, MA
  let response;
  let fileData;
  let lastDate;
  let urls = [
    `https://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station/${stationId}.csv`,
    `https://noaa-ghcn-pds.s3.amazonaws.com/csv.gz/by_station/${stationId}.csv.gz`,
    `https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/${stationId}.csv.gz`,
    `https://www.ncei.noaa.gov/pub/data/ghcn/daily/by_station/${stationId}.csv.gz`,
  ];

  for (let url of urls) {
    fileData = null;
    lastDate = null;
    response = await fetchCache(url, fetchTimeoutOption(1000 * 30), config.archiveCacheTime);
    assert(url, response && response.ok && response.status === 200, assertText);
    if (response?.ok && response?.status === 200) {
      if (url.substring(url.length - 3) === ".gz") fileData = await DecompressCsvFile(response);
      else if (url.substring(url.length - 4) === ".csv") {
        fileData = await response.text();
        fileData = fileData.split("\n");
      }
    }
    lastDate = await getLastWeatherDate(fileData);
    assert(
      `FileData: [${fileData?.length}] [${lastDate}] ${url}`,
      fileData && fileData.length > 0,
      assertText
    );

    if (!response || !response?.ok || response?.status !== 200 || fileData?.length < 1) {
      fileData = null;
      response = await corsCache(url, null, config.archiveCacheTime);
      assert(url, response && response.ok && response.status === 200, assertText);
      if (response?.ok && response?.status === 200) {
        if (url.substring(url.length - 3) === ".gz") fileData = await DecompressCsvFile(response);
        else if (url.substring(url.length - 4) === ".csv") {
          fileData = await response.text();
          fileData = fileData.split("\n");
        }
      }
      lastDate = await getLastWeatherDate(fileData);
      assert(
        `FileData: [${fileData?.length}] [${lastDate}] ${url}`,
        fileData && fileData.length > 0,
        assertText
      );
    }
  }
}

async function getLastWeatherDate(fileData) {
  if (!fileData || fileData.length < 1) return null;
  let lastDate = null;
  for (let line of fileData) {
    if (line.length < 1) continue;
    let parts = line.split(",");
    if (parts.length < 3) continue;
    let date = parseInt(parts[1]);
    if (date.length < 8) continue;
    if (!lastDate || date > lastDate) lastDate = date;
  }
  return lastDate;
}

async function TestMapsCache() {
  let response;
  let urls = [config.ForecastMapUrl, config.RadarMapUrl, config.AlertsMapUrl];

  for (let url of urls) {
    response = await corsCache(url, null, config.archiveCacheTime);
    assert(`Maps: ${url}`, response && response.ok && response.status === 200, assertText);
    let corsUrl = `${config.CORSProxy}${url}`;
  }
}

export async function RunTests() {
  if (!assertText) return;

  console.log("Running Tests ...");
  assertText.innerHTML = "<b><h3>Running Tests</h3></b>";

  let savedLogLevel = Log.GetLogLevel();
  Log.SetLogLevel(LogLevel.Info);

  // ------------------------------------------------------------------------------------------------------- //
  // ------------------------------------------------------------------------------------------------------- //
  // Tests
  // ---

  await Promise.all([
    // "GHCND Station",   "Latitude, Longitude",   "Address, ZipCode",   "City, State",   "Address, City, State"

    testStationIdAddress("138.04638208053878, -84.49714266224647", undefined),
    testStationIdAddress("asdf"),
    testStationIdAddress("USW00014739", "USW00014739"), // Boston, MA
    testStationIdAddress("US1KYFY0009", "US1KYFY0009"),
    testStationIdAddress("100, 40507", undefined),
    testStationIdAddress("100 main, 40831", "USC00150450"),
    testStationIdAddress("100 main, 40507", "US1KYFY0009"),
    testStationIdAddress("100 main, lexington, ky", "US1KYFY0009"),
    testStationIdAddress("boston, ma", "USW00014739"),
    testStationIdAddress("lexington, ky", "USW00093820"),
    testStationIdAddress("100 main, Miami, Fl", undefined),
    testStationIdAddress("USC00085653", "USC00085653"),
    testStationIdAddress("111 NW 1st St, Miami, FL", "USC00085653"),
    testStationIdAddress("38.04638208053878, -84.49714266224647", "US1KYFY0009"),

    TestNWSAPI(),

    TestGhcndStationStates(),

    TestGhcndCsv(),

    TestMapsCache(),
  ]);

  // ---
  // / Tests
  // ------------------------------------------------------------------------------------------------------- //
  // ------------------------------------------------------------------------------------------------------- //

  Log.SetLogLevel(savedLogLevel);
  assertText.innerHTML += "<br><b><h3>Tests Completed.</h3></b>";
  console.log("Tests Completed.");
}
