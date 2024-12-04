import { config } from "./config.mjs";
import { Log, LogLevel } from "./log.mjs";
import { microSleep, wkElapsedTime } from "./functions.mjs";

function ExpireData() {
  localStorage.clear("ttlCache");
  return true;
}

async function PurgeData() {
  console.log("PurgeData");
  localStorage.clear("ttlCache");
  caches.delete("weather-kitty");
  return true;
}

async function clearCache(url) {
  console.log("clearCache");
  let cache = await caches.open("weather-kitty");
  await cache.delete(url);
}

async function setCache(url, response, ttl) {
  // clone the response so it can be used again
  let clone = response.clone();
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  ttlCache[url] = Date.now() + ttl;
  localStorage.setItem("ttlCache", JSON.stringify(ttlCache));

  let cache = await caches.open("weather-kitty");
  await cache.put(url, response);
  return clone;
}

async function getCache(url) {
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  let ttl = ttlCache[url];

  let cache = await caches.open("weather-kitty");
  let response = await cache.match(url);
  return { url: url, ttl: ttl, response: response };
}

// SPECIAL FUNCTIONS ------------------------------------------
let specialUrlTable = {};
// specialUrlTable = {
//   "/weatherkittycache/location": getLocationAsync,
//   "/weatherkittycache/geoip": getWeatherLocationByIPAsync,
//   "/weatherkittycache/address": getWeatherLocationByAddressAsync,
// };

// Function fetchCache(url, options, ttl)
async function fetchCache(url, options, ttl, failTtl) {
  if (Log.Trace()) console.log(`[fetchCache] ${url}`);
  if (ttl == null || ttl < 0) ttl = config.defaultCacheTime;
  let error = new Response("Fetch Error", { status: 400, ok: false });

  // url, options, ttl, expires, expired, response
  // get expire from localStorage ... I'm avoiding IndexDB for now
  let expires = Date.now() - 3600000;
  let ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
  if (ttlCache == null) ttlCache = {};
  if (ttlCache[url] != null) expires = new Date(ttlCache[url]);
  else ttlCache[url] = 0;

  let expired = expires < Date.now();
  let cache;
  try {
    cache = await caches.open("weather-kitty");
  } catch (error) {
    config.PAUSE = true;
    if (Log.Error()) console.log(`[fetchCache] cache Error: ${error}`);
    WeatherKittyErrorText(`${error}`);
    alert(`ERROR: fetch Error ${error}.`);
  }
  let response = await cache.match(url);

  // if (response && response.ok && !expired) {  // Cached Errors are Now Allowed
  if (response && !expired) {
    if (Log.Info())
      console.log(`[fetchCache] cached: ${url} [${response.ok}] [${wkElapsedTime(expires)}]`);
    return response;
  }

  // If the url is not cached or expired, fetch it
  // If the url is in the specialUrlTable, use the special function
  let fetchResponse = null;

  if (specialUrlTable && url in specialUrlTable) {
    fetchResponse = await specialUrlTable[url](url, options, ttl);
  } else {
    await RateLimitFetch(url, config.RateLimitTtl); // rate-limit
    try {
      if (Log.Trace()) console.log(`[fetch] ${url}`);
      fetchResponse = await fetch(url, options);
    } catch (error) {
      // WeatherKittyErrorText(`${error}`); //  ... this didn't work out.
      if (Log.Error()) console.log(`[fetchCache] Fetch Error: ${url} ${error} [${failTtl}]`);
      let ErrorResponse = new Response("Fetch Error", { status: 500, ok: false, text: error });
      if (failTtl) {
        if (Log.Error()) console.log(`[fetchCache] setCache(ERROR): ${url} ${failTtl}`);
        setCache(url, ErrorResponse, failTtl);
      }
      return ErrorResponse;
    }
  }

  if (fetchResponse && fetchResponse.ok) {
    expires = Date.now() + ttl;
    if (Log.Info()) console.log(`[fetchCache] fetched: ${url} [${wkElapsedTime(expires)}]`);
    let responseClone = fetchResponse.clone();
    try {
      await cache.put(url, responseClone);
    } catch (error) {
      if (Log.Error()) console.log(`[fetchCache] Cache Error: ${error}`);
      WeatherKittyErrorText(`${error}`);
      let ErrorResponse = new Response("Cache Error", { status: 500, ok: false, text: error });
      return ErrorResponse;
    }
    // ASYNC Issue: We need to fresh read the ttlCache now that we have a rate limit.
    // this could still allow async collisions, but less so.
    ttlCache = JSON.parse(localStorage.getItem("ttlCache"));
    if (ttlCache == null) ttlCache = {};
    ttlCache[url] = expires;
    localStorage.setItem("ttlCache", JSON.stringify(ttlCache));
    return fetchResponse;
  } else if (response) {
    if (Log.Warn()) console.log(`[fetchCache] Warning: Stale: ${url} [${wkElapsedTime(expires)}]`);
    return response;
  } else {
    if (Log.Warn()) console.log(`[fetchCache] Warning: not found: ${url}`);
    return null;
  }
}

async function corsCache(url, options, ttl, failTtl) {
  if (config.CORSApiKey) {
    if (!options) options = {};
    if (!options.headers) options.headers = {};
    options.headers["x-cors-api-key"] = config.CORSApiKey;
  }
  let corsUrl = `${config.CORSProxy}${url}`;
  return fetchCache(corsUrl, options, ttl, failTtl);
}

let rateLimitCache = new Map();
async function RateLimitFetch(url, ttl) {
  ttl = ttl * 0.667; // force sleep .667, then randomize .667, for average of 1
  // rate-limit
  let base;
  try {
    base = new URL(url).origin;
  } catch (error) {
    if (Log.Error()) console.log(`ERROR: ${error} ${url}`);
    return;
  }
  let elapsed = 0;
  let now = 0;
  do {
    now = Date.now();
    let lastFetch = rateLimitCache.get(base);
    if (lastFetch == null) {
      rateLimitCache.set(base, now);
      if (Log.Trace()) console.log(`[RateLimit LOCK] ${url}`);
      return;
    }
    elapsed = now - lastFetch;
    let delta = ttl - elapsed;
    if (Log.Trace()) console.log(`[RateLimit HOLD] ${url}`);
    await microSleep(delta + Math.random() * ttl);
  } while (elapsed < ttl + 1);
  if (Log.Trace()) console.log(`[RateLimit FREE] ${url}`);
  now = Date.now();
  rateLimitCache.set(base, now);
}

// Function CreateResponse
async function CreateResponse(data) {
  let responseOptions = {
    status: 200,
    statusText: "OK",
    ok: true,
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  };

  let responseBody = JSON.stringify(data);
  let response = new Response(responseBody, responseOptions);
  return response;
}

function fetchTimeoutOption(microseconds) {
  if (!microseconds || microseconds <= 0) return null;
  let controller = new AbortController();
  let timeoutId = setTimeout(() => controller.abort("HTTP TIMEOUT"), microseconds);
  let options = {
    signal: controller.signal,
  };
  return options;
}

// prettier-ignore
export { ExpireData, PurgeData, clearCache, setCache, getCache, fetchCache, corsCache, RateLimitFetch, fetchTimeoutOption  , CreateResponse ,specialUrlTable };
