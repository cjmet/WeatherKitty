# WeatherKitty

Implementing a Weather Widget using the NWS/NOAA **_FREE_** Weather API <br>

<br>

## Usage:

- Place WeatherKitty.css before your styles.css so that you can optionally over-ride it.
  ```
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="style.css" />
      <link rel="stylesheet" href="WeatherKitty/WeatherKitty.css" />
    </head>
  ```
- Place the WeatherKitty.hnml block where you want it, with the optional spacer.

  ```
        <div id="WeatherKittySpacer">&nbsp</div>
        <!-- Weather Kitty  -->
        <div id="WeatherKittyWidget">
          <div id="WeatherKittyCurrent" class="WeatherKittyDisplay">
            <img
              class="WeatherKittyBackgroundImg"
              src="WeatherKitty/img/WeatherKittyE7.jpeg"
            />
            <div class="WeatherKittyWeatherText">Current Weather</div>
          </div>
          <div id="WeatherKittyForecast" class="WeatherKittyDisplay">
            <img
              class="WeatherKittyBackgroundImg"
              src="WeatherKitty/img/WeatherKittyC.jpeg"
            />
            <div class="WeatherKittyWeatherText">Weather Forecast</div>
          </div>
          <div id="WeatherKittyToolTip">Toop Tip</div>
        </div>
        <!-- /Weather Kitty -->
  ```

- Place WeatherKitty.js after your last script.js

  ```
      <footer>
        <p>&copy; 2023 My Website. All rights reserved.</p>
      </footer>

      <script src="./script.js"></script>
      <script src="./WeatherKitty/WeatherKitty.js"></script>
    </body>

  ```

## To-Do

- [ ] Try the :before with a container set to `position: relative`
- [ ] If that fails: container->relative, with (img and text_container)->absolute
- [ ] image type transparency and overlay to emulate transparent background
- [ ] :before did not work the way I wanted. yet.
  - set :before transparency if we can, if not use the image version. But I'd prefer the :before background version

## Blog

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
