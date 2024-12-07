import {
  Log,
  LogLevel,
  microSleep,
  SetLocationAddress,
  WeatherKitty,
  WeatherKittyWaitOnLoad,
  WeatherKittyEnable,
  WeatherKittyIsLoading,
  getWeatherLocationAsync,
  ExpireData,
  PurgeData,
} from "../WeatherKitty.mjs";

import { RunTests } from "./test.mjs";

// --- -------------------------------------
// MAIN
// ---

// Default True
let CodeKy = true;

// Default False

let DisableWhileLoading = false;

// ---
let savedLocation = null;
await WeatherKittyEnable(false); // stop the widget and disable the initial load so we can mess with options and stuff
if (CodeKy) Log.SetLogLevel(LogLevel.Info); // cjm
await WeatherKittyEnable({ widgets: true, weather: true, history: false });
await WeatherKittyWaitOnLoad(); // this probably needs work
NavHome(null, true);
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
  if (element) element.addEventListener("click", RunTests);
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
  element = document.getElementById("HamExpire");
  if (element) element.addEventListener("click", ExpireDataFunc);
  element = document.getElementById("HamPurge");
  if (element) element.addEventListener("click", PurgeDataFunc);
  element = document.getElementById("HamTest");
  if (element) element.addEventListener("click", RunTests);
}

// FUNCTIONS -------------------------------------
// ---

async function NavToClass(classNames, InitialLoad) {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  if (!InitialLoad && (await WeatherKittyEnable().history) === false) {
    await WeatherKittyEnable({ history: true });
    await WeatherKitty();
  }
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

async function NavHome(event, initialLoad) {
  await NavToClass(["MapsAlpha", "WeekAlpha", "WeatherKittyHomeCharts"], initialLoad);
}

async function NavWeather() {
  await NavToClass(["WeatherKittyWeatherCharts"]);
}

async function NavHistory() {
  await NavToClass(["WeatherKittyHistoryCharts"]);
}

// Always go to Boston for "Boston Climate Data", StationId "USW00014739"
async function NavClimate() {
  await NavToClass(["WeatherKittyClimateCharts"]);
}

async function ExpireDataFunc() {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  ExpireData();
}

async function PurgeDataFunc() {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  PurgeData();
}
