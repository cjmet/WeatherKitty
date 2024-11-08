# WeatherKitty

Implementing Weather Widgets, Maps, and Charts using the NWS/NOAA **_FREE_** Weather API <br> The intent is to make this relatively modular and easy to use in any project or page.

![DemoImage](https://raw.githubusercontent.com/cjmet/WeatherKitty/refs/heads/main/img/DemoImage.jpg)

<span style="font-size: x-small;"> <br>Github Copilot was used during the development of this project.</span>

## Usage

- Valid for locations in the United States Only. The primary API is from the **United States** National Weather Service.
- Secure https and Location are **Required**.
  <details>

  - location can be provided by browser permissions, GeoIP, or GeoAddress.
  - GeoIP and GeoAddress have limited API Usage, additional usage may require an API Key, License, or Subscription.
  </details>

- Install as a git submodule
  `git submodule add https://github.com/cjmet/WeatherKitty.git WeatherKitty`
- Add WeatherKitty.mjs to your scripts in your html file
- Insert one of the weather-kitty html elements into your html.
  - Note: You must use both opening and closing tags.

## HTML Elements

<b>`<weather-kitty>`</b> - Widget, including Current Conditions and Forecast
<b>`<weather-kitty-current>`</b> - Current Conditions
<b>`<weather-kitty-forecast>`</b> - Forecast
<b>`<weather-kitty-geoaddress>`</b> - Manual Location Input. Currently powered by corsproxy.io
<b>`<weather-kitty-week>`</b> - Forecast 7-day matrix for the next week.
<b>`<weather-kitty-map-forecast>`</b> - Forecast map link.
<b>`<weather-kitty-map-radar>`</b> - Radar map link.
<b>`<weather-kitty-map-alerts>`</b> - Alerts map link.
<b>`<weather-kitty-chart type="keyword">`</b> - Chart

### CSS Classes and Tags

For ease of editing and customization

`<weather-kitty-tooltip>` - Tooltip tags if you need to style them.
`.WeatherKitty` - Widget
`.WeatherKittyBlock` - Current Conditions and Forecast Blocks.
`.WeatherKittyImage` - Weather Background Images
`.WeatherKittyText` - Weather Text
`.WeatherKittyChart` - Weather chart containers
`.WeatherKittyGeoAddress` - Manual location input container
... and more. See the dev tools inspector for more classes.

### HTML Element Details

#### Charts

<b>`<weather-kitty-chart type="value" MaxDataPoints="value" pixelsPerDataPoint="value" trimData="value">`</b>

##### Type - <small>required</small>

- "value" - is the data type you want to chart. Not all data types are available for all locations. See below for a partial list of data types.

##### MaxDataPoints - <small>optional</small>

- "auto" - sets the value for you.
- "default" - sets the value to a reasonable number suited for most charts.
- "max" - sets the value to as many points as the charts can reasonably handle. Approximately 32,000.
- "value" - sets the value to that specified so long as it is less than "max".

##### PixelsPerDataPoint - <small>optional</small>

- "auto" - sets the value for you, and keeps the charts sized to the viewport.
- "default" - bypasses the viewport restrictions on the chart and sizes the charts to a reasonable value to make all data points discernable. About 4 pixels.
- "value" - bypasses the viewport restrictions on the chart and sets the value to that specified.

##### TrimData - <small>optional</small>

- "truncate" - truncates excess data. the default.
- "reversetruncate" - same as truncate but backwards.
- "average" - averages the data to fit.
- "none" - does not trim the data.

#### Climate Chart Example

<b>`<weather-kitty-chart type="TEMP" MaxDataPoints="max" pixelsPerDataPoint="default" trimData="avg">`</b>

<b>Chart Types</b>:

- elevation, temperature, dewpoint, windDirection, windSpeed, windGust, barometricPressure, seaLevelPressure, visibility, maxTemperatureLast24Hours, minTemperatureLast24Hours, precipitationLastHour, precipitationLast3Hours, precipitationLast6Hours, relativeHumidity, windChill, heatIndex, ...
- TMAX, TMIN, PRCP, SNOW, SNWD, PGTM, WDFG, WSFG, WESD, FRGT, THIC, ACMH, ACSH, PSUN, TSUN, WDFM, WSFM, AWND, FMTM, TAVG, ADPT, ASLP, ASTP, AWBT, RHAV, RHMN, RHMX, TEMP, ...
  ... and more. See the live dev console for more info.

## Credits, License, and Usage Summary

- **Art, Ascii Art, Logos, Trademark, etc.:** (c) 2024 <img src="https://raw.githubusercontent.com/cjmet/WeatherKitty/refs/heads/main/_Angel%20Hornet%20Icon128.png" style="height: 1em; margin: -0.1em 0;">Angel Hornet, All Rights Reserved.
- **Software is Licensed:** MPL 2.0 or newer
  &nbsp;
- **api.weather.gov:** "Intended to be open data, free to use for any purpose". **Limit:** 1 call per second.
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
