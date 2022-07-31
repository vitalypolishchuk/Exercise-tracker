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
  type = "Running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = Math.round((this.duration / this.distance) * 100) / 100;
  }
}
class Cycling extends Workout {
  type = "Cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = Math.round((this.distance / (this.duration / 60)) * 100) / 100;
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
    infoContainer.addEventListener("click", this._moveMapToWorkout.bind(this));
  }

  _showWorkouts() {
    if (!infoContainer.children) return;
    infoContainer.classList.remove("hide-height");
    if (window.innerWidth < 900) {
      infoContainer.style.height = 115 * infoContainer.children.length + "px";
      infoContainer.style.maxHeight = "335px";
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
  }
  _hideForm() {
    // hide input panel
    distance.value = duration.value = cadence.value = "";
    inputContainer.classList.add("hide-height");
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
    if (exerType.value === "run") {
      workout = new Running([lat, lng], Number(distance.value), Number(duration.value), Number(cadence.value));
    } else {
      workout = new Cycling([lat, lng], Number(distance.value), Number(duration.value), Number(elevGain.value));
    }
    this.#workouts.push(workout);
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
  }
  _renderWorkoutMarker(workout) {
    this.#map.setView(workout.coords, 13);
    const marker = new L.marker(workout.coords, {});
    marker
      .addTo(this.#map)
      .bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${workout.type.toLowerCase()}-popup` }))
      .setPopupContent(`${workout.type} on ${months[workout.date.getMonth()]} ${workout.date.getDate()}`)
      .openPopup();
    workout.marker = marker; // add marker to workout
  }
  _renderWorkout(workout) {
    const htmlRunning = `
      <div class="workout ${workout.type}" data-id="${workout.id}">
        <h3>Running on ${months[workout.date.getMonth()]} ${workout.date.getDate()}</h3>
        <div class="stat-inner-container">
          <h4>🏃‍♂️ ${workout.distance} <span class="unit">KM </span></h4>
          <h4>⏱ ${workout.duration} <span class="unit">MIN </span></h4>
          <h4>⚡️ ${workout.pace} <span class="unit">MIN/KM </span></h4>
          <h4>🦶🏼 ${workout.cadence} <span class="unit">SPM </span></h4>
        </div>
        <span class="delete none"><i class="fa-solid fa-circle-xmark"></i></span>
      </div>
    `;
    const htmlCycling = `
      <div class="workout ${workout.type}" data-id="${workout.id}">
        <h3>Cycling on ${months[workout.date.getMonth()]} ${workout.date.getDate()}</h3>
        <div class="stat-inner-container">
          <h4>🚴‍♀️ ${workout.distance} <span class="unit">KM </span></h4>
          <h4>⏱ ${workout.duration} <span class="unit">MIN </span></h4>
          <h4>⚡️ ${workout.speed} <span class="unit">KM/H </span></h4>
          <h4>⛰ ${workout.elevationGain} <span class="unit">M </span></h4>
        </div>
        <span class="delete none"><i class="fa-solid fa-circle-xmark"></i></span>
      </div>
    `;
    const insertHtml = workout.type === "Running" ? htmlRunning : htmlCycling;
    infoContainer.insertAdjacentHTML("afterbegin", insertHtml);

    this._showWorkouts();
  }
  _moveMapToWorkout(e) {
    if (e.target.parentElement.classList.contains("delete")) return;
    const workoutElement = e.target.closest(".workout");
    if (!workoutElement) return;
    const workout = this.#workouts.find((workout) => workout.id === workoutElement.getAttribute("data-id"));
    this.#map.setView(workout.coords, 13);
    // deleteBtn.classList.toggle("none");
    const deleteBtn = [...workoutElement.children].find((child) => child.classList.contains("delete"));
    deleteBtn.classList.toggle("none");
    console.log(this.#workouts);
    deleteBtn.addEventListener("click", this._removeWorkout.bind(this, workout));
  }
  _removeWorkout(workout) {
    // console.log(workout);
    this.#map.removeLayer(workout.marker); // remove marker
    const workoutIndex = this.#workouts.findIndex((wrk) => wrk.id === workout.id);
    infoContainer.removeChild(infoContainer.children[infoContainer.children.length - 1 - workoutIndex]); // remove HTML
    this.#workouts.splice(workoutIndex, 1);
    this._showWorkouts();
  }
}
const app = new App();
