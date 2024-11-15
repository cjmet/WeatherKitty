import {
  Log,
  LogLevel,
  SetLocationAddress,
  WeatherKitty,
  WeatherKittyWaitOnLoad,
  WeatherKittyPause,
  microSleep,
  sleep,
  WeatherKittyIsLoading,
  getWeatherLocationAsync,
  WeatherKittyErrorText,
  getWeatherLocationByAddressAsync,
  HistoryGetStation,
} from "./WeatherKitty.mjs";
let assertText = document.getElementById("assert");

// --- -------------------------------------
// MAIN
// ---

// Default True
let CodeKy = true;

// Default False
let DisableWhileLoading = false;
let Test_FubarDisplay = false;

// ---
let savedLocation = null;
WeatherKittyPause(true); // stop the widget and disable the initial load so we can mess with options and stuff
if (CodeKy) Log.SetLogLevel(LogLevel.Info); // cjm
if (!Test_FubarDisplay) {
  WeatherKittyPause(false);
  WeatherKitty();
  await WeatherKittyWaitOnLoad();
  NavHome();
} else if (Test_FubarDisplay) {
  WeatherKittyPause(false);
  NavHome(); // this forces render of hidden elements, and makes a mess of them.
  WeatherKitty();
  await WeatherKittyWaitOnLoad();
}
LoadButtons();
console.log("Demo Loaded");

// ---
// /MAIN
// --- -----------------------------------------

// BUTTONS -------------------------------------
// ---
function LoadButtons() {
  let element;
  element = document.getElementById("NavHome");
  if (element) element.addEventListener("click", NavHome);
  element = document.getElementById("NavWeather");
  if (element) element.addEventListener("click", NavWeather);
  element = document.getElementById("NavHistory");
  if (element) element.addEventListener("click", NavHistory);
  element = document.getElementById("NavClimate");
  if (element) element.addEventListener("click", NavClimate);
  element = document.getElementById("NavTest");
  if (element) element.addEventListener("click", NavTest);
  element = document.getElementById("ExpireData");
  if (element) element.addEventListener("click", ExpireData);
  element = document.getElementById("PurgeData");
  if (element) element.addEventListener("click", PurgeData);
}

// FUNCTIONS -------------------------------------
// ---

async function NavToClass(classNames) {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  if (!classNames) classNames = [];
  let classList = [
    "MapsAlpha",
    "WeekAlpha",
    "WeatherKittyHomeCharts",
    "WeatherKittyWeatherCharts",
    "WeatherKittyHistoryCharts",
    "WeatherKittyClimateCharts",
  ];
  for (let classId of classList) {
    let elements = document.getElementsByClassName(classId);
    for (let element of elements) {
      element.classList.add("hidden");
    }
  }
  for (let className of classNames) {
    let elements = document.getElementsByClassName(className);
    for (let element of elements) {
      element.classList.remove("hidden");
    }
  }
  await microSleep(1);
}

async function SaveLocation() {
  savedLocation = await getWeatherLocationAsync();
}

async function RestoreLocation() {
  let locData = await getWeatherLocationAsync();
  if (savedLocation && locData && JSON.stringify(savedLocation) !== JSON.stringify(locData)) {
    await SetLocationAddress(`${savedLocation.latitude}, ${savedLocation.longitude}`);
    WeatherKitty();
  }
  savedLocation = null;
}

async function NavHome() {
  await RestoreLocation();
  await NavToClass(["MapsAlpha", "WeekAlpha", "WeatherKittyHomeCharts"]);
}

async function NavWeather() {
  await RestoreLocation();
  await NavToClass(["WeatherKittyWeatherCharts"]);
}

async function NavHistory() {
  await RestoreLocation();
  await NavToClass(["WeatherKittyHistoryCharts"]);
}

// Always go to Boston for "Boston Climate Data", StationId "USW00014739"
async function NavClimate() {
  let locData = await getWeatherLocationAsync();
  let id = locData.id;
  if (id !== "USW00014739") {
    await SaveLocation();
    await SetLocationAddress("USW00014739");
    WeatherKitty();
  }
  await NavToClass(["WeatherKittyClimateCharts"]);
}

async function ExpireData() {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  console.log("Expiring Data");
  localStorage.clear();
}

async function PurgeData() {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  console.log("Purging Data");
  localStorage.clear();
  caches.delete("weather-kitty");
}

// -------------------------------------
// TESTING
// ---

function assert(condition, message) {
  if (!assertText) return;
  if (!condition) {
    // ✅, ☑️, ❌
    let msg = `<br>❌ <span style="color: red;">${message}</span>`;
    assertText.innerHTML += msg;
    console.error("Assertion Failed: ", message);
  } else {
    let msg = `<br>☑️ ${message}`;
    assertText.innerHTML += msg;
  }
}

async function testStationIdAddress(address, expected) {
  let result = null;
  let response = await getWeatherLocationByAddressAsync(address);
  if (response && response.ok) {
    result = await response.json();
    if (result && !result.id)
      result = await HistoryGetStation(null, result.latitude, result.longitude);
  }
  assert(result?.id === expected, `StationId "${address}"`);
}

export async function NavTest() {
  if (!assertText) return;

  Log.SetLogLevel(LogLevel.Warn);

  // "GHCND Station",   "Latitude, Longitude",   "Address, ZipCode",   "City, State",   "Address, City, State"

  await Promise.all([
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
  ]);
  if (CodeKy) Log.SetLogLevel(LogLevel.Info);
}
