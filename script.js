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
  getWeatherLocationByAddressAsync,
  HistoryGetStation,
  ExpireData,
  PurgeData,
} from "./WeatherKitty.mjs";

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
if (CodeKy) Log.SetLogLevel(LogLevel.Debug);
WeatherKittyPause(false);
if (Test_FubarDisplay) NavHome(); // this order forces render of hidden elements, and makes a mess of them, hence the extensive testing and refactoring.
WeatherKitty();
await WeatherKittyWaitOnLoad();
NavHome();
LoadButtons();

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
  element = document.getElementById("NavExpire");
  if (element) element.addEventListener("click", ExpireDataFunc);
  element = document.getElementById("NavPurge");
  if (element) element.addEventListener("click", PurgeDataFunc);

  element = document.getElementById("HamHome");
  if (element) element.addEventListener("click", NavHome);
  element = document.getElementById("HamWeather");
  if (element) element.addEventListener("click", NavWeather);
  element = document.getElementById("HamHistory");
  if (element) element.addEventListener("click", NavHistory);
  element = document.getElementById("HamClimate");
  if (element) element.addEventListener("click", NavClimate);
  element = document.getElementById("HamTest");
  if (element) element.addEventListener("click", NavTest);
  element = document.getElementById("HamExpire");
  if (element) element.addEventListener("click", ExpireDataFunc);
  element = document.getElementById("HamPurge");
  if (element) element.addEventListener("click", PurgeDataFunc);
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

async function ExpireDataFunc() {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  console.log("Expiring Data");
  ExpireData();
}

async function PurgeDataFunc() {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  console.log("Purging Data");
  PurgeData();
}
