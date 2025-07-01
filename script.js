const apiKey = "697a257712a8563f985e4465b8c3ff31";

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");
const locationBtn = document.getElementById("locationBtn");
const recentDropdown = document.getElementById("recentDropdown");
const forecastContainer = document.getElementById("forecastContainer");
const forecastCards = document.getElementById("forecastCards");

function fetchWeatherByCity(city) {
  if (!city) {
    weatherResult.innerHTML = `<p class="text-red-600">Please enter a city name.</p>`;
    return;
  }

  weatherResult.innerHTML = `<p class="text-gray-600">Fetching weather data...</p>`;
  forecastContainer.classList.add("hidden");

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  Promise.all([
    fetch(currentUrl).then((res) => {
      if (!res.ok) throw new Error("City not found");
      return res.json();
    }),
    fetch(forecastUrl).then((res) => {
      if (!res.ok) throw new Error("Forecast not available");
      return res.json();
    }),
  ])
    .then(([currentData, forecastData]) => {
      displayCurrentWeather(currentData);
      displayForecast(forecastData);
      saveRecentCity(currentData.name);
    })
    .catch((error) => {
      weatherResult.innerHTML = `<p class="text-red-600">Error: ${error.message}. Please enter a valid city.</p>`;
    });
}

function displayCurrentWeather(data) {
  const icon = data.weather[0].icon;
  const iconURL = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  weatherResult.innerHTML = `
    <h2 class="text-xl font-semibold text-green-700 mb-2">${data.name}, ${data.sys.country}</h2>
    <img src="${iconURL}" alt="${data.weather[0].description}" class="mx-auto w-20 h-20" />
    <p class="text-gray-700">Temperature: ${data.main.temp} °C</p>
    <p class="text-gray-700">Condition: ${data.weather[0].main}</p>
    <p class="text-gray-700">Humidity: ${data.main.humidity}%</p>
    <p class="text-gray-700">Wind Speed: ${data.wind.speed} m/s</p>
  `;
}

function displayForecast(data) {
  const dailyMap = new Map();

  data.list.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    if (!dailyMap.has(date)) dailyMap.set(date, entry);
  });

  forecastCards.innerHTML = "";
  dailyMap.forEach((day, date) => {
    const iconURL = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
    const card = `
      <div class="p-4 bg-green-100 rounded-lg shadow">
        <p class="font-semibold">${date}</p>
        <img src="${iconURL}" alt="${day.weather[0].main}" class="w-12 h-12 mx-auto" />
        <p>Temp: ${day.main.temp} °C</p>
        <p>Wind: ${day.wind.speed} m/s</p>
        <p>Humidity: ${day.main.humidity}%</p>
      </div>
    `;
    forecastCards.innerHTML += card;
  });

  forecastContainer.classList.remove("hidden");
}

function fetchWeatherByCoords(lat, lon) {
  weatherResult.innerHTML = `<p class="text-gray-600">Fetching weather for current location...</p>`;
  forecastContainer.classList.add("hidden");

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("Location error");
      return res.json();
    })
    .then((data) => {
      displayCurrentWeather(data);
      saveRecentCity(data.name);
    })
    .catch(() => {
      weatherResult.innerHTML = `<p class="text-red-600">Could not fetch weather for current location.</p>`;
    });
}

function saveRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  if (!cities.includes(city)) {
    cities.unshift(city);
    if (cities.length > 5) cities.pop();
    localStorage.setItem("recentCities", JSON.stringify(cities));
    updateDropdown();
  }
}

function updateDropdown() {
  const cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  recentDropdown.innerHTML = "";
  recentDropdown.classList.toggle("hidden", cities.length === 0);

  cities.forEach((city) => {
    const btn = document.createElement("button");
    btn.className = "block w-full text-left px-4 py-2 hover:bg-green-100";
    btn.textContent = city;
    btn.addEventListener("click", () => fetchWeatherByCity(city));
    recentDropdown.appendChild(btn);
  });
}

// Event Listeners
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  fetchWeatherByCity(city);
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      () => {
        weatherResult.innerHTML = `<p class="text-red-600">Location access denied.</p>`;
      }
    );
  } else {
    weatherResult.innerHTML = `<p class="text-red-600">Geolocation not supported by your browser.</p>`;
  }
});

updateDropdown();
