## Project Plan

- Create simple to use fully self contained html elements for weather
  - add the script to your html or js
  - add a weather element to your html

**Note:** The History APIs were taken out by the fall Hurricanes. A secondary backup of the API came back online first. Later that API failed, but by then the primary in NC was back on line. Later, both primary and secondary failed. However, by that time the AWS mirror was back online and updating again. At that point I rewrote it a third time, and this time the parts of the History API that can be redundant are now triple redundant: AWS, Primary, Secondary. However the live data does not currently have a backup, and also occasionally has transient failures.

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
  - [x] README File: Include a README file explaining your project.
        Describe your project in a paragraph or more.
  - [x] Visual Appeal: Design your project to be visually appealing; follow industry trends.
        `Maybe?  I will say this is not my strong suit`
  - [x] Responsive Design: Implement responsive design using media queries, CSS Grid, Flexbox, etc. Your application should adapt to at least two screen sizes (mobile and desktop).
  - [x] 3+ features from the provided list that you've integrated.
  - [x] Add any special instructions for the reviewer to run your project.
        `There should not be any, beyond the https requirements`
  - [x] Add a 4th feature
  - [x] API: Integrate a third-party API into your project.
    - [x] Read API **or** Write to an API
          `I have APIs in abundance.`
          &nbsp;

- [x] **Features (Choose 2)**

  - [x] Use Arrays, Objects, Sets, or Maps
  - [x] Analyze data that is stored in arrays, objects, sets or maps and display information about it in your app.
  - [ ] Use a regular expression to validate user input optionally inform the user about it.
  - [x] Analyze text and display useful information about it. (e.g. word/character count in an input field)
  - [x] Create a function that accepts two or more input parameters and returns a value that is calculated or determined by the inputs. Basic math functions don’t count (e.g. addition, etc).
  - [x] Visualize data in a user friendly way. (e.g. graph, chart, etc)
  - [ ] Create 3 or more unit tests for your application (and document how to run them)
        `I made a handful of homegrown tests for addresses.`
  - [x] Convert ~~user~~ input between two formats and display the result. (e.g. Fahrenheit to Celcius, kilograms to pounds, etc)
  - [x] Calculate and display data based on an external factor (ex: get the current date, and display how many days remaining until some event)
        &nbsp;

- [x] **Advanced Features (Choose 1)**

  - [x] Retrieve data from a third-party API and use it to display something within your app.
  - [ ] Create a form and store the submitted values using an external API (e.g. a contact form, survey, etc).
  - [ ] Persist data to an external API and make the stored data accessible in your app (including after reload/refresh).
        `I'm saving a fair bit of data to custom caching: location, weather, history, and most api calls`
        &nbsp;

- [ ] **Optional Features (Swap with Section 1)**
  - [ ] Create a node.js web server using a modern framework such as **Express.js** or **Fastify**. Serve at least one route that your app uses (must serve more than just the index.html file).
  - [ ] Interact with a database to store and retrieve information (e.g. MySQL, MongoDB, etc).
  - [ ] Implement modern interactive UI features (e.g. table/data sorting, autocomplete, drag-and-drop, calendar-date-picker, etc).
        `I added a popup pan and zoom to the map images, and a scaled accelerated drag to touch events for large charts.`
  - [ ] Develop your project using a common JavaScript framework such as React, Angular, or Vue.

<!-- ---------------------------------------------------------------------- -->

---

## To-Do

### Questions (may be duplicated below in fixes)

- [ ] ...

### Project Current Work and Fixes

- [ ] WeatherKittyEnable({widgets: true, weather: true, history: true}) instead of PAUSE.
- [ ] Working on Vite Build
  - [ ] Better organized dependencies
  - [ ] Split history up into subfunctions so we can wrap them in a weatherkittyisloading, but keep the superfunction for legacy/bundling/controlling and ease of use as well.

#### Project Priority 2

- [ ] Better Explorer
  - [ ] Filter nearby by types of charts/data?
  - [ ] Add Maps?
  - [ ] leaflet.js?
- [ ] Add 4 letter station search equal priority to 11 letter station search, both higher priority than city search, but try city on fail for both
  - [ ] This will take multiple calls to various endpoints, the simple version is no longer online/valid
- [ ] Radar Maps, KML, Box Target to Lat/Lon
  - [ ] leaflet.js
- [ ] Cache Clean 30 days past due
- [ ] setup a local copy of ghcnd, and links, etc.
- [ ] Add local ghcnd to the api links rotations
- [ ] dynamic chart create?
- [ ] Reorganize the modules logically so that WeatherKitty.mjs is the only required one.
- [ ] Hardware Dev Machine
- [ ] work Styles.css calculated sizes into WeatherKitty.css.
- [ ] Maybe deploy to readme instead of index?
- [ ] font, color, padding, less words, detail icon to pull eye, spacing
  - [ ] needs to be applied to media queries
  - [ ] tried icon and ellipses, there just isn't room if it's 100deg 100%precip

### Project Priority 3

- [ ] Vite, Vite/React
- [ ] Node Package
- [ ] CDN
- [ ] Modularize
- [ ] HTML Element API
- [ ] Separate (optional) API / Widget Libraries
- [ ] Express Server
- [ ] https://github.com/Rob--W/cors-anywhere

### Project Priority 4

- [ ] Chart.js Decimation: Wrong data format. Change this later as part of Phase 2
- [ ] Chart.js Data-Chunking: Wrong Program Architecture. Change this later as part of Phase 2
- [ ] Chart.js WebWorker: This is possible, but I don't like what you give up for what you gain.
- [ ] Cache the Processed Data? That may require a Re-Write?

### Additional Features or Fixes To Add

- [ ] Sec Fix GetLists(s). Partially Done.
- [ ] add a query for GetAvailableChartTypes()
- [ ] modularize AddressByGhcnd
- [ ] GNIS API
- [ ] Find Nearest if not Exist
- [ ] Aliases: WT**, WV**
- [ ] Weather Alerts
- [ ] Other Weather Products
- [ ] Better Charts: Color Coding? Rainbow? Read Danny's Book?
- [ ] PouchCache instead of the homegrown mess.
- [ ] Investigate and Deal with Null and NaN API Data
- [ ] Dynamic Element Create Support, and/or Custom HTML API

### Supplemental - More things to Learn

- [ ] Vite
      [ ] EsLint
- [ ] Vitest
  - [ ] Alternate: Mocha with Chai, JsDom and Cheerio, Headless Chrome
- [ ] Express, Express API
- [ ] React
- [ ] Auth / OAuth API: Firebase, Passport.js, ...
- [ ] AWS, Lambda, MongoDb, Hosting, Etc, ...

## Misc Notes

.nojekyll - github pages

```
// Assuming you have a large dataset:
const largeDataset = [/* ... */];

// Initial chunk size:
const chunkSize = 100;

// Initial data for the chart:
const initialData = largeDataset.slice(0, chunkSize);

// Create the chart with initial data:
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    // ... chart configuration with initialData
});

// Function to load more data and update the chart:
function loadMoreData() {
    const nextChunk = largeDataset.slice(myChart.data.labels.length, myChart.data.labels.length + chunkSize);
    myChart.data.labels.push(...nextChunk.map(item => item.label));
    myChart.data.datasets[0].data.push(...nextChunk.map(item => item.value));
    myChart.update();
}

// Trigger data loading on scroll or other user interactions:
window.addEventListener('scroll', () => {
    // Check if the user has scrolled near the bottom of the chart
    if (window.scrollY + window.innerHeight >= document.body.offsetHeight - 100) {
        loadMoreData();
    }
});
```
