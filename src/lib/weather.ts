export interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
}

export interface DailyForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
}

const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const LAT = process.env.WEATHER_LAT || "22.5431"; // Shenzhen default
const LON = process.env.WEATHER_LON || "114.0579";

function weatherIconToEmoji(icon: string): string {
  const map: Record<string, string> = {
    "01d": "sun", "01n": "moon",
    "02d": "partly-cloudy", "02n": "partly-cloudy-night",
    "03d": "cloudy", "03n": "cloudy",
    "04d": "overcast", "04n": "overcast",
    "09d": "rain", "09n": "rain",
    "10d": "rain-sun", "10n": "rain-night",
    "11d": "thunder", "11n": "thunder",
    "13d": "snow", "13n": "snow",
    "50d": "fog", "50n": "fog",
  };
  return map[icon] || "cloudy";
}

export async function getCurrentWeather(): Promise<CurrentWeather | null> {
  if (!API_KEY) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return null;

  const data = await res.json();
  return {
    temp: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    temp_min: Math.round(data.main.temp_min),
    temp_max: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    description: data.weather[0]?.description || "Unknown",
    icon: weatherIconToEmoji(data.weather[0]?.icon || "03d"),
    wind_speed: Math.round(data.wind?.speed || 0),
  };
}

export async function getDailyForecast(): Promise<DailyForecast[]> {
  if (!API_KEY) return [];

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = await res.json();

  // Group 3-hour forecasts by day, take min/max
  const days: Record<string, { temps: number[]; desc: string; icon: string }> = {};
  for (const item of data.list) {
    const date = item.dt_txt.split(" ")[0];
    if (!days[date]) {
      days[date] = { temps: [], desc: item.weather[0]?.description, icon: item.weather[0]?.icon };
    }
    days[date].temps.push(item.main.temp);
  }

  return Object.entries(days).slice(0, 5).map(([date, info]) => ({
    date,
    temp_min: Math.round(Math.min(...info.temps)),
    temp_max: Math.round(Math.max(...info.temps)),
    description: info.desc,
    icon: weatherIconToEmoji(info.icon),
  }));
}
