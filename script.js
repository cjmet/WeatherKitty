import {
  Log,
  LogLevel,
  SetLocationAddress,
  WeatherKitty,
  WeatherKittyIsLoaded,
  WeatherKittyPause,
  sleep,
} from "./WeatherKitty.mjs";
// LogLevel.Info - Default Level, summary of what's happening
// LogLevel.Trace - adds LOADING DELAYS, and other detailed information

// Load custom Config first, then startup.
if (true) {
  WeatherKittyPause(true);
  Log.SetLogLevel(LogLevel.Info);
  await SetLocationAddress("USW00014739");
  WeatherKittyPause(false);
}

if (false) {
  await WeatherKittyIsLoaded();
  await sleep(1);
  WeatherKitty();
}

// Alternative Way to do the above, but it loads default first, then sets the location and reloads
if (false) {
  await WeatherKittyIsLoaded();
  console.log("Weather Kitty is loaded!");
  await SetLocationAddress("USW00014739");
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

export function NavHome() {
  console.log("Navigating Home");
  NavToClass(["MapsAlpha", "WeekAlpha", "WeatherKittyHomeCharts"]);
}

export function NavWeather() {
  console.log("Navigating Weather");
  NavToClass(["WeatherKittyWeatherCharts"]);
}

export function NavHistory() {
  console.log("Navigating History");
  NavToClass(["WeatherKittyHistoryCharts"]);
}
