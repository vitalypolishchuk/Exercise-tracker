/////////////// FORM ///////////////
const inputContainer = document.querySelector(".take-input-container");
const infoContainer = document.querySelector(".info-container");
const form = document.querySelector(".center");
const exerType = document.getElementById("exer-type");
const distance = document.getElementById("distance");
const duration = document.getElementById("duration");
const cadence = document.getElementById("cadence");
const elevGain = document.getElementById("elev-gain");
const field4 = document.querySelector(".field-4"); // cadence container
const field5 = document.querySelector(".field-5"); // elevGain container

/////////////// DATA ///////////////
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/////////////// WORKOUT CLASS ///////////////
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance;
    this.duration = duration;
  }
}
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }
}

/////////////// APPLICATION ARCHITECTURE ///////////////
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getPosition();
    this._showWorkouts();

    form.addEventListener("keypress", this._newWorkout.bind(this));
    exerType.addEventListener("change", this._toggleElevationField);
  }

  _showWorkouts() {
    if (!infoContainer.children) return;
    infoContainer.classList.remove("hide-height");
    if (window.innerWidth < 900) {
      infoContainer.style.height = 115 * infoContainer.children.length + "px";
      infoContainer.style.maxHeight = "340px";
    } else {
      infoContainer.style.height = "440px";
    }
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
    inputContainer.classList.remove("hide-height");
    if (window.innerWidth < 900) {
      infoContainer.style.height = 115 * infoContainer.children.length + "px";
      infoContainer.style.maxHeight = "340px";
    } else {
      infoContainer.style.height = "440px";
    }
  }
  _toggleElevationField() {
    field4.classList.toggle("none");
    field5.classList.toggle("none");
  }
  _newWorkout(e) {
    if (e.key !== "Enter") return;
    if (!distance.value || !duration.value || (exerType.value === "run" && !cadence.value) || (exerType.value === "cyc" && !elevGain.value))
      return alert("Please fill all the fields!");
    if (Number(distance.value) <= 0 || Number(duration.value) <= 0 || (exerType.value === "run" && Number(cadence.value) <= 0))
      return alert("Please provide positive values!");

    // create workout activity
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    let actName;
    if (exerType.value === "run") {
      workout = new Running([lat, lng], Number(distance.value), Number(duration.value), Number(cadence.value));
      actName = "Running";
    } else {
      workout = new Cycling([lat, lng], Number(distance.value), Number(duration.value), Number(elevGain.value));
      actName = "Cycling";
    }
    this.#workouts.push(workout);

    distance.value = duration.value = cadence.value = "";

    // display marker and render workout on a map
    this.#map.setView([lat, lng], 13);
    L.marker([lat, lng], {})
      .addTo(this.#map)
      .bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${exerType.value}-popup` }))
      .setPopupContent(actName)
      .openPopup();

    // hide input panel
    inputContainer.classList.add("hide-height");
  }
}
const app = new App();
