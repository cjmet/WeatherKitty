import "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js";

// FUNCTIONS

function GetPixels(pxString) {
  let pixels;
  pxString = pxString.toLowerCase();
  if (pxString.includes("px")) pixels = parseFloat(pxString.replace("px", ""));
  return pixels;
}

function AddPixels(array) {
  let pixels = 0;
  for (let px of array) {
    pixels += GetPixels(px);
  }
  let result = pixels.toFixed(2);
  return result;
}

async function DecompressCsvFile(response) {
  let fileData;
  // let sleep = await new Promise((r) => setTimeout(r, 1000));
  let blob_compressed;
  let blob_uncompressed;
  let result = "";
  // get the blob from the response
  if (response.ok) {
    // un-gzip the blob

    let TotalSize = 0;
    let Chunks = [];
    let data_in;
    let data_out;
    blob_compressed = await response.blob();

    let utfDecode;
    let dcmpStrm;
    try {
      Chunks = [];

      let stringData = "";
      utfDecode = new fflate.DecodeUTF8((data, final) => {
        stringData += data;
      });
      dcmpStrm = new fflate.Decompress((chunk, final) => {
        utfDecode.push(chunk, final);
      });

      for await (const chunk of blob_compressed.stream()) {
        TotalSize += chunk.length;
        dcmpStrm.push(chunk);
      }

      result = stringData;
    } catch (e) {
      console.log("*** ERROR *** - Decompression Error: " + e);
      return null;
    }

    fileData = result.split("\n");
    if (!fileData || fileData.length <= 0) {
      if (Log.Error())
        console.log("[HistoricalGetCsvFile] *** ERROR *** : fileData Error, No Data ");

      return null;
    }
  } else if (Log.Error()) console.log("HTTP-Error: " + response.status);

  return fileData;
}

// Function sleep();
async function sleep(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function microSleep(milliSeconds) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}

// Move one page per 4em of movement, Intended for extra large content on touch devices
// GEMINI AI - then completely re-written.  It's 95% mine now.
async function TouchMoveAccelerated(element) {
  let lastX;
  let lastY;
  let isDragging = false;
  let oneEm = parseFloat(window.getComputedStyle(element).fontSize);
  let pageSizeY = element.offsetHeight;
  let pageSizeX = element.offsetWidth;
  if (pageSizeX < 4 * oneEm) pageSizeX = 4 * oneEm;
  if (pageSizeY < 4 * oneEm) pageSizeY = 4 * oneEm;

  element.addEventListener("touchstart", (event) => {
    isDragging = true;
    lastX = null;
    lastY = null;
  });

  element.addEventListener("touchend", () => {
    isDragging = false;
    lastX = null;
    lastY = null;
  });

  // Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) <= 1;
  // element.scrollHeight > element.clientHeight;
  // let AccelY = (element.offsetHeight ) / (4 * oneEm);
  element.addEventListener("touchmove", (event) => {
    event.preventDefault();
    if (isDragging) {
      let x = event.touches[0].clientX; // X
      let dx = x - lastX;
      if (lastX !== null) {
        if (
          dx < 0 &&
          Math.abs(element.scrollWidth - element.clientWidth - element.scrollLeft) > 1
        ) {
          let accelX = Math.max(1, element.offsetWidth / (4 * oneEm));
          element.scrollBy(-dx * accelX, 0); // touch is backwards
        } else if (dx > 0 && element.scrollLeft > 1) {
          let accelX = Math.max(1, element.offsetWidth / (4 * oneEm));
          element.scrollBy(-dx * accelX, 0); // touch is backwards
        } else {
          window.scrollBy(-dx, 0); // touch is backwards
        }
      }
      lastX = x;

      let y = event.touches[0].clientY; // Y
      let dy = y - lastY;
      if (lastY !== null) {
        if (
          dy < 0 &&
          Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) > 1
        ) {
          let accelY = Math.max(1, element.offsetHeight / (4 * oneEm));
          element.scrollBy(0, -dy * accelY); // touch is backwards
        } else if (dy > 0 && element.scrollTop > 1) {
          let accelY = Math.max(1, element.offsetHeight / (4 * oneEm));
          element.scrollBy(0, -dy * accelY); // touch is backwards
        } else {
          window.scrollBy(0, -dy); // touch is backwards
        }
      }
      lastY = y;
    }
  });
}

// Math Functions ---------------------------------------------------------
// ---

// Gemni AI
function isValidNumericString(s) {
  const regex = /^-?\d+(,\d+)*(\.\d+)?$/;
  return regex.test(s);
}

function MathAverage(values) {
  if (!values || values.length <= 0) return null;
  let sum = 0.0;
  for (let value of values) {
    sum += parseInt(value);
  }
  let average = sum / values.length;
  return average;
}

function MathDistance(lat1, lon1, lat2, lon2) {
  let dy = lat2 - lat1;
  let dx = lon2 - lon1;
  let distance = Math.SQRT2(dy ** 2 + dx ** 2);
  return distance;
}

function ManhattanDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return NaN;
  let dy = lat2 - lat1;
  let dx = lon2 - lon1;
  let distance = Math.abs(dy) + Math.abs(dx);
  return distance;
}
// ---
// /Math Functions --------------------------------------------------------

// Function WeatherTemperatureFahrenheit
// .replace(/wmoUnit\:deg/i, "")
function Fahrenheit(temperature, temperatureUnit) {
  // ((fahrenheit - 32) * 5 / 9) °F to °C;
  if (temperature === null || temperature === undefined || temperature === "") return NaN;
  // celcius to fahrenheit: (celsius * 9 / 5) + 32
  let fahrenheit = -999;
  temperatureUnit = temperatureUnit.toLowerCase();
  temperatureUnit = temperatureUnit.replace(/wmoUnit\:deg/i, "");
  if (temperatureUnit === "f" || temperatureUnit === "°f") fahrenheit = Math.round(temperature);
  else if (temperatureUnit == "c" || temperatureUnit === "°c")
    fahrenheit = Math.round((temperature * 9) / 5 + 32);
  else if (Log.Verbose()) console.log(`Warning: Invalid Temperature Unit: ${temperatureUnit}`);

  return fahrenheit;
}

// Function Elapsed Time
function wkElapsedTime(startTime) {
  let endTime = new Date();
  let elapsed = startTime - endTime;
  let seconds = (elapsed / 1000).toFixed(0);
  let minutes = (seconds / 60).toFixed(0);
  let hours = (minutes / 60).toFixed(0);

  seconds = seconds % 60;
  minutes = minutes % 60;

  if (Math.abs(hours) >= 1) return `${hours}h`; // DOH! It's 1 hour even
  if (Math.abs(minutes) >= 1) return `${minutes}m`;
  if (Math.abs(seconds) >= 1) return `${seconds}s`;

  // console.log(`${hours}h ${minutes}m ${seconds}s ${elapsed}ms`);
  return `${elapsed}ms`;
}

// Function BadHyphen
function BadHyphen(phrase) {
  let split = 7;
  let words = phrase.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (words[i].length > split) {
      words[i] = words[i].substring(0, split) + "-" + words[i].substring(split);
    }
  }
  return words.join(" ");
}

// Function getWidthInEm
function getWidthInEm(element) {
  let fontSize = parseFloat(getComputedStyle(element).fontSize);

  let widthInPixels = getComputedStyle(element).width;
  widthInPixels = parseFloat(widthInPixels.replace("px", ""));

  let result = widthInPixels / fontSize;
  return result;
}

// Function WeatherKittyCheckPath
async function WeatherKittyCheckPath(path) {
  path = "/" + path;
  let target = path + config.WeatherKittyObsImage;
  let result = await fetch(target);
  if (result.ok) return path;
  else return null;
}

function IsMobileByBowser() {
  const parser = Bowser.getParser(navigator.userAgent);
  return parser.getPlatformType() === "mobile";
}

function isMobile() {
  if (!config.isMobile) config.isMobile = IsMobileByBowser();
  return config.isMobile;

  // // additional ways to detect mobile; but all, including bowser, have issues.
  // if (window.innerWidth < 450 || window.innerHeight < 450) return true;
  // if ("ontouchstart" in window) return true;
  // // Gemini AI, Chat GPT
  // {
  //   let userAgent = navigator.userAgent.toLowerCase();
  //   if (
  //     /mobile|tablet|ipad|ipod|phone|mobi|android|iphone|ipod|opera mini|iemobile|webos/i.test(
  //       userAgent
  //     )
  //   )
  //     return true;
  // }

  // return false;
}

// ----------- ----------------------------------- -------------------- ------------------------ -------------------
// prettier-ignore
export { ManhattanDistance, DecompressCsvFile, microSleep, GetPixels, AddPixels, sleep, TouchMoveAccelerated, 
  MathAverage, MathDistance, Fahrenheit, wkElapsedTime, BadHyphen, getWidthInEm, IsMobileByBowser, 
  isMobile, isValidNumericString, };
