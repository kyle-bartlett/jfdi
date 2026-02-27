"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  city?: string;
}

interface Props {
  weather: WeatherData;
}

// Map OpenWeatherMap icon codes to animated emoji + label
function getWeatherEmoji(icon: string, description: string): { emoji: string; animate: string } {
  const code = icon.replace("n", "d"); // normalize night variants
  switch (code) {
    case "01d": return { emoji: "☀️", animate: "animate-pulse-slow" };
    case "02d": return { emoji: "⛅", animate: "animate-drift" };
    case "03d": return { emoji: "☁️", animate: "animate-drift" };
    case "04d": return { emoji: "☁️", animate: "animate-drift" };
    case "09d": return { emoji: "🌧️", animate: "animate-rain" };
    case "10d": return { emoji: "🌦️", animate: "animate-rain" };
    case "11d": return { emoji: "⛈️", animate: "animate-flash" };
    case "13d": return { emoji: "❄️", animate: "animate-snow" };
    case "50d": return { emoji: "🌫️", animate: "animate-drift" };
    default: {
      // Fallback based on description
      const desc = description.toLowerCase();
      if (desc.includes("clear")) return { emoji: "☀️", animate: "animate-pulse-slow" };
      if (desc.includes("cloud")) return { emoji: "☁️", animate: "animate-drift" };
      if (desc.includes("rain") || desc.includes("drizzle")) return { emoji: "🌧️", animate: "animate-rain" };
      if (desc.includes("thunder") || desc.includes("storm")) return { emoji: "⛈️", animate: "animate-flash" };
      if (desc.includes("snow")) return { emoji: "❄️", animate: "animate-snow" };
      if (desc.includes("fog") || desc.includes("mist") || desc.includes("haze")) return { emoji: "🌫️", animate: "animate-drift" };
      return { emoji: "🌤️", animate: "" };
    }
  }
}

function getWindDirection(speed: number): string {
  if (speed < 5) return "Calm";
  if (speed < 15) return "Light breeze";
  if (speed < 25) return "Moderate wind";
  if (speed < 40) return "Strong wind";
  return "High wind";
}

function getComfortLevel(feelsLike: number): { label: string; color: string } {
  if (feelsLike < 32) return { label: "Freezing", color: "text-blue-400" };
  if (feelsLike < 50) return { label: "Cold", color: "text-blue-300" };
  if (feelsLike < 65) return { label: "Cool", color: "text-primary" };
  if (feelsLike < 78) return { label: "Comfortable", color: "text-accent" };
  if (feelsLike < 90) return { label: "Warm", color: "text-warning" };
  if (feelsLike < 100) return { label: "Hot", color: "text-orange-400" };
  return { label: "Extreme heat", color: "text-destructive" };
}

export function WeatherWidget({ weather }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { emoji, animate } = getWeatherEmoji(weather.icon, weather.description);
  const comfort = getComfortLevel(weather.feels_like);
  const wind = getWindDirection(weather.wind_speed);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative">
      {/* Compact view (always visible) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-right hover:opacity-80 transition-opacity cursor-pointer group"
        title="Click for details"
      >
        <div className="flex items-center justify-end gap-2">
          <span className={`text-2xl ${mounted ? animate : ""}`} role="img" aria-label={weather.description}>
            {emoji}
          </span>
          <div>
            {weather.city && (
              <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                {weather.city}
              </div>
            )}
            <div className="text-2xl font-bold tabular-nums">{weather.temp}°F</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground capitalize mt-0.5">
          {weather.description}
        </div>
        <div className="text-[10px] text-muted-foreground/60 flex items-center justify-end gap-1.5 mt-0.5">
          <span>↑{weather.temp_max}°</span>
          <span>↓{weather.temp_min}°</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            {expanded ? "▾" : "▸"}
          </span>
        </div>
      </button>

      {/* Expanded detail card */}
      {expanded && (
        <div className="absolute right-0 top-full mt-2 z-40 w-64 bg-popover border border-border rounded-xl shadow-lg p-4 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className={`text-3xl ${animate}`}>{emoji}</span>
              <div>
                <div className="text-xl font-bold">{weather.temp}°F</div>
                <div className="text-xs text-muted-foreground capitalize">{weather.description}</div>
              </div>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem
              icon="🌡️"
              label="Feels Like"
              value={`${weather.feels_like}°F`}
              sub={<span className={`text-[10px] font-medium ${comfort.color}`}>{comfort.label}</span>}
            />
            <DetailItem
              icon="💧"
              label="Humidity"
              value={`${weather.humidity}%`}
              sub={
                <div className="w-full bg-secondary rounded-full h-1 mt-1">
                  <div
                    className="h-1 bg-primary/50 rounded-full transition-all"
                    style={{ width: `${weather.humidity}%` }}
                  />
                </div>
              }
            />
            <DetailItem
              icon="🌬️"
              label="Wind"
              value={`${weather.wind_speed} mph`}
              sub={<span className="text-[10px] text-muted-foreground/60">{wind}</span>}
            />
            <DetailItem
              icon="📊"
              label="Range"
              value={`${weather.temp_min}° — ${weather.temp_max}°`}
              sub={
                <div className="w-full bg-secondary rounded-full h-1 mt-1 relative">
                  <div
                    className="absolute h-1 bg-gradient-to-r from-blue-400 via-accent to-warning rounded-full"
                    style={{
                      left: `${Math.max(0, ((weather.temp_min - weather.temp_min) / Math.max(weather.temp_max - weather.temp_min, 1)) * 100)}%`,
                      right: "0%",
                    }}
                  />
                  {/* Current temp marker */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-foreground rounded-full border border-background"
                    style={{
                      left: `${Math.min(100, Math.max(0, ((weather.temp - weather.temp_min) / Math.max(weather.temp_max - weather.temp_min, 1)) * 100))}%`,
                    }}
                  />
                </div>
              }
            />
          </div>

          {/* Close hint */}
          <div className="text-center mt-3 pt-2 border-t border-border/30">
            <span className="text-[9px] text-muted-foreground/40">Click weather to close</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value, sub }: {
  icon: string;
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        <span className="text-xs">{icon}</span>
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-medium">{value}</div>
      {sub}
    </div>
  );
}
