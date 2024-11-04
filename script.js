import {
  Log,
  LogLevel,
  SetLocationAddress,
  WeatherKitty,
  WeatherKittyWaitOnLoaded,
  WeatherKittyPause,
  sleep,
  config,
} from "./WeatherKitty.mjs";

let LoadFirst = true; // else reload after initial load.
if (LoadFirst) {
  WeatherKittyPause(true); // stop the widget and disable the initial load
  Log.SetLogLevel(LogLevel.Info);
  await SetLocationAddress("USW00014739");
  WeatherKittyPause(false); // re-enable the widget
  WeatherKitty(); // initialize the widget
} else {
  // Alternative Way to do the above, but it loads default first, then sets the location and reloads
  Log.SetLogLevel(LogLevel.Info);
  await WeatherKittyWaitOnLoaded();
  console.log("Weather Kitty is loaded!");
  await SetLocationAddress("USW00014739");
  WeatherKitty(); // reload the widget
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
  element = document.getElementById("ExpireData");
  if (element) element.addEventListener("click", ExpireData);
  element = document.getElementById("PurgeData");
  if (element) element.addEventListener("click", PurgeData);
}

function NavToClass(classNames) {
  let classList = [
    "MapsAlpha",
    "WeekAlpha",
    "WeatherKittyHomeCharts",
    "WeatherKittyWeatherCharts",
    "WeatherKittyHistoryCharts",
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
}

function NavHome() {
  console.log("Navigating Home");
  NavToClass(["MapsAlpha", "WeekAlpha", "WeatherKittyHomeCharts"]);
}

function NavWeather() {
  console.log("Navigating Weather");
  NavToClass(["WeatherKittyWeatherCharts"]);
}

function NavHistory() {
  console.log("Navigating History");
  NavToClass(["WeatherKittyHistoryCharts"]);
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
