"use client";

interface WeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
}

interface Props {
  weather: WeatherData;
}

export function WeatherWidget({ weather }: Props) {
  return (
    <div className="text-right">
      <div className="text-2xl font-bold">{weather.temp}°C</div>
      <div className="text-xs text-muted-foreground capitalize">
        {weather.description}
      </div>
      <div className="text-xs text-muted-foreground">
        H:{weather.temp_max}° L:{weather.temp_min}° | {weather.humidity}% humidity
      </div>
    </div>
  );
}
