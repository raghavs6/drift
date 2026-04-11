const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const LOCATION_COORDINATES = {
  "Baraboo, WI": { latitude: 43.4711, longitude: -89.7443 },
  "Cross Plains, WI": { latitude: 43.1144, longitude: -89.6429 },
  "Madison, WI": { latitude: 43.0731, longitude: -89.4012 },
  "Blue Mounds, WI": { latitude: 43.0178, longitude: -89.8329 },
  "Dodgeville, WI": { latitude: 42.9608, longitude: -90.1301 },
  "Middleton, WI": { latitude: 43.0972, longitude: -89.5043 },
  "Wisconsin Dells, WI": { latitude: 43.6275, longitude: -89.7709 },
  "Oglesby, IL": { latitude: 41.2959, longitude: -89.0618 },
  "Chicago, IL": { latitude: 41.8781, longitude: -87.6298 },
  "Minneapolis, MN": { latitude: 44.9778, longitude: -93.2650 },
  "Two Harbors, MN": { latitude: 47.0227, longitude: -91.6707 },
  "Park Rapids, MN": { latitude: 46.9222, longitude: -95.0586 },
  "Spearfish, SD": { latitude: 44.4908, longitude: -103.8594 },
  "Interior, SD": { latitude: 43.7286, longitude: -101.9838 },
  "Sioux Falls, SD": { latitude: 43.5446, longitude: -96.7311 },
  "Medora, ND": { latitude: 46.9139, longitude: -103.5243 },
  "Fargo, ND": { latitude: 46.8772, longitude: -96.7898 },
  "Empire, MI": { latitude: 44.8128, longitude: -86.0606 },
  "Munising, MI": { latitude: 46.4111, longitude: -86.6479 },
  "Ontonagon, MI": { latitude: 46.8738, longitude: -89.3182 },
  "Detroit, MI": { latitude: 42.3314, longitude: -83.0458 },
};

function weatherLabelFromCode(code) {
  const map = {
    0: "Clear",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    85: "Snow showers",
    86: "Snow showers",
    95: "Thunderstorms",
    96: "Thunderstorms",
    99: "Thunderstorms",
  };

  return map[code] || "Mixed conditions";
}

function windDescriptor(speedMph) {
  if (speedMph < 5) return "calm wind";
  if (speedMph < 11) return "light wind";
  if (speedMph < 20) return "steady wind";
  return "windy";
}

function formatTimeLabel(isoString) {
  if (!isoString) return "--";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  }).toLowerCase();
}

export async function fetchWeatherForLocation(locationLabel, signal) {
  const coordinates = LOCATION_COORDINATES[locationLabel];

  if (!coordinates) {
    throw new Error(`No weather coordinates configured for ${locationLabel}`);
  }

  const forecast = await fetch(
    `${FORECAST_URL}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=temperature_2m,weather_code,wind_speed_10m&daily=sunset&timezone=auto&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=1`,
    { signal },
  );

  if (!forecast.ok) {
    throw new Error(`Forecast failed with status ${forecast.status}`);
  }

  const forecastData = await forecast.json();
  const current = forecastData?.current ?? {};
  const sunset = forecastData?.daily?.sunset?.[0];
  const tempF = Math.round(current.temperature_2m ?? 0);
  const windMph = Math.round(current.wind_speed_10m ?? 0);

  return {
    temperature: `${tempF}°F`,
    wind: `${windMph} mph`,
    sky: weatherLabelFromCode(current.weather_code),
    summary: `${tempF}°F · ${weatherLabelFromCode(current.weather_code).toLowerCase()} · ${windDescriptor(windMph)}`,
    sunset: formatTimeLabel(sunset),
    updatedAt: current.time || null,
  };
}
