# WeatherKitty

Implementing a Weather Widget using the NWS/NOAA **_FREE_** Weather API <br>

<br>

## To-Do

- [ ] Try the :before with a container set to `position: relative`
- [ ] If that fails: container->relative, with (img and text_container)->absolute
- [ ] image type transparency and overlay to emulate transparent background
- [ ] :before did not work the way I wanted. yet.
  - set :before transparency if we can, if not use the image version. But I'd prefer the :before background version

## Blog

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
