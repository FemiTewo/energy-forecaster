const DEFAULT_CITY = 'Houston, TX';

const form = document.getElementById('city-form');
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-button');
const status = document.getElementById('status');

let solarChart = null;
let windChart = null;

function makeChart(canvasId, label, labels, data, color, yTitle) {
  return new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: label, data: data, backgroundColor: color }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: yTitle }
        }
      }
    }
  });
}

function showCharts(labels, solar, wind) {
  if (solarChart) {
    solarChart.data.labels = labels;
    solarChart.data.datasets[0].data = solar;
    solarChart.update();
    windChart.data.labels = labels;
    windChart.data.datasets[0].data = wind;
    windChart.update();
  } else {
    solarChart = makeChart('solar-chart', 'Solar energy (kWh/m² per day)', labels, solar, '#fda503', 'kWh/m² per day');
    windChart = makeChart('wind-chart', 'Average wind speed at 100 m (m/s)', labels, wind, '#4990e2', 'Wind speed (m/s)');
  }
}

// Turn what the person typed ("Lagos", "Houston, TX", "Paris, France") into a place.
async function findCity(query) {
  const parts = query.split(',').map(function (p) { return p.trim(); });
  const name = parts[0];
  const hint = (parts[1] || '').toLowerCase();

  const url = 'https://geocoding-api.open-meteo.com/v1/search' +
    '?name=' + encodeURIComponent(name) +
    '&count=10&language=en&format=json';
  const response = await fetch(url);
  if (!response.ok) throw new Error('City search returned ' + response.status);
  const json = await response.json();

  if (!json.results || json.results.length === 0) return null;

  // If a state or country was typed after the comma, prefer a result that matches it.
  if (hint) {
    const match = json.results.find(function (r) {
      return [r.admin1, r.country, r.country_code].some(function (v) {
        return v && v.toLowerCase().startsWith(hint);
      });
    });
    if (match) return match;
  }
  return json.results[0];
}

// Average the hourly wind speeds into one value per day.
function dailyAverageWind(hourly, days) {
  return days.map(function (day) {
    const speeds = [];
    hourly.time.forEach(function (t, i) {
      if (t.slice(0, 10) === day && hourly.wind_speed_100m[i] !== null) {
        speeds.push(hourly.wind_speed_100m[i]);
      }
    });
    if (speeds.length === 0) return null;
    const avg = speeds.reduce(function (a, b) { return a + b; }, 0) / speeds.length;
    return Math.round(avg * 10) / 10;
  });
}

function dayLabel(isoDate) {
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
}

function placeName(place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(', ');
}

async function loadForecast(query) {
  status.classList.remove('error');
  status.textContent = 'Loading forecast...';
  searchButton.disabled = true;

  try {
    const place = await findCity(query);
    if (!place) {
      throw new Error('No city found for "' + query + '". Check the spelling or try adding the country.');
    }

    const url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=' + place.latitude +
      '&longitude=' + place.longitude +
      '&daily=shortwave_radiation_sum' +
      '&hourly=wind_speed_100m' +
      '&wind_speed_unit=ms' +
      '&timezone=auto' +
      '&forecast_days=7';

    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather service returned ' + response.status);
    const json = await response.json();

    const days = json.daily.time;
    const labels = days.map(dayLabel);

    // MJ/m2 per day -> kWh/m2 per day (1 kWh = 3.6 MJ)
    const solar = json.daily.shortwave_radiation_sum.map(function (mj) {
      return mj === null ? null : Math.round((mj / 3.6) * 100) / 100;
    });
    const wind = dailyAverageWind(json.hourly, days);

    showCharts(labels, solar, wind);
    status.textContent = placeName(place) + ' · 7-day forecast · data from Open-Meteo';
  } catch (err) {
    status.textContent = 'Could not load the forecast: ' + err.message;
    status.classList.add('error');
  } finally {
    searchButton.disabled = false;
  }
}

form.addEventListener('submit', function (event) {
  event.preventDefault();
  const query = cityInput.value.trim();
  if (query) loadForecast(query);
});

cityInput.value = DEFAULT_CITY;
loadForecast(DEFAULT_CITY);
