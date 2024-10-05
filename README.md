# WeatherKitty

Implementing Weather Widgets using the NWS/NOAA **_FREE_** Weather API <br>

![DemoImage](https://raw.githubusercontent.com/cjmet/WeatherKitty/main/img/DemoImage.jpg)
<span style="font-size: xx-small;">Github Copilot was used during the development of this project.</span>
<br>

## Usage

- Install as a git submodule
  `git submodule add https://github.com/cjmet/WeatherKitty.git WeatherKitty`
- Add WeatherKitty.mjs to your scripts in your html file
- Insert one of the weather-kitty html elements into your html.
  - Note: You must use both opening and closing tags.

### HTML Elements

- `<weather-kitty></weather-kitty>` - Widget, including Current Conditions and Forecast
- `<weather-kitty-current></weather-kitty-current>` - Current Conditions
- `<weather-kitty-forecast></weather-kitty-forecast>` - Forecast
- `<weather-kitty-chart type="keyword"></weather-kitty-chart>` - Chart
  - Type can be: "barometricPressure", "dewpoint", "heatIndex", "precipitationLastHour", "precipitationLast3Hours", "precipitationLast6Hours", "relativeHumidity", "temperature", "visibility", "windChill", "windGust", "windSpeed",

### CSS Classes and Tags

For ease of editing and customization

- `.WeatherKitty` - Widget
- `.WeatherKittyBlock` - Current Conditions and Forecast Blocks. Default width: 5.67 em
- `.WeatherKittyImage` - Weather Background Images
- `.WeatherKittyText` - Weather Text
- `weather-kitty-tooltip` - Tooltip tags if you need to style them.
- `weather-kitty-chart` - weather chart containers
- `.WeatherKittyChart` - weather chart containers
- Example CSS

  ```
  weather-kitty {
    font-size: x-small;
  }

  weather-kitty-tooltip {
    justify-self: center; /* Align X: justify-self: left, center, right */
    align-self: center;   /* Align Y: align-self: start, center, end */
  }
  ```

### Options

- Use CSS in your own stylesheet as desired.
- Import and use the WeatherKitty() function for configuration;
- Custom HTML Code Blocks

### index.html Code Example

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="styles.css" />
  </head>

  <body>
    <header>
      <weather-kitty></weather-kitty>
    </header>

    <script src="./WeatherKitty.mjs" type="module"></script>
  </body>
</html>
```

### Custom HTML Code Block Example

```
<weather-kitty class="WeatherKitty">
  <weather-kitty-current class="WeatherKittyBlock">
    <img src="https://default-image.jpg" class="WeatherKittyImage" />
    <div class="WeatherKittyText"></div>
    <weather-kitty-tooltip></weather-kitty-tooltip>
  </weather-kitty-current>

  <div style="width: 0.5em"></div>

  <weather-kitty-forecast class="WeatherKittyBlock">
    <img src="https://default-image.jpg" class="WeatherKittyImage" />
    <div class="WeatherKittyText"></div>
    <weather-kitty-tooltip></weather-kitty-tooltip>
  </weather-kitty-forecast>

  <weather-kitty-tooltip></weather-kitty-tooltip>
</weather-kitty>
```

## To-Do

- [ ] Weather Kitty - To-Do List

  - [ ] manual geolocation by zipcode if geolocation is not available.
  - [ ] refactor main weatherkitty api calls to update to better async await and error handling. Maybe use functions and stacks, instead of linear without the best failure logic.
  - [ ] refactor the globals for cleaner code.

- [ ] Project - To-Do List
  - [ ] Auth / OAuth API
  - [ ] AWS, Lambda, Hosting, Etc, ...
  - [ ] Look into Vue

## CodeKy Project Requirements

- [ ] **Required**

  - [x] GitHub Repository: Upload your project to GitHub with a minimum of 5 distinct commits. Uploading via Git command line is required; GitHub's file uploader won't suffice.
  - [x] README File: Include a README file explaining your project.
        Describe your project in a paragraph or more.
  - [ ] Visual Appeal: Design your project to be visually appealing; follow industry trends.
  - [x] Responsive Design: Implement responsive design using media queries, CSS Grid, Flexbox, etc. Your application should adapt to at least two screen sizes (mobile and desktop).
  - [x] 3+ features from the provided list that you've integrated. Add any special instructions for the reviewer to run your project.
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
  - [ ] Calculate and display data based on an external factor (ex: get the current date, and display how many days remaining until some event)
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

## 24/10/04

- Alpha version of Charts is complete
- Media Queries
- Canvas Update
- Nav Bar and Hamburger

## 24/10/03

- Adding more charts.

## 24/09/26

- Added the first Test Chart

## 24/09/18

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

## 24/09/11

- Converting to module and html elements and trying to make everything more portable, usable, and compatible.

## 24/09/10

- Converting to module and html elements and trying to make everything more portable, usable, and compatible.

## 24/09/01

- VSCode.LiveServer.Https issues. Reinstalling the **_Visual Studio IDE_** API Certificates re-enabled https. So it at least appears the IDE certificate expiring may have been the issue.
- Added the custom html block option

## 24/08/30

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
