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

/////////////// EDITOR ///////////////
const markerEditor = document.querySelector(".marker-editor");
const editInput = document.querySelector(".edit-input-container");
const overlay = document.querySelector(".overlay");
const distanceEdit = document.getElementById("distance-edit");
const durationEdit = document.getElementById("duration-edit");
const cadenceEdit = document.getElementById("cadence-edit");
const elevGainEdit = document.getElementById("elev-gain-edit");
const dateEdit = document.getElementById("date-edit");
const field4Edit = document.querySelector(".field-4-edit"); // cadence container
const field5Edit = document.querySelector(".field-5-edit"); // elevGain container
const cancelBtn = document.querySelector(".cancel");
const saveBtn = document.querySelector(".save");

// localStorage.clear();

/////////////// DATA ///////////////
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const zoomMap = 13;
let x;

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
    // get user's position
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();

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

    this.#map = L.map("map").setView(coords, zoomMap);

    const googleStreets = L.tileLayer("http://{s}.google.com/vt?lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    });
    googleStreets.addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((workout) => {
      this._renderWorkoutMarker(workout);
    });
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

    // Set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    this.#map.setView(workout.coords, 14);
    const marker = new L.marker(workout.coords, {});
    marker
      .addTo(this.#map)
      .bindPopup(L.popup({ maxWidth: 250, minWidth: 100, autoClose: false, closeOnClick: false, className: `${workout.type.toLowerCase()}-popup` }))
      .setPopupContent(`${workout.type} on ${months[workout.date.getMonth()]} ${workout.date.getDate()}`)
      .openPopup();
    workout.marker = marker; // add marker to workout
  }
  _stringToHTML = function (str) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(str, "text/html");
    return doc.body.children[0];
  };
  _renderWorkout(workout, workoutIndex) {
    const htmlRunning = `
      <div class="workout ${workout.type}" data-id="${workout.id}">
        <h3>Running on ${months[workout.date.getMonth()]} ${workout.date.getDate()}</h3>
        <div class="stat-inner-container">
          <h4 class="run-distance">🏃‍♂️ ${workout.distance} <span class="unit">KM </span></h4>
          <h4 class="run-duration">⏱ ${workout.duration} <span class="unit">MIN </span></h4>
          <h4 class="run-pace">⚡️ ${workout.pace} <span class="unit">MIN/KM </span></h4>
          <h4 class="run-cadence">🦶🏼 ${workout.cadence} <span class="unit">SPM </span></h4>
        </div>
        <span class="edit none"><i class="fa-solid fa-pen-to-square"></i></span>
        <span class="delete none"><i class="fa-solid fa-circle-xmark"></i></span>
      </div>
    `;
    const htmlCycling = `
      <div class="workout ${workout.type}" data-id="${workout.id}">
        <h3>Cycling on ${months[workout.date.getMonth()]} ${workout.date.getDate()}</h3>
        <div class="stat-inner-container">
          <h4 class="cyc-distance">🚴‍♀️ ${workout.distance} <span class="unit">KM </span></h4>
          <h4 class="cyc-duration">⏱ ${workout.duration} <span class="unit">MIN </span></h4>
          <h4 class="cyc-speed">⚡️ ${workout.speed} <span class="unit">KM/H </span></h4>
          <h4 class="cyc-elevationGain">⛰ ${workout.elevationGain} <span class="unit">M </span></h4>
        </div>
        <span class="edit none"><i class="fa-solid fa-pen-to-square"></i></span>
        <span class="delete none"><i class="fa-solid fa-circle-xmark"></i></span>
      </div>
    `;
    const insertHtml = workout.type === "Running" ? htmlRunning : htmlCycling;
    if (typeof workoutIndex === "undefined") {
      infoContainer.insertAdjacentHTML("afterbegin", insertHtml);
    } else {
      infoContainer.replaceChild(this._stringToHTML(insertHtml), infoContainer.children[workoutIndex]);
    }
    // console.log([...infoContainer.children]);
    this._showWorkouts();
  }
  _moveMapToWorkout(e) {
    const workoutElement = e.target.closest(".workout");
    if (!workoutElement) return;
    const workout = this.#workouts.find((workout) => workout.id === workoutElement.getAttribute("data-id"));
    this.#map.setView(workout.coords, this.#map.getZoom(), { animate: true, pan: { duration: 1 } });

    // delete workout
    [...document.querySelectorAll(".delete")].forEach((dltBtn) => dltBtn.classList.add("none"));
    const deleteBtn = [...workoutElement.children].find((child) => child.classList.contains("delete"));
    deleteBtn.classList.remove("none");
    deleteBtn.addEventListener(
      "click",
      function (e) {
        this._removeWorkout(e, workout);
      }.bind(this)
    );

    // edit workout
    [...document.querySelectorAll(".edit")].forEach((editBtn) => editBtn.classList.add("none"));
    const editBtn = [...workoutElement.children].find((child) => child.classList.contains("edit"));
    editBtn.classList.remove("none");
    editBtn.addEventListener(
      "click",
      function (e) {
        this._editWorkout(e, workout);
      }.bind(this)
    );
  }
  _removeWorkout(e, workout) {
    e.stopImmediatePropagation();
    this.#map.removeLayer(workout.marker); // remove marker
    const workoutIndex = this.#workouts.findIndex((wrk) => wrk.id === workout.id);
    infoContainer.removeChild(infoContainer.children[infoContainer.children.length - 1 - workoutIndex]); // remove HTML
    localStorage.removeItem(workout.id); // remove from storage
    this.#workouts.splice(workoutIndex, 1); // remove from []
    this._showWorkouts.call(this);
  }
  _removeEditFields() {
    markerEditor.classList.add("none");
    overlay.classList.add("none");
    field4Edit.classList.add("none");
    field5Edit.classList.add("none");
  }
  _editWorkout(e, workout) {
    e.stopImmediatePropagation();
    markerEditor.classList.remove("none");
    overlay.classList.remove("none");
    if (workout.type === "Running") field4Edit.classList.remove("none");
    else field5Edit.classList.remove("none");
    cancelBtn.addEventListener("click", this._removeEditFields);
    x = this._addEvent.bind(this, e, workout);
    saveBtn.addEventListener("click", x);
  }
  _addEvent(e, workout) {
    saveBtn.removeEventListener("click", x);
    this._editWorkout2(e, workout);
  }
  _editWorkout2(e, workout) {
    e.stopImmediatePropagation();
    console.log(workout);
    if (
      !distanceEdit.value ||
      !durationEdit.value ||
      (workout.type === "Running" && !cadenceEdit.value) ||
      (workout.type === "Cycling" && !elevGainEdit.value)
    )
      return alert("Please fill all the fields!");
    if (Number(distanceEdit.value) <= 0 || Number(durationEdit.value) <= 0 || (workout.type === "Running" && Number(cadenceEdit.value) <= 0))
      return alert("Please provide positive values!");

    workout.distance = Number(distanceEdit.value);
    workout.duration = Number(durationEdit.value);
    if (workout.type === "Running") {
      workout.cadence = Number(cadenceEdit.value);
      workout.pace = Math.round((workout.duration / workout.distance) * 100) / 100;
    } else {
      workout.elevationGain = Number(elevGainEdit.value);
      workout.speed = Math.round((workout.distance / (workout.duration / 60)) * 100) / 100;
    }

    workout.date = new Date(dateEdit.value);

    distanceEdit.value = "";
    durationEdit.value = "";
    cadenceEdit.value = "";
    elevGainEdit.value = "";

    const workoutIndex = [...infoContainer.children].findIndex((wrk) => wrk.getAttribute("data-id") === workout.id);
    this._renderWorkout(workout, workoutIndex);

    this._removeEditFields();
  }
  _setLocalStorage() {
    const objForStorage = this.#workouts.map((workout) => JSON.stringify(workout, getCircularReplacer()));
    objForStorage.forEach((obj, i) => localStorage.setItem(this.#workouts[i].id, obj));
    // localStorage.setItem("workouts", objForStorage);
  }
  _getLocalStorage() {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      const workout = JSON.parse(localStorage.getItem(key));
      workout.date = new Date(workout.date);
      this.#workouts.push(workout);
      this._renderWorkout(workout);
    }
  }
  _showAllMarkers() {
    const markerArray = this.#workouts.map((workout) => workout.coords);
    const bounds = L.latLngBounds(markerArray);
    this.#map.fitBounds(bounds);
  }
}
const app = new App();

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}
