import {
  Log,
  LogLevel,
  SetLocationAddress,
  WeatherKitty,
  WeatherKittyWaitOnLoad,
  WeatherKittyPause,
  sleep,
  ReCalcChartAspectAll,
  microSleep,
  WeatherKittyIsLoading,
} from "./WeatherKitty.mjs";

let CodeKy = true;
let DisableWhileLoading = false;
let Test_Boston = false;
let Test_Climate = false;
let Test_FubarDisplay = false;

WeatherKittyPause(true); // stop the widget and disable the initial load
if (CodeKy) Log.SetLogLevel(LogLevel.Info);
if (Test_Boston) await SetLocationAddress("USW00014739");
if (Test_FubarDisplay) {
  WeatherKittyPause(false);
  WeatherKitty();
  NavHome();
  await WeatherKittyWaitOnLoad();
  if (Test_Climate) await ClimateTestFunction();
  await sleep(2);
} else {
  WeatherKittyPause(false);
  WeatherKitty();
  await WeatherKittyWaitOnLoad(); // wait for the widget to load
  if (Test_Climate) await ClimateTestFunction();
}
LoadButtons();

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
  element = document.getElementById("BostonData");
  if (element)
    element.addEventListener("click", async () => {
      await SetLocationAddress("USW00014739");
      WeatherKitty();
    });
  element = document.getElementById("RedrawCharts");
  if (element) element.addEventListener("click", ReCalcChartAspectAll);
}

async function ClimateTestFunction() {
  await NavClimate();
  await sleep(1);
  await SetLocationAddress("USC00153629");
  WeatherKitty();
}

async function NavToClass(classNames) {
  if (DisableWhileLoading && (await WeatherKittyIsLoading())) return;
  console.log("NavToClass: ", classNames);
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

async function NavHome() {
  await NavToClass(["MapsAlpha", "WeekAlpha", "WeatherKittyHomeCharts"]);
}

async function NavWeather() {
  await NavToClass(["WeatherKittyWeatherCharts"]);
}

async function NavHistory() {
  await NavToClass(["WeatherKittyHistoryCharts"]);
}

async function NavClimate() {
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
