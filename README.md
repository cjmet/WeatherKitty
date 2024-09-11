# WeatherKitty

Implementing a Weather Widget using the NWS/NOAA **_FREE_** Weather API <br>

![DemoImage](https://raw.githubusercontent.com/cjmet/WeatherKitty/main/img/DemoImage.jpg)

<br>

## Usage

- Install as a git submodule
  `git submodule add https://github.com/cjmet/WeatherKitty.git WeatherKitty`
- Add WeatherKitty.mjs to your scripts in your html file
- Insert one of the weather-kitty html elements into your html.
  - Note: You must use both opening and closing tags.

### HTML Elements

`<weather-kitty></weather-kitty>` - Widget, including Current Conditions and Forecast
`<weather-kitty-current></weather-kitty-current>` - Current Conditions
`<weather-kitty-forecast></weather-kitty-forecast>` - Forecast

### CSS Classes and Tags

For ease of editing and customization

`.WeatherKitty` - Widget
`.WeatherKittyBlock` - Current Conditions and Forecast Blocks. Default width: 5.67 em
`.WeatherKittyImage` - Weather Background Images
`.WeatherKittyText` - Weather Text
`weather-kitty-tooltip` - Tooltip tags if you need to style them.

- Example CSS
  ```
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

- [ ] convert weatherkitty() to a config and reset, but optional

## Blog

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
