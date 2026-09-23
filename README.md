# sky light

Build a complete weather app using only vanilla HTML, CSS, and JavaScript (no frameworks, no build tools, single self-contained file if possible).



Data source:

- Use the free Open-Meteo API (no API key required) for weather data and geocoding.

- Geocoding endpoint: https://geocoding-api.open-meteo.com/v1/search?name={city}&count=5

- Forecast endpoint: https://api.open-meteo.com/v1/forecast with current, hourly, and daily parameters.



Features required:

1. City search bar with live autocomplete suggestions as the user types.

2. A "use my location" button using the browser Geolocation API.

3. Current weather section showing:

   - Temperature (°C, with a toggle for °F)

   - "Feels like" temperature

   - Weather condition with a matching icon (sunny, cloudy, rain, snow, storm, fog, etc.)

   - Humidity, wind speed, precipitation, UV index if available

   - Day/night indicator

4. Hourly forecast section:

   - Show the next 24 hours in a horizontally scrollable strip

   - Each hour shows: time, weather icon, temperature, and chance of precipitation

   - Highlight the current hour

5. 5-day forecast section:

   - Each day shows: day name, weather icon, high/low temperature, and chance of precipitation

   - Clicking a day expands or shows that day's hourly breakdown

6. Loading and error states (e.g., city not found, no internet, location permission denied).

7. Responsive design that works well on both mobile and desktop.

8. Dynamic background/theme that changes based on weather condition and time of day (day vs night).

9. Remember the last searched city using localStorage so it loads automatically on next visit.

10. Clean, modern UI with smooth transitions, readable typography, and accessible color contrast.



Technical requirements:

- Use fetch() for all API calls with proper error handling (try/catch).

- Debounce the city search input to avoid excessive API calls.

- Map Open-Meteo's WMO weather codes to human-readable conditions and icons.

- Keep all CSS and JS in the same HTML file (inline <style> and <script>), well-commented and organized into clear sections (HTML structure, CSS styling, JS logic: API calls, rendering, event handlers). code in html ,css and js

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c276a7f1-2b75-5809-b693-b7dce519aaa7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
