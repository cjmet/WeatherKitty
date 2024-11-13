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
} from "./WeatherKitty.mjs";

// --- -------------------------------------
// MAIN
// ---

// Default True
let CodeKy = false;
// Log.SetLogLevel(LogLevel.Debug);

// Default False
let DisableWhileLoading = false;
let Test_FubarDisplay = false;

let savedLocation = null;
WeatherKittyPause(true); // stop the widget and disable the initial load
if (CodeKy) Log.SetLogLevel(LogLevel.Info);
if (!Test_FubarDisplay) {
  WeatherKittyPause(false);
  WeatherKitty();
  await WeatherKittyWaitOnLoad();
  NavHome();
}
if (Test_FubarDisplay) {
  WeatherKittyPause(false);
  NavHome();
  WeatherKitty();
  await WeatherKittyWaitOnLoad();
}
LoadButtons();
// WeatherKittyErrorText("Demo Loaded");
console.log("Demo Loaded");
await SetLocationAddress("Harlan, Ky");

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
  element = document.getElementById("ExpireData");
  if (element) element.addEventListener("click", ExpireData);
  element = document.getElementById("PurgeData");
  if (element) element.addEventListener("click", PurgeData);
}

// FUNCTIONS -------------------------------------
// ---

async function NavToClass(classNames) {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  // console.log("NavToClass: ", classNames);
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
  if (
    savedLocation &&
    locData &&
    JSON.stringify(savedLocation) !== JSON.stringify(locData)
  ) {
    await SetLocationAddress(
      `${savedLocation.latitude}, ${savedLocation.longitude}`
    );
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
