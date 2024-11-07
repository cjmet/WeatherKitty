## Project Plan

- Create simple to use fully self contained html elements for weather
  - add the script to your html or js
  - add a weather element to your html

### Overview

It sounds so neat and simple, and it so very much isn't.

- Repeat on Interval
  - Scan for Elements
  - Render InnerHtml if there is none. This means you can optionally iterate.
  - Foreach request data
  - Data requests dependencies, recursive
  - fetchCache, fetch it, cache it, serve it, if fail serve stale
  - Process data, sometimes simple, sometimes a complicated mess
  - Render the Element and Data

## CodeKy Project Requirements

- [ ] **Required**

  - [x] GitHub Repository: Upload your project to GitHub with a minimum of 10 distinct commits. Uploading via Git command line is required; GitHub's file uploader won't suffice.
        `I would normally clean up the number of commits`
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

## To-Do

- [ ] Weather Kitty - To-Do List

  - Resize Charts When
    - [ ] Resize Chart Function
    - [ ] Location Changes
    - [ ] WindowSize Changes
    - [ ] Display/Hidden Changes
  - [ ] if change location, reload charts? reload page? resize charts? modular resize for charts?
  - [ ] Px Mx Logic
    - [ ] PX
      - [ ] "auto" - does not resize chart, but is the same size as "default" if asked for calc
      - [ ] "default" - 4
      - [ ] set - resizes to fit data
    - [ ] MX
      - [ ] "auto" - MAX / PX
      - [ ] "default" - 510
      - [ ] "max" - CHART_MAX / PX
      - [ ] set - resizes data to fit
    - [ ] Default Weather = Average, Default History = Truncate
  - [ ] AvgByDay, AvgByWeek, AvgByMonth, AvgByYear averages
  - [ ] OnDisplayStyleChange, OnWindowResizeChange
  - [ ] HTML Element: Chart DataLength Option, right now history is truncated at 500 records
    - [ ] MaxDataPoints = Set, Calc(MaxWidth/PixelsPerPoint), default: 510
      - [ ] Controls Number of Data Points
    - [ ] PixelsPerPoint, default: 4 or None. 4 looks best visually to me.
      - [ ] Controls Display, Aspect, Etc. "Auto", 4, 1, "Max", etc.
    - [ ] DataLength: Truncate, ReverseTruncate, Average, None. Default Truncate.
    - [x] Const MaxWidth = 32000 pixels, more and chart.js breaks.
    - [ ] Deal with Null and NaN Data
  - [ ] Global Warming Charts, 1936 to 2024
    - [ ] Data API
    - [ ] Set or Override Chart Sizes and Such
    - [ ] By Year, By Month, By Week
  - [ ] History Chart Optimization
    - [ ] Check for charts first, then only pull the charts we need?
    - [ ] better handling of data types and standardization so we don't have to do so much processing and reprocessing of data
    - [ ] pass in chart lists so we only process ones we need
    - [ ] processed data cache in front of the raw fetchcache data?
  - [ ] Aliases,
    - [x]temp = TMax, Tmin, Tobs
    - [ ] WT**, WV**
  - [ ] City, State by ghcnd
    - [ ] Prefer Order: USW*, USC*, \*
    - [ ] state names from ghcnd-states.txt
    - [ ] modularize AddressByGhcnd
  - [ ] fetchCache - Locking? Queuing?
    - [ ] Locking and/or multiplex/return promises or clones of promises? or a Queue and Promise Engine, or ????
  - [ ] GNIS API
  - [ ] Find Nearest if not Exist
  - [ ] repeatable weatherkitty?
  - [ ] Work on Parallel Async and Slow Connections
    - [ ] already worked on optimization some. Lots more work to do.
    - [ ] ghcnd operations need to be unlinked, and fill in later.
    - [ ] parallel history charts, or even all charts?
  - [ ] disable nav while loading?
  - [ ] disable set while loading?
  - [ ] ...
        &nbsp;

  - [ ] Sec Fix GetLists(s)
  - [ ] Dynamic Create Support, and/or Custom HTML API
  - [ ]
  - [ ] Alerts, Radar, Products, Weather Maps
    - [ ] Alerts
    - [ ] Radar
    - [ ] Products
    - [ ] Weather Maps
    - [ ] Weather Map and Forecasts Widget (Large, page/display sized Widget)
  - [ ] Custom modular geolocation function(s);
  - [ ] PouchCache? (key, value, ttl)nds or milliseconds?) or -1 for permanent, aka (Number.Max / 2)
  - [ ] Better Charts
    - [ ] Color Coding? Rainbow? Read Danny's Book?
  - [ ] Extra Large Screen Media Query

- [ ] Supplemental - To-Do List
  - [ ] Vite
  - [ ] React
  - [ ] Auth / OAuth API
  - [ ] AWS, Lambda, Hosting, Etc, ...
