// print the date of the time int

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
