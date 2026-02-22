const API_KEY = "3e239257118c0b299ecfab223601cd62";

// 캐시
const CACHE_KEY = "momentum:weatherCache:v1";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

export function initWeather() {
  const weatherRoot = document.getElementById("weather");
  const refreshBtn = document.getElementById("weather-refresh");
  if (!weatherRoot) return;

  function $(sel) {
    return weatherRoot.querySelector(sel);
  }

  const elCity = $(".weatherCity");
  const elTemp = $(".weatherTemp");
  const elDesc = $(".weatherDesc");
  const elHL = $(".weatherHL");
  const elHum = $(".weatherHum");
  const elWind = $(".weatherWind");
  const elIcon = $(".weatherIcon");

  const WEATHER_BG = {
    Clear: "https://images.unsplash.com/photo-1502082553048-f009c37129b9",
    Clouds: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63",
    Rain: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
    Drizzle: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
    Thunderstorm: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7",
    Snow: "https://images.unsplash.com/photo-1608889175112-9fa9d4b61b94",
    Mist: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227",
    Fog: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227",
    Haze: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227",
    Smoke: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227",
    Dust: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227",
    Sand: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227",
    Ash: "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227",
    Squall: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63",
    Tornado: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7",
  };

  function setStatus(msg) {
    if (elCity) elCity.textContent = msg;
  }

  function roundTemp(v) {
    if (typeof v !== "number" || Number.isNaN(v)) return "--";
    return String(Math.round(v));
  }

  function applyWeatherBackground(main) {
    const base = WEATHER_BG[main] || WEATHER_BG.Clouds;
    const joiner = base.includes("?") ? "&" : "?";
    const finalUrl = `${base}${joiner}auto=format&fit=crop&w=900&q=80`;
    weatherRoot.style.backgroundImage = `url("${finalUrl}")`;
  }

  function renderWeather(data) {
    const city = data?.name ?? "내 위치";
    const temp = data?.main?.temp;
    const tMax = data?.main?.temp_max;
    const tMin = data?.main?.temp_min;

    const main = data?.weather?.[0]?.main;
    const desc = data?.weather?.[0]?.description ?? data?.weather?.[0]?.main ?? "--";
    const icon = data?.weather?.[0]?.icon;

    const hum = data?.main?.humidity;
    const wind = data?.wind?.speed;

    applyWeatherBackground(main);

    if (elCity) elCity.textContent = city;
    if (elTemp) elTemp.textContent = `${roundTemp(temp)}°`;
    if (elDesc) elDesc.textContent = desc;
    if (elHL) elHL.textContent = `H: ${roundTemp(tMax)}° L: ${roundTemp(tMin)}°`;

    if (elHum) elHum.textContent = `${hum ?? "--"}%`;
    if (elWind) elWind.textContent = `${wind ?? "--"}m/s`;

    if (elIcon) {
      elIcon.innerHTML = icon
        ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="" />`
        : "";
    }
  }

  function saveCache(payload) {
    try {
      localStorage.setItem(JSON.stringify({ ts: Date.now(), payload }));
    } catch {}
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const obj = JSON.parse(raw);
      if (!obj?.ts || !obj?.payload) return null;
      if (Date.now() - obj.ts > CACHE_TTL_MS) return null;

      return obj.payload;
    } catch {
      return null;
    }
  }

  async function fetchWeather(lat, lon) {
    const url =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
      `&appid=${API_KEY}&units=metric&lang=kr`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    return await res.json();
  }

  function getGeo() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 2 * 60 * 1000,
      });
    });
  }

  async function loadWeather({ force = false } = {}) {
    if (!force) {
      const cached = loadCache();
      if (cached) {
        renderWeather(cached);
        return;
      }
    }

    try {
      setStatus("내 위치 확인중…");

      const pos = await getGeo();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      setStatus("날씨 불러오는 중…");
      const data = await fetchWeather(lat, lon);

      renderWeather(data);
      // 캐시 저장
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), payload: data }));
      } catch {}
    } catch (err) {
      console.error(err);

      if (elCity) elCity.textContent = "위치 권한이 필요해요";
      if (elTemp) elTemp.textContent = "--°";
      if (elDesc) elDesc.textContent = "브라우저 위치 허용 후 새로고침";
      if (elHL) elHL.textContent = "H: --° L: --°";
      if (elIcon) elIcon.innerHTML = "";
      if (elHum) elHum.textContent = "--%";
      if (elWind) elWind.textContent = "--m/s";

      applyWeatherBackground("Clouds");
    }
  }

  refreshBtn?.addEventListener("click", () => loadWeather({ force: true }));

  loadWeather();
}