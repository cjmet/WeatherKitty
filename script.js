import {
  Log,
  LogLevel,
  SetLocationAddress,
  WeatherKitty,
  WeatherKittyWaitOnLoad,
  WeatherKittyPause,
  sleep,
  RecalculateAllCharts,
  microSleep,
} from "./WeatherKitty.mjs";

let CodeKy = false;
let Boston = true;
let TestFubarDisplay = true;
let ClimateTest = true;

WeatherKittyPause(true); // stop the widget and disable the initial load
if (CodeKy) Log.SetLogLevel(LogLevel.Info);
if (Boston) await SetLocationAddress("USW00014739");
if (TestFubarDisplay) {
  WeatherKittyPause(false);
  WeatherKitty();
  NavHome();
  await WeatherKittyWaitOnLoad();
  if (ClimateTest) NavClimate();
  await sleep(2);
} else {
  WeatherKittyPause(false);
  WeatherKitty();
  await WeatherKittyWaitOnLoad(); // wait for the widget to load
  if (ClimateTest) NavClimate();
}

// BUTTONS -------------------------------------
// ---
{
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

async function NavToClass(classNames) {
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
  RecalculateAllCharts();
}

async function NavHome() {
  console.log("Navigating Home");
  await NavToClass(["MapsAlpha", "WeekAlpha", "WeatherKittyHomeCharts"]);
}

async function NavWeather() {
  console.log("Navigating Weather");
  await NavToClass(["WeatherKittyWeatherCharts"]);
}

async function NavHistory() {
  console.log("Navigating History");
  await NavToClass(["WeatherKittyHistoryCharts"]);
}

async function NavClimate() {
  console.log("Navigating Climate");
  await NavToClass(["WeatherKittyClimateCharts"]);
}

function ExpireData() {
  console.log("Expiring Data");
  localStorage.clear();
}

function PurgeData() {
  console.log("Purging Data");
  localStorage.clear();
  caches.delete("weather-kitty");
}
