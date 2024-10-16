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

### HTML Elements

- <b>`<weather-kitty></weather-kitty>`</b> - Widget, including Current Conditions and Forecast
- <b>`<weather-kitty-current></weather-kitty-current>`</b> - Current Conditions
- <b>`<weather-kitty-forecast></weather-kitty-forecast>`</b> - Forecast
- <b>`<weather-kitty-geoaddress></weather-kitty-geoaddress>`</b> - Manual Location Input. Currently powered by corsproxy.io
- <b>`<weather-kitty-forecast-week></weather-kitty-forecast-week>`</b> - Forecast matrix for the next week.
- <b>`<weather-kitty-map-forecast></weather-kitty-map-forecast>`</b> - Forecast map link.
- <b>`<weather-kitty-map-radar></weather-kitty-map-radar>`</b> - Radar map link.
- <b>`<weather-kitty-map-alerts></weather-kitty-map-alerts>`</b> - Alerts map link.
- <b>`<weather-kitty-chart type="keyword"></weather-kitty-chart>`</b> - Chart
  - Type can be: "barometricPressure", "dewpoint", "heatIndex", "precipitationLastHour", "precipitationLast3Hours", "precipitationLast6Hours", "relativeHumidity", "temperature", "visibility", "windChill", "windGust", "windSpeed",
  - and possibly more. See the live dev console for more info.

### CSS Classes and Tags

For ease of editing and customization

- `weather-kitty-tooltip` - Tooltip tags if you need to style them.
- `.WeatherKitty` - Widget
- `.WeatherKittyBlock` - Current Conditions and Forecast Blocks.
- `.WeatherKittyImage` - Weather Background Images
- `.WeatherKittyText` - Weather Text
- `.WeatherKittyChart` - Weather chart containers
- `.WeatherKittyGeoAddress` - Manual location input container
- and more... See the dev tools inspector for more classes.

### CSS Example

- Custom CSS in your own stylesheet as desired.
- Example CSS
  ```
  weather-kitty {
    font-size: x-small;
  }
  ```

### HTML Examples and Custom Code Block

- Html code blocks can be customized. Use the dev tools inspector to see what the code block should look like, then copy and edit it into the tags modifying it to your needs.
- See example\*.html in the main directory.

...

## Credits, License, and Usage Summary

- **Art, Ascii Art, Logos, Trademark, etc.:** (c) 2024 <img src="https://raw.githubusercontent.com/cjmet/WeatherKitty/refs/heads/main/_Angel%20Hornet%20Icon128.png" style="height: 1em; margin: -0.1em 0;">Angel Hornet, All Rights Reserved.
- **Software is Licensed:** LGPL 3.0 or newer
- **api.weather.gov:** "Intended to be open data, free to use for any purpose". **Limit:** 1 call per second.
- **Chart.js:** MIT License.
- **corsproxy.io:** Unknown License. **Limit:** Unknown Limit, assume limit 1 call per second.
  - **INSECURE. YOU ARE TRUSTING** corsproxy.io not to exploit Data or XSS in both directions.
- fflate - Mit License.
- **ipapi.co:** Unknown License. **Limit:** 35 calls per hour.
<!-- - **nominatim.openstreetmap.org:** Non-Commercial, Attribution and ODbL License. **Limit:** Limited Use, Demo Use Only, Must Cache Results. -->

## Blog

### 24/10/16

- Alpha pass at the possibility of considering doing historical data
  - `https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz`
- Gzip catastrophe. The gzip format used/transmitted isn't compatible with the browser DecompressionStream API? It's not compatible with Pako? it's not compatibile with ... but it unzips on the command line if I save the blob so I know it's a good format.
  - finally get it to unzip with fflate and the streaming versions only. It may be getting transmitted with variable block sizes?

### 24/10/15

- Minor fixes

### 24/10/11

- container query. To get the maps they way I really wanted them, required a container query.
- <weather-kitty-map-forecast>, <weather-kitty-map-radar>, <weather-kitty-map-alerts>
- enlarge, pan, and the maps

### 24/10/10

- CORS issue: https://corsproxy.io/?
- Styling issues
- Weather and location updates
- More Media Queries
- Removed Node
- Updated readme, licenses, todo, etc.
- Alpha Forecast Map and Radar Map
- <details>
  <summary>Save these code blocks for reference later</summary>

  ```
  if (false)
    await fetch(
      "https://corsproxy.io/?https://geocoding.geo.census.gov/geocoder/locations/address?street=100%20Main%20St&city=Lexington&state=Ky&benchmark=Public_AR_Current&format=json"
    )
      .then((response) => {
        console.log("Census Response:", response);
        if (!response.ok) {
          console.log("     HTTP error, status = " + response.status);
          throw new Error("HTTP status " + response.status);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Census Data:", data);
        console.log("Census Name:", data.result.addressMatches[0].matchedAddress);
        console.log(
          "Census Latitude:",
          data.result.addressMatches[0].coordinates.y
        );
        console.log(
          "Census Longitude:",
          data.result.addressMatches[0].coordinates.x
        );
      })
      .catch((error) => {
        console.error("Census Error:", error);
      });

  if (false)
    await fetch(
      "https://nominatim.openstreetmap.org/search?q=lexington%20ky&format=json"
    )
      .then((response) => {
        console.log("Nominatim Response:", response);
        return response.json();
      })
      .then((data) => {
        console.log("Nom Data", data);
        console.log("Nom Name:", data[0].display_name);
        console.log("Nom Latitude:", data[0].lat);
        console.log("Nom Longitude:", data[0].lon);
      });

  ```

  </details>

### 24/10/09

- config block
- <details>
    <summary>Census Geocoder and CORS</summary>

  - https://geocoding.geo.census.gov/geocoder/locations/address?street=100%20Main%20St&city=Lexington&state=Ky&benchmark=Public_AR_Current&format=json
  - https://wiki.openstreetmap.org/wiki/Geocoding
    - https://nominatim.openstreetmap.org/search?q=lexington%20ky&format=json

  ```
  AI Answer

  The Census Geocoding API currently doesn't support CORS requests, which means you can't directly call it from a web browser due to security restrictions.

  Here are a couple of ways to work around this:

  1. Use a Proxy Server:
  Set up a proxy server on your own domain.
  Your JavaScript code sends requests to the proxy server.
  The proxy server then forwards the requests to the Census Geocoding API and sends the responses back to your JavaScript code.

  2. Use a Server-Side Language:
  Use a server-side language like Node.js, Python, or PHP to make the API call.
  Your JavaScript code sends a request to your server.
  The server makes the request to the Census Geocoding API, and sends the response back to your JavaScript code.
  ```

  </details>

### 24/10/08

- Hamburger, GeoIP, and Manual Location, ...

### 24/10/04

- Alpha version of Charts is complete
- Media Queries
- Canvas Update
- Nav Bar and Hamburger

### 24/10/03

- Adding more charts.

### 24/09/26

- Added the first Test Chart

### 24/09/18

- Refactored to use innerHTML in the custom elements so html properties can be used
- nvm, npm, Node.js via WSL Ubuntu
  - https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows
  - wsl --install
  - Set-VMProcessor -VMName <VMName> -ExposeVirtualizationExtensions $true
  - /mnt/c/users/...
- chart.js via npm
  - The documentation is lacking in describing how to use the package as a vanilla es6 module.
    - **`import "./node_modules/chart.js/dist/chart.umd.js";`**
- DateTime is ... interesting
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat

### 24/09/11

- Converting to module and html elements and trying to make everything more portable, usable, and compatible.

### 24/09/10

- Converting to module and html elements and trying to make everything more portable, usable, and compatible.

### 24/09/01

- VSCode.LiveServer.Https issues. Reinstalling the **_Visual Studio IDE_** API Certificates re-enabled https. So it at least appears the IDE certificate expiring may have been the issue.
- Added the custom html block option

### 24/08/30

- Refactored using concrete images for the transparent background. Both ways can work, but I decided I liked this way better.

  ```

  #Container {
    box-sizing: border-box;
    position: relative;
    display: flex;
  }

  .WeatherKittyBackgroundImg {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: 0.8;
    z-index: -1;
  }
  ```

### 24/08/29

- Refactoring WeatherKitty to be portable
- More portability changes ... rems to ems so we can override in the client/parent
- :before transparency version did not work, try again with container -> relative
- The following should work for :before

  ```
  #Container {
      position: relative;
      display: flex;
  }
  #Container::before {
      content: "";
      display: block;
      position: absolute;
      height: 100%;
      width: 100%;
      opacity: 0.8;
      background-image: url("CatGirlReading.jpeg");
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: -1;
  }
  ```

- Here is the concrete image implementation that does work.

  ```

  #Container {
      position: relative;
      display: flex;
  }

  #TextWrapper {
      flex-grow: 1;
      position: relative;
  }

  #Image {
      flex-grow: 1;
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      opacity: 0.75;
  }

  ```
