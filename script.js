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

let map;
let mapEvent;

/////////////// DATA ///////////////
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

class App {
  #map;
  #mapEvent;

  constructor() {
    this._getPosition();

    form.addEventListener("keypress", this._newWorkout.bind(this));
    exerType.addEventListener("change", this._toggleElevationField.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
        alert("Could not get your position!");
      });
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    const googleStreets = L.tileLayer("http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    });
    googleStreets.addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    inputContainer.classList.remove("hidden");
    console.log(this.#mapEvent);
  }
  _toggleElevationField() {
    field4.classList.toggle("none");
    field5.classList.toggle("none");
  }
  _newWorkout(e) {
    if (e.key !== "Enter") return;
    if (!distance.value || !duration.value || (exerType.value === "run" && !cadence.value) || (exerType.value === "cyc" && !elevGain.value))
      return alert("Please fill all the fields!");
    if (
      Number(distance.value) <= 0 ||
      Number(duration.value) <= 0 ||
      (exerType.value === "run" && Number(cadence.value) <= 0) ||
      (exerType.value === "cyc" && Number(elevGain.value) <= 0)
    )
      return alert("Please provide positive values!");

    distance.value = duration.value = cadence.value = "";

    const { lat, lng } = this.#mapEvent.latlng;
    this.#map.setView([lat, lng], 13);
    L.marker([lat, lng], {})
      .addTo(this.#map)
      .bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: "running-popup" }))
      .setPopupContent("Workout")
      .openPopup();
  }
}
const app = new App();

class Workout {
  #id;
  constructor(id, distance, duration, coords, date) {
    this.#id = id;
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
    this.date = date;
  }
}
class Running extends Workout {
  constructor(id, distance, duration, coords, date, name, cadence, pace) {
    super(id, distance, duration, coords, date);
    this.name = name;
    this.cadence = cadence;
    this.pace = pace;
  }
}
class Cycling extends Workout {
  constructor(id, distance, duration, coords, date, name, elevationGain, speed) {
    super(id, distance, duration, coords, date);
    this.name = name;
    this.elevationGain = elevationGain;
    this.speed = speed;
  }
}
