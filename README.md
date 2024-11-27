# WeatherKitty

Implementing Weather Widgets, Maps, and Charts using the NWS/NOAA **_FREE_** Weather API <br> The intent is to make this relatively modular and easy to use in any project or page.

https://cjmet.github.io/WeatherKitty/
![DemoImage](https://raw.githubusercontent.com/cjmet/WeatherKitty/refs/heads/main/img/DemoImage.jpg)
<span style="font-size: x-small;"> <br>Github Copilot was used during the development of this project.</span>

**GHCND Note:** The History APIs were taken out by the fall Hurricanes. While they are partially back online now, they still suffer from frequent outages, and congestion. If you want to explore the historical data it's advised that you download a local copy from: [NCEI](https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd_all.tar.gz) (33gb)

**CodeKy Note:** See the project.md for CodeKy Specific Info.

## Usage

- **Required**: Secure https and Location are Required.
- Valid for locations in the United States Only. The primary API is from the **United States** National Weather Service.

  <details>

  - location can be provided by browser permissions, GeoIP, or GeoAddress.
  - GeoIP and GeoAddress have limited API Usage, additional usage may require an API Key, License, or Subscription.
  </details>

- Install as a git submodule. I'll make this a node module later.
  `git submodule add https://github.com/cjmet/WeatherKitty.git WeatherKitty`
- Add WeatherKitty.mjs to your scripts in your html file
- Insert one of the weather-kitty html elements into your html.
  - Note: You must use both opening and closing tags.

## HTML Elements

- <b><span style="font-size: large;">`<weather-kitty>`</span></b> - Widget, including Current Conditions and Forecast
- <b><span style="font-size: large;">`<weather-kitty-current>`</span></b> - Current Conditions
- <b><span style="font-size: large;">`<weather-kitty-forecast>`</span></b> - Forecast
- <b><span style="font-size: large;">`<weather-kitty-geoaddress>`</span></b> - Manual Location Input.
- <b><span style="font-size: large;">`<weather-kitty-week>`</span></b> - Forecast 7-day matrix for the next week.
- <b><span style="font-size: large;">`<weather-kitty-radar-local>`</span></b> - Local Radar map.
- <b><span style="font-size: large;">`<weather-kitty-radar-national>`</span></b> - National Radar map.
- <b><span style="font-size: large;">`<weather-kitty-map-forecast>`</span></b> - Forecast map.
- <b><span style="font-size: large;">`<weather-kitty-map-alerts>`</span></b> - Alerts map.
- <b><span style="font-size: large;">`<weather-kitty-chart type="keyword">`</span></b> - Weather Charts. NOTE: Charts may require a defined or contained size.
- <b><span style="font-size: large;">`<weather-kitty-tooltip>`</span></b> - Tooltip tags if you need to style them.
- <b><span style="font-size: large;">`<weather-kitty-status>`</span></b> - API Status Widget.
  <details>
  <summary>Additional Status Subwidgets</summary>

  - `<wk-status-nws">`
  - `<wk-status-aws">`
  - `<wk-status-ncei">`
  - `<wk-status-ncdc">`
  </details>

### CSS Classes and Tags

For ease of editing and customization

- `.WeatherKitty` - The main Widget
- `.WeatherKittyBlock` - Current Conditions and Forecast Blocks.
- `.WeatherKittyImage` - Weather Background Images
- `.WeatherKittyText` - Weather Text
- `.WeatherKittyChart` - Weather chart containers
- `.WeatherKittyGeoAddress` - Manual location input container
- `.WeatherKittyMapForecast` - Forecast Map
- `.WeatherKittyMapRadar` - Radar Map
- `.WeatherKittyMapAlerts` - Alerts Map
- `.WeatherKittyStatus` - API Status Widget
- `.wk-status-signal` - Used for the stoplights in the Status Indicator
- and more. See the dev tools inspector for more classes.

### HTML Element Details

#### Charts

<b>`<weather-kitty-chart type="value" MaxDataPoints="value" pixelsPerDataPoint="value" trimData="value" width="value" height="value" noData="value">`</b>

<small>NOTE: Charts may require flex, grid, a defined size, or a contained size. Charts will attempt to size to their parent container. This can sometimes cause issues with dynamic undefined sizing. This can include grid or flex all the way to the root.</small>

##### Type - <small>required</small>

- "value" - is the data type you want to chart. Not all data types are available for all locations. See below for a partial list of data types.

##### MaxDataPoints - <small>optional</small>

- "auto" - sets the value for you, and keeps the charts sized to the viewport.
- "default" - sets the value to a reasonable number suited for most charts.
- "max" - sets the value to as many points as the charts can reasonably handle. Approximately 32,000.
- "value" - sets the value.

##### PixelsPerDataPoint - <small>optional</small>

- "auto" - sets the value for you, and keeps the charts sized to the viewport.
- "default" - the same as "small".
- "small" - about 4 pixels.
- "medium" - about 14 pixels.
- "large" - about 24 pixels.
- "value" - sets the value.

##### TrimData - <small>optional</small>

- "truncate" - truncates excess data. the default.
- "reversetruncate" - same as truncate but backwards.

##### noData - <small>optional</small>

- "hide" - will hide the chart when no data is available.

##### width - <small>optional</small>

- "value" - this will override the width, but the chart may still scale to fill the area, or may expand for additional data points.

##### height - <small>optional</small>

- "value" - this will override the width, but the chart may still scale to fill the area.

##### Climate Chart Example

<b>`<weather-kitty-chart type="TEMP" MaxDataPoints="max" pixelsPerDataPoint="default" trimData="avg">`</b>

<b>Chart Types</b>:

- elevation, temperature, dewpoint, windDirection, windSpeed, windGust, barometricPressure, seaLevelPressure, visibility, maxTemperatureLast24Hours, minTemperatureLast24Hours, precipitationLastHour, precipitationLast3Hours, precipitationLast6Hours, relativeHumidity, windChill, heatIndex, ...
- TMAX, TMIN, PRCP, SNOW, SNWD, PGTM, WDFG, WSFG, WESD, FRGT, THIC, ACMH, ACSH, PSUN, TSUN, WDFM, WSFM, AWND, FMTM, TAVG, ADPT, ASLP, ASTP, AWBT, RHAV, RHMN, RHMX, TEMP, TMXN, ...
- ... and more. Set Log.SetLogLevel(LogLevel.Info); and then see the live dev console for more info. I'll add a GetAvailableChartTypes() later.

##### Chart Aliases

- TEMP - tries to determine the larger temperature dataset for a station, which is hopefully the most relevant.
- TMXN - average of TMAX and TMIN where available

## Credits, License, and Usage Summary

- **Art, Ascii Art, Logos, Trademark, etc.:** (c) 2024 <img src="https://raw.githubusercontent.com/cjmet/WeatherKitty/refs/heads/main/Logo128.png" style="height: 1em; margin: -0.1em 0;">Angel Hornet, All Rights Reserved.
- **Software is Licensed:** MPL 2.0 or newer

  &nbsp;

- **api.weather.gov:** "Intended to be open data, free to use for any purpose". **Limit:** 1 call per second.
- **bowser.js:** MIT License.
- **chart.js:** MIT License.
- **corsproxy.io:** Unknown License. **Limit:** Unknown Limit, assume limit 1 call per second.
  - **INSECURE. YOU ARE TRUSTING** corsproxy.io not to exploit Data or XSS in both directions.
- **fflate:** Mit License.
- **ipapi.co:** Unknown License. **Limit:** 35 calls per hour.
<!-- - **nominatim.openstreetmap.org:** Non-Commercial, Attribution and ODbL License. **Limit:** Limited Use, Demo Use Only, Must Cache Results. -->
- **GHCND:** Public Data. **Limit:** Unknown Limit, assume 1 call per second.

  ```
  https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt
  https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt
  https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/
  https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz

  Menne, M.J., I. Durre, R.S. Vose, B.E. Gleason, and T.G. Houston, 2012:  An overview
  of the Global Historical Climatology Network-Daily Database.  Journal of Atmospheric
  and Oceanic Technology, 29, 897-910, doi:10.1175/JTECH-D-11-00103.1.

  To acknowledge the specific version of the dataset used, please cite:
  Menne, M.J., I. Durre, B. Korzeniewski, S. McNeill, K. Thomas, X. Yin, S. Anthony, R. Ray,
  R.S. Vose, B.E.Gleason, and T.G. Houston, 2012: Global Historical Climatology Network -
  Daily (GHCN-Daily), Version 3. [indicate subset used following decimal,
  e.g. Version 3.12].
  NOAA National Climatic Data Center. http://doi.org/10.7289/V5D21VHZ [access date].
  ```
