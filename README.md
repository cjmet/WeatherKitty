# WeatherKitty

Implementing Weather Widgets using the NWS/NOAA **_FREE_** Weather API <br>

![DemoImage](https://raw.githubusercontent.com/cjmet/WeatherKitty/main/img/DemoImage.jpg)
<span style="font-size: xx-small;">Github Copilot was used during the development of this project.</span>

## Usage

- Valid for locations in the United States Only. The primary API is from the **United States** National Weather Service.
- Secure https and Location are **Required**.
  - location can be provided by browser permissions, GeoIP, or opt-in GeoAddress.
- Install as a git submodule
  `git submodule add https://github.com/cjmet/WeatherKitty.git WeatherKitty`
- Add WeatherKitty.mjs to your scripts in your html file
- Insert one of the weather-kitty html elements into your html.
  - Note: You must use both opening and closing tags.

### HTML Elements

- `<weather-kitty></weather-kitty>` - Widget, including Current Conditions and Forecast
- `<weather-kitty-current></weather-kitty-current>` - Current Conditions
- `<weather-kitty-forecast></weather-kitty-forecast>` - Forecast
- `<weather-kitty-geoaddress></weather-kitty-geoaddress>` - Manual Location Input, Optional. Currently powered by corsproxy.io
- `<weather-kitty-chart type="keyword"></weather-kitty-chart>` - Chart
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
- Example CSS

  ```
  weather-kitty {
    font-size: x-small;
  }
  ```

### Options

- Custom CSS in your own stylesheet as desired.
- Custom HTML Code Blocks
- ~~Custom GeoAddress Function~~ - Not Implemented

### Examples

- see example\*.html in the main directory.

...

## Credits, License, and Usage Summary

- **Art, Ascii Art, Logos, Trademark, etc.:** (c) 2024 <img src="https://raw.githubusercontent.com/cjmet/WeatherKitty/refs/heads/main/_Angel%20Hornet%20Icon128.png" style="height: 1em; margin: -0.1em 0;">Angel Hornet, All Rights Reserved.
- **Software is Licensed:** LGPL 3.0 or newer
- **Chart.js:** MIT License
- **api.weather.gov:** "Intended to be open data, free to use for any purpose". **Limit:** 1 call per second.
- **corsproxy.io:** Unknown License. **Limit:** Unknown Limit, assume limit 1 call per second.
  - **INSECURE. YOU ARE TRUSTING** corsproxy.io not to exploit Data or XSS in both directions.
- **ipapi.co:** Unknown License. **Limit:** 35 calls per hour.
- **nominatim.openstreetmap.org:** Non-Commercial, Attribution and ODbL License. **Limit:** Limited Use, Demo Use Only, Must Cache Results.

## To-Do

- [ ] Weather Kitty - To-Do List

  - [ ] Image Enlarge, Pan, and Zoom ... move to wk.mjs
  - [ ] Alerts, Radar, Products, Weather Maps
    - [ ] Alerts
    - [ ] Radar
    - [ ] Products
    - [ ] Weather Maps
    - [ ] Weather Map and Forecasts Widget (Large, page/display sized Widget)
  - [ ] corsproxy to cache the images locally?
  - [ ] Custom modular geolocation function(s);
  - [ ] KvPCache.Open(name), KvPCache.Get(key), KvPCache.Set(key, value, ttl), KvPCache.Clear(name?);
    - [ ] value = value or null/undefined to delete
    - [ ] ttl = time to live in (seconds or milliseconds?) or -1 for permanent, aka (Number.Max / 2)
  - [ ] Better Charts
    - [ ] No Points? Color Coding? Rainbow? Read Danny's Book?
  - [ ] refactor main weatherkitty api calls to update to better async await and error handling. Maybe use functions and stacks, instead of linear without the best failure logic.
  - [ ] How can we transition a media query

- [ ] Project - To-Do List
  - [ ] Vite
  - [ ] React
  - [ ] Auth / OAuth API
  - [ ] AWS, Lambda, Hosting, Etc, ...

## CodeKy Project Requirements

- [ ] **Required**

  - [x] GitHub Repository: Upload your project to GitHub with a minimum of 5 distinct commits. Uploading via Git command line is required; GitHub's file uploader won't suffice.
  - [x] README File: Include a README file explaining your project.
        Describe your project in a paragraph or more.
  - [ ] Visual Appeal: Design your project to be visually appealing; follow industry trends.
  - [x] Responsive Design: Implement responsive design using media queries, CSS Grid, Flexbox, etc. Your application should adapt to at least two screen sizes (mobile and desktop).
  - [x] 3+ features from the provided list that you've integrated.
  - [ ] Add any special instructions for the reviewer to run your project.
  - [x] Add a 4th feature
  - [x] API: Integrate a third-party API into your project.
    - [x] Read API **or** Write to an API
          &nbsp;

- [x] **Features (Choose 2)**

  - [x] Use Arrays, Objects, Sets, or Maps
  - [x] Analyze data that is stored in arrays, objects, sets or maps and display information about it in your app.
  - [ ] Use a regular expression to validate user input optionally inform the user about it.
  - [x] Analyze text and display useful information about it. (e.g. word/character count in an input field)
  - [x] Create a function that accepts two or more input parameters and returns a value that is calculated or determined by the inputs. Basic math functions don’t count (e.g. addition, etc).
  - [x] Visualize data in a user friendly way. (e.g. graph, chart, etc)
  - [ ] Create 3 or more unit tests for your application (and document how to run them)
  - [x] Convert ~~user~~ input between two formats and display the result. (e.g. Fahrenheit to Celcius, kilograms to pounds, etc)
  - [x] Calculate and display data based on an external factor (ex: get the current date, and display how many days remaining until some event)
        &nbsp;

- [x] **Advanced Features (Choose 1)**

  - [x] Retrieve data from a third-party API and use it to display something within your app.
  - [ ] Create a form and store the submitted values using an external API (e.g. a contact form, survey, etc).
  - [ ] Persist data to an external API and make the stored data accessible in your app (including after reload/refresh).
        &nbsp;

- [ ] **Optional Features (Swap with Section 1)**
  - [ ] Create a node.js web server using a modern framework such as **Express.js** or **Fastify**. Serve at least one route that your app uses (must serve more than just the index.html file).
  - [ ] Interact with a database to store and retrieve information (e.g. MySQL, MongoDB, etc).
  - [ ] Implement modern interactive UI features (e.g. table/data sorting, autocomplete, drag-and-drop, calendar-date-picker, etc).
  - [ ] Develop your project using a common JavaScript framework such as React, Angular, or Vue.

## Blog

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
