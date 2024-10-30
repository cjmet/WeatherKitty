import {
  Log,
  LogLevel,
  SetLocationAddress,
  WeatherKitty,
  WeatherKittyIsLoaded,
  WeatherKittyPause,
} from "./WeatherKitty.mjs";
// LogLevel.Info - Default Level, summary of what's happening
// LogLevel.Trace - adds LOADING DELAYS, and other detailed information

// Load custom Config first, then startup.

// WeatherKittyPause(true);
// // Log.SetLogLevel(LogLevel.Error);
// await SetLocationAddress("USW00014739");
// WeatherKittyPause(false);

// Alternative Way to do the above, but it loads default first, then sets the location and reloads
if (false) {
  await WeatherKittyIsLoaded();
  console.log("Weather Kitty is loaded!");
  await SetLocationAddress("USW00014739");
}
