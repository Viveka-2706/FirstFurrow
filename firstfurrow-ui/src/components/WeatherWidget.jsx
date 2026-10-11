import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useReference } from '../data/useReference';
import { useLang } from '../i18n/useLang';
import './WeatherWidget.css';

// Open-Meteo refreshes its "current" block about every 15 minutes, so polling every
// 5 minutes picks up a change within minutes of it being published.
const POLL_MS = 5 * 60 * 1000;
const RETRY_MS = 30 * 1000; // retry quickly after a failed fetch

// Open-Meteo's WMO weather codes → readable label + icon (moon at night).
function describeWeatherCode(code, isDay) {
  if (code === 0) return { key: 'weather.clear', icon: isDay ? '☀️' : '🌙' };
  if ([1, 2, 3].includes(code)) return { key: 'weather.partly', icon: isDay ? '⛅' : '☁️' };
  if ([45, 48].includes(code)) return { key: 'weather.fog', icon: '🌫️' };
  if ([51, 53, 55, 56, 57].includes(code)) return { key: 'weather.drizzle', icon: '🌦️' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { key: 'weather.rain', icon: '🌧️' };
  if ([95, 96, 99].includes(code)) return { key: 'weather.thunder', icon: '⛈️' };
  return { key: 'weather.mixed', icon: '🌤️' };
}

function buildUrl({ lat, lon }) {
  const p = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day',
    hourly: 'precipitation_probability',
    daily: 'precipitation_probability_max',
    forecast_days: 1,
    timezone: 'auto',
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

function parse(json) {
  const c = json.current;
  if (!c) throw new Error('No current weather in response');
  // rain chance for the CURRENT hour; fall back to today's maximum
  const hourIdx = json.hourly?.time?.findIndex((x) => x.slice(0, 13) === c.time.slice(0, 13)) ?? -1;
  const rainChance = (hourIdx >= 0 ? json.hourly.precipitation_probability?.[hourIdx] : null) ?? json.daily?.precipitation_probability_max?.[0] ?? null;
  return {
    temp: Math.round(c.temperature_2m),
    feels: Math.round(c.apparent_temperature),
    humidity: Math.round(c.relative_humidity_2m),
    wind: Math.round(c.wind_speed_10m),
    rainingNow: (c.precipitation ?? 0) > 0,
    weatherInfo: describeWeatherCode(c.weather_code, c.is_day === 1),
    rainChance,
  };
}

export default function WeatherWidget({ region }) {
  const { t, region: regionLabel } = useLang();
  const regionName = regionLabel(region);
  const { regionCoordinates } = useReference();
  const lat = regionCoordinates[region]?.lat;
  const lon = regionCoordinates[region]?.lon;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  // state is tagged with its region so a region change shows "loading" without an effect reset
  const [state, setState] = useState({ region: null, data: null, fetchedAt: 0, failed: false });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!hasCoords) return undefined;
    let alive = true;
    let timer;
    let controller;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch(buildUrl({ lat, lon }), { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error('Weather service unavailable');
        const data = parse(await res.json());
        if (!alive) return true;
        setState({ region, data, fetchedAt: Date.now(), failed: false });
        return true;
      } catch (err) {
        if (!alive || err.name === 'AbortError') return true;
        // keep the last good reading on screen; just mark it as stale
        setState((prev) => (prev.region === region && prev.data ? { ...prev, failed: true } : { region, data: null, fetchedAt: 0, failed: true }));
        return false;
      }
    };

    const tick = async () => {
      // don't spend requests while the tab is hidden; we refresh the moment it's visible again
      const ok = document.hidden ? true : await load();
      if (alive) timer = setTimeout(tick, ok ? POLL_MS : RETRY_MS);
    };
    const refreshNow = () => { clearTimeout(timer); tick(); };
    const onVisible = () => { if (document.visibilityState === 'visible') refreshNow(); };

    tick();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', refreshNow);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', refreshNow);
    };
  }, [region, lat, lon, hasCoords]);

  // re-render every 30s so "updated N min ago" stays truthful
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const current = state.region === region ? state : null;

  if (!hasCoords || (current?.failed && !current.data)) {
    return (
      <div className="weather-widget is-error">
        <span className="weather-widget-icon">⚠️</span>
        <span>{t('weather.error', { region: regionName })}</span>
      </div>
    );
  }

  if (!current?.data) {
    return (
      <div className="weather-widget is-loading">
        <span className="weather-widget-icon">🌤️</span>
        <span>{t('weather.loading', { region: regionName })}</span>
      </div>
    );
  }

  const { temp, feels, humidity, wind, rainingNow, weatherInfo, rainChance } = current.data;
  const highRain = rainChance != null && rainChance >= 55;
  const mins = Math.max(0, Math.floor((now - current.fetchedAt) / 60000));
  const ago = mins < 1 ? t('weather.justNow') : t('weather.minAgo', { n: mins });
  const headline = t('weather.headline', { region: regionName, temp, label: t(weatherInfo.key).toLowerCase() });
  const tip = rainingNow ? t('weather.tipNow') : highRain ? t('weather.tipRain') : t('weather.tipDry');

  return (
    <motion.div className="weather-widget is-ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <motion.span
        key={weatherInfo.icon}
        className="weather-widget-icon"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: [0, -6, 6, 0] }}
        transition={{ scale: { duration: 0.3 }, rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
      >
        {weatherInfo.icon}
      </motion.span>
      <div className="weather-widget-body">
        {/* keyed on the values, so the line gently flashes whenever the reading changes */}
        <motion.span
          key={`${temp}-${weatherInfo.key}-${rainChance}`}
          className="weather-widget-headline"
          initial={{ opacity: 0.25, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {headline}
          {rainChance != null && t('weather.rainChance', { n: rainChance })}
        </motion.span>
        <span className="weather-widget-meta">{t('weather.meta', { feels, hum: humidity, wind })}</span>
        <span className={`weather-widget-tip ${rainingNow || highRain ? 'is-rain' : ''}`}>{tip}</span>
        <span className={`weather-widget-status ${current.failed ? 'is-stale' : ''}`}>
          <i aria-hidden="true" />
          {current.failed ? t('weather.stale', { ago }) : t('weather.live', { ago })}
        </span>
      </div>
    </motion.div>
  );
}
