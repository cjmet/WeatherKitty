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

  - [ ] refactor loading indicator, maybe hide the text, new text, then remove new and show old?
  - [ ] css small screen kill "demo" text and set no-wrap hidden on the city name
  - [ ] Chart DataLength Option, right now history is truncated at 500 records
  - [ ] City, State by ghcnd
    - [ ] Prefer Order: USW*, USC*, \*
  - [ ] state names from ghcnd-states.txt
  - [ ] fetchCache - Locking?
    - [ ] Locking and/or multiplex/return promises or clones of promises? or a Queue and Promise Engine, or ????
  - [ ] Find Nearest if not Exist
  - [ ] Aliases, temp = TMax, Tmin, Tobs
  - [ ] repeatable weatherkitty?
  - [ ] export set address interactive and set address programmatically
  - [ ] Image Enlarge, Pan, and Zoom ... move to wk.mjs
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
