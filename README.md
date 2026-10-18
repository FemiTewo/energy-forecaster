# Energy Forecaster

A small web app that shows a 7-day solar and wind energy forecast for any city.

Type a city, and the page looks up its coordinates, fetches the weather forecast and draws two charts:

- **Solar:** daily sunlight energy in kWh/m² per day
- **Wind:** average wind speed at 100 m (typical turbine hub height) in m/s

## How it works

- Plain HTML, CSS and JavaScript, no build step
- [Chart.js](https://www.chartjs.org/) 4 for the charts
- [Open-Meteo](https://open-meteo.com/) for the city search (geocoding) and the weather forecast. It is free and needs no API key
- Hourly wind speeds are averaged into one value per day
- Solar radiation is converted from MJ/m² to kWh/m²
- Network and city-not-found errors are shown on the page instead of failing silently

## Run it

Open `index.html` in a browser. An internet connection is needed for the charts library and the forecast data.

## Notes

These charts show raw sunlight and wind speed, not electricity output. Estimating real power output would need extra inputs such as panel area or turbine type.

## History

Originally built in February 2023 with hardcoded sample data for one day. Revived in October 2026:

- Fixed a bug where the charts never rendered (chart containers were `<div>`s instead of `<canvas>` elements)
- Fixed absolute file paths that broke the page when opened directly
- Upgraded Chart.js from 2.8 to 4.4
- Replaced the sample data with a live 7-day forecast and added city search
