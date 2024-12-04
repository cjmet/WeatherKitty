import { config } from "./config.mjs";
import { Log } from "./log.mjs";
import { fetchCache, fetchTimeoutOption } from "./fetchCache.mjs";
import { assert } from "./assert.mjs";

// APISTATUS API-STATUS API STATUS
// wkStatusTag is optional.  If provided, check only that tag.
async function CheckApiStatus(wkStatusTag) {
  let response;
  let result = true;
  let APIs = [
    { name: "wk-status-nws", url: "https://api.weather.gov/alerts/types" },
    { name: "wk-status-aws", url: "https://noaa-ghcn-pds.s3.amazonaws.com/ghcnd-version.txt" },
    {
      name: "wk-status-ncei",
      url: "https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-version.txt",
    },
    {
      name: "wk-status-ncdc",
      url: "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-version.txt",
    },
  ];

  let checkTagName = false;
  for (let api of APIs) {
    if (wkStatusTag && api.name !== wkStatusTag) continue;
    checkTagName = true;
    let elements = document.getElementsByTagName(api.name);
    for (let element of elements) element.innerHTML = "🟡";
  }
  if (!checkTagName && Log.Warn())
    console.log(`[CheckApiStatus] *** ERROR ***: API Tag [${wkStatusTag}] Not Found.`);

  let promiseArray = [];
  for (let api of APIs) {
    if (wkStatusTag && api.name !== wkStatusTag) continue;
    if (Log.Verbose()) console.log(`Checking API: ${api.name}`);

    // fetchCache
    let url = api.url;
    let options = fetchTimeoutOption(1000 * 5);

    promiseArray.push(
      fetchCache(url, options, config.StatusTtl, config.StatusTtl).then(async (response) => {
        let value = response && response.ok && response.status === 200;
        if (!value) result = false;
        let elements = document.getElementsByTagName(`${api.name}`);
        for (let element of elements) {
          assert(null, value, element, "replace");
        }
      })
    );
  }
  await Promise.all(promiseArray);
  return result;
}

// --------------------------------------------------------------

export { CheckApiStatus, fetchTimeoutOption };
