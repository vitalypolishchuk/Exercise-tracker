/////////////// FORM ///////////////
const inputContainer = document.querySelector(".take-input-container");
const form = document.querySelector(".center");
const exerType = document.getElementById("exer-type");
const distance = document.getElementById("distance");
const duration = document.getElementById("duration");
const cadence = document.getElementById("cadence");
const elevGain = document.getElementById("elev-gain");
const field4 = document.querySelector(".field-4"); // cadence container
const field5 = document.querySelector(".field-5"); // elevGain container

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

let map;
let mapEvent;

if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      const coords = [latitude, longitude];

      map = L.map("map").setView(coords, 13);

      googleStreets = L.tileLayer("http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      });
      googleStreets.addTo(map);

      // set new coordinates when clicking on the map
      map.on("click", function (mapE) {
        mapEvent = mapE;
        inputContainer.classList.remove("hidden");
      });
    },
    function () {
      alert("Could not get your position!");
    }
  );

form.addEventListener("keypress", function (e) {
  if (e.key !== "Enter") return;
  if (!distance.value || !duration.value || !cadence.value) return alert("Please fill all the fields!");
  if (Number(distance.value) <= 0 || Number(duration.value) <= 0 || Number(cadence.value) <= 0) return alert("Please provide positive values!");
  distance.value = duration.value = cadence.value = "";

  const { lat, lng } = mapEvent.latlng;
  map.setView([lat, lng], 13);
  console.log(L);
  L.marker([lat, lng], {})
    .addTo(map)
    .bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: "running-popup" }))
    .setPopupContent("Workout")
    .openPopup();
});
exerType.addEventListener("change", function (e) {
  if (exerType.value === "run") {
    field5.classList.add("none");
    field4.classList.remove("none");
  } else {
    field4.classList.add("none");
    field5.classList.remove("none");
  }
});

// window.addEventListener("keypress", function (e) {
//   if(e.key === 'Enter')

// });
