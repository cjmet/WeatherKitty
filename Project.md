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
  - [x] README File: Include a README file explaining your project.
        Describe your project in a paragraph or more.

  - [ ] Visual Appeal: Design your project to be visually appealing; follow industry trends.
        `Maybe?  I will say this is not my strong suit`

  - [x] Responsive Design: Implement responsive design using media queries, CSS Grid, Flexbox, etc. Your application should adapt to at least two screen sizes (mobile and desktop).
  - [x] 3+ features from the provided list that you've integrated.
  - [ ] Add any special instructions for the reviewer to run your project.
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
  - [ ] Develop your project using a common JavaScript framework such as React, Angular, or Vue.

## To-Do

### Project Priority 1

- [ ] Visual Appeal: Design your project to be visually appealing; follow industry trends.

#### Project Priority 2

- [ ] SetInterval MonitorCharts
  - [ ] WeatherKitty Locking
  - [ ] Monitor Locking
- [ ] Scrollbar size on mobile. Scrolling of 32k wide history charts.
  - [ ] Jquery UI Scrollbar?
  - [ ] Roll your Own?
- [ ] clean up Log.Verbose
- [ ] clean up Log.Trace

### Project Priority 3

- [ ] HTML Element API
- [ ] Vite
- [ ] Node Package
- [ ] CDN
- [ ] Separate (optional) API / Widget Libraries
- [ ] Express Server

### Project Priority 4

- [ ] Chart.js Decimation: Wrong data format. Change this later as part of Phase 2
- [ ] Chart.js Data-Chunking: Wrong Program Architecture. Change this later as part of Phase 2
- [ ] Chart.js Webworker: This is possible, but I don't like what you give up for what you gain.
- [ ] Cache the Processed Data? That may require a Re-Write?

### Questions (may be duplicated below in fixes)

- [ ] Visual Appeal: Design your project to be visually appealing; follow industry trends.

### Fixes and Updates

- [ ] do not require station location, add that later as it takes too long to load on 3G.
- [ ] loading indicator for the fetch API. Really only needed on 3G.
- [ ] Better way to MonitorCharts()
  - [ ] MutationObserver() API? - This failed to do what I wanted, so I went homegrown.
- [ ] Locking
  - [ ] fetchCache - Locking? Queuing?
  - [ ] WeatherKitty
  - [ ] Locking, Queuing, multiplex/return promises or clones of promises? or a Queue and Promise Engine, or ...
- [ ] Work on Parallel Async and Slow Connections
  - [ ] already worked on optimization some. Lots more work to do.
  - [ ] ghcnd operations need to be unlinked, and fill in later.
  - [ ] parallel history charts, or even all charts?
- [ ] Sec Fix GetLists(s). Partially Done.
- [ ] CustomElement API
- [ ] PouchCache instead of the homegrown mess.
- [ ] Investigate and Deal with Null and NaN API Data

### Features

- [ ] City, State by ghcnd and/or GNIS
  - [ ] Prefer Order: USW*, USC*, \*
  - [ ] state names from ghcnd-states.txt
  - [ ] modularize AddressByGhcnd
- [ ] GNIS API
- [ ] Find Nearest if not Exist
- [ ] AvgByDay, AvgByWeek, AvgByMonth, AvgByYear averages
- [ ] Aliases: WT**, WV**
- [ ] Weather Alerts
- [ ] Modularize so each path (Weather, Obs, History), can finish as independently as possible
- [ ] Modularize so we can use the data half as an API and Library
- [ ] Other Weather Products
- [ ] Better Charts: Color Coding? Rainbow? Read Danny's Book?
- [ ] Dynamic Element Create Support, and/or Custom HTML API

### Supplemental - More things to Learn

- [ ] Vite
- [ ] Express, Express API
- [ ] React
- [ ] Auth / OAuth API
- [ ] AWS, Lambda, Hosting, Etc, ...

## Notes

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
