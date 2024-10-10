await fetch(
  "https://geocoding.geo.census.gov/geocoder/locations/address?street=100%20Main%20St&city=Lexington&state=Ky&benchmark=Public_AR_Current&format=json"
).catch((error) => {
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
