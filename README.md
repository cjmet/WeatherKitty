# WeatherKitty

Implementing a Weather Widget using the NWS/NOAA **_FREE_** Weather API <br>

<br>

## Usage:

- install as a git submodule
  `git submodule add https://github.com/cjmet/WeatherKitty.git WeatherKitty`

- Place WeatherKitty.css before your styles.css so that you can optionally over-ride it.
- Place the `<div id="WeatherKittyWidget"></div>` block where you want it, with/without the optional spacer.
- Place WeatherKitty.js before your script.js
- Call `WeatherKitty([optionalPath]);` in your script.js.

  - Default path is "WeatherKitty"

  &nbsp;
  index.html

  ```
  <link rel="stylesheet" href="WeatherKitty/WeatherKitty.css" />
  <link rel="stylesheet" href="style.css" />

  <div id="WeatherKittyWidget"></div>

  <script src="./WeatherKitty/WeatherKitty.js"></script>
  <script src="./script.js"></script>
  ```

  &nbsp;
  script.js

  ```
  WeatherKitty();
  ```

### Additional Usage Info

- #WeatherKittyWidget is the primary container, use this to control size and placement
- .WeatherKittyDisplay are the Image and Text Containers. Use these to control text size etc.
- #WeatherKittyToopTip is the pop-up tool-tip Forecast. Use this to modify it's size, postion, behavior, etc.
- set `WeatherKittyDebug = true;` for additional more verbose console logging messages

### Custom Html Block Example

```
 <!-- Weather Kitty -->
      <!-- OPTIONAL FULL HTML EXAMPLE -->
      <div id="WeatherKittyWidget">
        <div id="WeatherKittyCurrent" class="WeatherKittyDisplay">
          <img class="WeatherKittyBackgroundImg" />
          <div class="WeatherKittyWeatherText">Current</div>
        </div>
        <div id="WeatherKittyForecast" class="WeatherKittyDisplay">
          <img class="WeatherKittyBackgroundImg" />
          <div class="WeatherKittyWeatherText">Forecast</div>
        </div>
        <div id="WeatherKittyToolTip">Toop Tip</div>
      </div>
      <!-- Weather Kitty -->
```

## To-Do

- [ ] ...

## Blog

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
