const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const STORE_KEY = "skycast:last";
const UNIT_KEY = "skycast:unit";

// WMO weather code -> label, day icon, night icon, theme group
const WMO = {
  0:["Clear sky","☀️","🌙","clear"],
  1:["Mainly clear","🌤️","🌙","clear"],
  2:["Partly cloudy","⛅","☁️","cloud"],
  3:["Overcast","☁️","☁️","cloud"],
  45:["Fog","🌫️","🌫️","fog"],
  48:["Freezing fog","🌫️","🌫️","fog"],
  51:["Light drizzle","🌦️","🌧️","rain"],
  53:["Drizzle","🌦️","🌧️","rain"],
  55:["Heavy drizzle","🌧️","🌧️","rain"],
  56:["Freezing drizzle","🌧️","🌧️","rain"],
  57:["Freezing drizzle","🌧️","🌧️","rain"],
  61:["Light rain","🌦️","🌧️","rain"],
  63:["Rain","🌧️","🌧️","rain"],
  65:["Heavy rain","🌧️","🌧️","rain"],
  66:["Freezing rain","🌧️","🌧️","rain"],
  67:["Freezing rain","🌧️","🌧️","rain"],
  71:["Light snow","🌨️","🌨️","snow"],
  73:["Snow","❄️","❄️","snow"],
  75:["Heavy snow","❄️","❄️","snow"],
  77:["Snow grains","🌨️","🌨️","snow"],
  80:["Rain showers","🌦️","🌧️","rain"],
  81:["Rain showers","🌧️","🌧️","rain"],
  82:["Violent showers","⛈️","⛈️","storm"],
  85:["Snow showers","🌨️","🌨️","snow"],
  86:["Snow showers","❄️","❄️","snow"],
  95:["Thunderstorm","⛈️","⛈️","storm"],
  96:["Thunderstorm, hail","⛈️","⛈️","storm"],
  99:["Thunderstorm, hail","⛈️","⛈️","storm"]
};
function decode(code, isDay){
  const e = WMO[code] || ["Unknown","❔","❔","cloud"];
  return { label:e[0], icon: isDay ? e[1] : e[2], group:e[3] };
}

// Theme palettes per condition group + day/night
const THEMES = {
  clear:{day:["#4fa8e0","#0b5f9e"],night:["#1b2a4a","#070d1c"]},
  cloud:{day:["#7f93a8","#39506b"],night:["#2a3446","#10161f"]},
  rain:{day:["#4b6a8a","#233448"],night:["#1f2a3a","#0a1118"]},
  snow:{day:["#8fb8d8","#4a6785"],night:["#26364d","#0d141f"]},
  storm:{day:["#4a4560","#1c1a2b"],night:["#2a2440","#0c0a16"]},
  fog:{day:["#8e9aa4","#4c565f"],night:["#2b3238","#12161a"]}
};

let unit = localStorage.getItem(UNIT_KEY) === "F" ? "F" : "C";
let data = null;      // last forecast payload
let place = null;     // {name, country, admin1, latitude, longitude}
let openDay = -1;

const $ = id => document.getElementById(id);
const statusEl = $("status"), appEl = $("app");

const toF = c => c * 9/5 + 32;
const t = c => (c == null ? "—" : Math.round(unit === "C" ? c : toF(c)) + "°");
function debounce(fn, ms){ let h; return (...a)=>{ clearTimeout(h); h = setTimeout(()=>fn(...a), ms); }; }

function showStatus(msg, isError){
  statusEl.className = "card status" + (isError ? " error" : "");
  statusEl.innerHTML = isError ? msg : '<div class="spinner"></div>' + msg;
  statusEl.classList.remove("hidden");
  if (isError || !data) appEl.classList.add("hidden");
}
function clearStatus(){ statusEl.classList.add("hidden"); appEl.classList.remove("hidden"); }

function applyTheme(group, isDay){
  const pal = (THEMES[group] || THEMES.cloud)[isDay ? "day" : "night"];
  document.body.style.background = `linear-gradient(160deg,${pal[0]},${pal[1]})`;
  document.body.style.backgroundAttachment = "fixed";
}

async function geocode(name){
  // English names, wider result set so Indian towns aren't crowded out.
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=10&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed. Please try again.");
  const json = await res.json();
  const results = json.results || [];
  // India-first ordering, then by population so big cities lead.
  return results
    .sort((a, b) =>
      (b.country_code === "IN") - (a.country_code === "IN") ||
      (b.population || 0) - (a.population || 0))
    .slice(0, 5);
}

async function reverseName(lat, lon){
  // Open-Meteo has no reverse geocoding; show coordinates as a fallback label.
  return { name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, country:"Your location", latitude:lat, longitude:lon };
}

async function getForecast(lat, lon){
  const params = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: "auto", forecast_days: "7",
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day,uv_index",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error("Weather service is unavailable right now.");
  return res.json();
}

async function load(p){
  place = p;
  showStatus(`Loading weather for ${p.name}…`);
  try{
    data = await getForecast(p.latitude, p.longitude);
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
    openDay = -1;
    render();
    clearStatus();
  }catch(err){
    const offline = !navigator.onLine;
    showStatus(offline ? "You appear to be offline. Check your connection and try again."
                       : (err.message || "Something went wrong."), true);
  }
}

function render(){
  const c = data.current, u = data.current_units;
  const isDay = c.is_day === 1;
  const cond = decode(c.weather_code, isDay);

  $("nowIcon").textContent = cond.icon;
  $("nowTemp").textContent = t(c.temperature_2m);
  $("nowCond").textContent = cond.label;
  $("place").textContent = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
  $("localTime").textContent = new Date(c.time).toLocaleString(undefined,{weekday:"long",hour:"2-digit",minute:"2-digit"});
  $("dayNight").textContent = isDay ? "🌞 Day" : "🌜 Night";

  $("sFeel").textContent = t(c.apparent_temperature);
  $("sHum").textContent = (c.relative_humidity_2m ?? "—") + "%";
  $("sWind").textContent = Math.round(c.wind_speed_10m) + " " + (u.wind_speed_10m || "km/h");
  $("sPrec").textContent = (c.precipitation ?? 0) + " mm";
  $("sUv").textContent = c.uv_index == null ? "—" : Math.round(c.uv_index);

  applyTheme(cond.group, isDay);
  renderHourly();
  renderDaily();
}

// find index of the hour nearest "now" in local time
function currentHourIndex(){
  const now = new Date(data.current.time);
  const target = now.toISOString().slice(0,13);
  const idx = data.hourly.time.findIndex(s => s.slice(0,13) === target);
  return idx < 0 ? 0 : idx;
}

function hourCard(i, markCurrent){
  const h = data.hourly;
  const cond = decode(h.weather_code[i], h.is_day[i] === 1);
  const time = new Date(h.time[i]).toLocaleTimeString(undefined,{hour:"numeric"});
  const pop = h.precipitation_probability?.[i];
  return `<div class="hour${markCurrent ? " current" : ""}">
      <div class="t">${markCurrent ? "Now" : time}</div>
      <div class="i">${cond.icon}</div>
      <div class="d">${t(h.temperature_2m[i])}</div>
      <div class="p">${pop == null ? "" : "💧" + pop + "%"}</div>
    </div>`;
}

function renderHourly(){
  const start = currentHourIndex();
  let html = "";
  for (let i = start; i < Math.min(start + 24, data.hourly.time.length); i++){
    html += hourCard(i, i === start);
  }
  $("hourly").innerHTML = html;
}

function renderDaily(){
  const d = data.daily;
  let html = "";
  for (let i = 0; i < Math.min(5, d.time.length); i++){
    const cond = decode(d.weather_code[i], true);
    const name = i === 0 ? "Today"
      : new Date(d.time[i]).toLocaleDateString(undefined,{weekday:"long"});
    const pop = d.precipitation_probability_max?.[i];
    html += `
      <button class="day" data-day="${i}" aria-expanded="${openDay === i}" aria-controls="panel-${i}">
        <span class="name">${name}</span>
        <span class="ico">${cond.icon}</span>
        <span class="hl">${t(d.temperature_2m_max[i])}<small>${t(d.temperature_2m_min[i])}</small></span>
        <span class="pop">${pop == null ? "" : "💧" + pop + "%"}</span>
      </button>
      <div class="day-panel${openDay === i ? " open" : ""}" id="panel-${i}">
        <div class="strip">${openDay === i ? dayHours(d.time[i]) : ""}</div>
      </div>`;
  }
  $("daily").innerHTML = html;
  $("daily").querySelectorAll(".day").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.day);
      openDay = openDay === i ? -1 : i;
      renderDaily();
    });
  });
}

function dayHours(dateStr){
  let html = "";
  data.hourly.time.forEach((ts, i) => {
    if (ts.startsWith(dateStr) && i % 2 === 0) html += hourCard(i, false);
  });
  return html || '<div class="status">No hourly data.</div>';
}

const q = $("q"), suggest = $("suggest");

function closeSuggest(){ suggest.classList.remove("open"); q.setAttribute("aria-expanded","false"); }

const onType = debounce(async () => {
  const term = q.value.trim();
  if (term.length < 2){ closeSuggest(); return; }
  try{
    const results = await geocode(term);
    if (!results.length){
      suggest.innerHTML = '<button type="button" disabled>No matching city found</button>';
    } else {
      suggest.innerHTML = results.map((r, i) =>
        `<button type="button" role="option" data-i="${i}">${r.name}
          <small>${[r.admin1, r.country].filter(Boolean).join(", ")}</small></button>`).join("");
      suggest.querySelectorAll("button[data-i]").forEach(b => {
        b.addEventListener("click", () => {
          const r = results[Number(b.dataset.i)];
          q.value = r.name;
          closeSuggest();
          load(r);
        });
      });
    }
    suggest.classList.add("open");
    q.setAttribute("aria-expanded","true");
  }catch(err){
    closeSuggest();
    showStatus(navigator.onLine ? err.message : "You appear to be offline.", true);
  }
}, 320);

q.addEventListener("input", onType);
q.addEventListener("keydown", async e => {
  if (e.key === "Escape") closeSuggest();
  if (e.key === "Enter"){
    closeSuggest();
    const term = q.value.trim();
    if (!term) return;
    try{
      const r = await geocode(term);
      if (!r.length) return showStatus(`We couldn't find “${term}”. Try another spelling.`, true);
      load(r[0]);
    }catch(err){ showStatus(err.message, true); }
  }
});
document.addEventListener("click", e => { if (!suggest.contains(e.target) && e.target !== q) closeSuggest(); });

// Geolocation
$("geo").addEventListener("click", () => {
  if (!navigator.geolocation) return showStatus("Your browser doesn't support location access.", true);
  showStatus("Finding your location…");
  navigator.geolocation.getCurrentPosition(
    async pos => load(await reverseName(pos.coords.latitude, pos.coords.longitude)),
    err => showStatus(err.code === 1
      ? "Location permission denied. Search for a city instead."
      : "We couldn't get your location. Try searching for a city.", true),
    { timeout: 10000 }
  );
});

// Unit toggle
$("unit").addEventListener("click", () => {
  unit = unit === "C" ? "F" : "C";
  localStorage.setItem(UNIT_KEY, unit);
  $("uC").classList.toggle("on", unit === "C");
  $("uF").classList.toggle("on", unit === "F");
  if (data) render();
});
$("uC").classList.toggle("on", unit === "C");
$("uF").classList.toggle("on", unit === "F");

window.addEventListener("online", () => { if (place) load(place); });

const INDIA_CITIES = [
  { name:"New Delhi", admin1:"Delhi", country:"India", latitude:28.6139, longitude:77.2090 },
  { name:"Mumbai", admin1:"Maharashtra", country:"India", latitude:19.0760, longitude:72.8777 },
  { name:"Bengaluru", admin1:"Karnataka", country:"India", latitude:12.9716, longitude:77.5946 },
  { name:"Kolkata", admin1:"West Bengal", country:"India", latitude:22.5726, longitude:88.3639 },
  { name:"Chennai", admin1:"Tamil Nadu", country:"India", latitude:13.0827, longitude:80.2707 },
  { name:"Jaipur", admin1:"Rajasthan", country:"India", latitude:26.9124, longitude:75.7873 },
  { name:"Roorkee", admin1:"Uttarakhand", country:"India", latitude:29.8543, longitude:77.8880 },
  { name:"Shimla", admin1:"Himachal Pradesh", country:"India", latitude:31.1048, longitude:77.1734 }
];
const chips = $("chips");
INDIA_CITIES.forEach(city => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = city.name;
  b.addEventListener("click", () => { q.value = city.name; closeSuggest(); load(city); });
  chips.appendChild(b);
});

(function init(){
  let saved = null;
  try{ saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); }catch(_){}
  if (saved && saved.latitude != null){ q.value = saved.name; load(saved); }
  else { q.value = INDIA_CITIES[0].name; load(INDIA_CITIES[0]); }
})();
