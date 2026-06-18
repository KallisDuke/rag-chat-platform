import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PublicIcon from "@mui/icons-material/Public";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import CloudIcon from "@mui/icons-material/Cloud";
import FilterDramaIcon from "@mui/icons-material/FilterDrama";
import GrainIcon from "@mui/icons-material/Grain";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ForumIcon from "@mui/icons-material/Forum";

const USER_NAME = "Kallis";

interface WeatherInfo {
  temperature: number;
  code: number;
}

interface LocationInfo {
  country: string;
  city: string;
}

const getWeatherVisual = (code: number) => {
  if (code === 0) return { Icon: WbSunnyIcon, label: "Clear", color: "#ffd54f" };
  if ([1, 2, 3].includes(code))
    return { Icon: CloudIcon, label: "Cloudy", color: "#90caf9" };
  if ([45, 48].includes(code))
    return { Icon: FilterDramaIcon, label: "Foggy", color: "#b0bec5" };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { Icon: GrainIcon, label: "Rainy", color: "#64b5f6" };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { Icon: AcUnitIcon, label: "Snowy", color: "#e1f5fe" };
  if ([95, 96, 99].includes(code))
    return { Icon: ThunderstormIcon, label: "Storm", color: "#ffb74d" };
  return { Icon: WbSunnyIcon, label: "Clear", color: "#ffd54f" };
};

const getGreeting = (hour: number) => {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const Navbar: React.FC = () => {
  const routeLocation = useLocation();
  const onUploadPage = routeLocation.pathname.startsWith("/upload");
  const [now, setNow] = useState(new Date());
  const [geoLocation, setGeoLocation] = useState<LocationInfo | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLocationAndWeather = async () => {
      try {
        const geoRes = await fetch("https://ipapi.co/json/");
        if (!geoRes.ok) throw new Error("geo lookup failed");
        const geo = await geoRes.json();
        if (cancelled) return;

        setGeoLocation({ country: geo.country_name, city: geo.city });

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`,
        );
        if (!weatherRes.ok) throw new Error("weather lookup failed");
        const weatherData = await weatherRes.json();
        if (cancelled) return;

        setWeather({
          temperature: Math.round(weatherData.current_weather.temperature),
          code: weatherData.current_weather.weathercode,
        });
      } catch {
        if (!cancelled) setError(true);
      }
    };

    loadLocationAndWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = useMemo(() => getGreeting(now.getHours()), [now]);
  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [now],
  );
  const timeLabel = useMemo(
    () =>
      now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [now],
  );

  const weatherVisual = weather ? getWeatherVisual(weather.code) : null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: 3,
        py: 1.5,
        borderBottom: "1px solid #2a2a2a",
        backgroundColor: "#141414",
        flexWrap: "wrap",
        gap: 2,
        fontFamily: '"Roboto Mono", monospace',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar
          sx={{
            bgcolor: "#fff",
            color: "#000",
            width: 36,
            height: 36,
            fontSize: "0.95rem",
            fontWeight: 600,
          }}
        >
          {USER_NAME.charAt(0)}
        </Avatar>
        <Box>
          <Typography sx={{ color: "#fff", fontSize: "0.85rem", lineHeight: 1.2 }}>
            {greeting}, <strong>{USER_NAME}</strong>
          </Typography>
          <Typography sx={{ color: "#777", fontSize: "0.7rem" }}>
            {geoLocation?.city ? `${geoLocation.city} workspace` : "Your workspace"}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={3} alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarMonthIcon sx={{ fontSize: "1.1rem", color: "#fff" }} />
          <Typography sx={{ color: "#ddd", fontSize: "0.8rem" }}>
            {dateLabel}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon sx={{ fontSize: "1.1rem", color: "#fff" }} />
          <Typography
            sx={{
              color: "#ddd",
              fontSize: "0.8rem",
              fontVariantNumeric: "tabular-nums",
              minWidth: "4.5em",
            }}
          >
            {timeLabel}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <PublicIcon sx={{ fontSize: "1.1rem", color: "#fff" }} />
          <Typography sx={{ color: "#ddd", fontSize: "0.8rem" }}>
            {geoLocation?.country ?? (error ? "Unavailable" : "Locating…")}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {weatherVisual ? (
            <weatherVisual.Icon sx={{ fontSize: "1.1rem", color: weatherVisual.color }} />
          ) : (
            <WbSunnyIcon sx={{ fontSize: "1.1rem", color: "#555" }} />
          )}
          <Typography sx={{ color: "#ddd", fontSize: "0.8rem" }}>
            {weather
              ? `${weather.temperature}°C`
              : error
                ? "Unavailable"
                : "Loading…"}
          </Typography>
        </Stack>

        <Stack
          component={Link}
          to={onUploadPage ? "/chat" : "/upload"}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            textDecoration: "none",
            color: "#fff",
            px: 1.25,
            py: 0.5,
            borderRadius: "8px",
            border: "1px solid #333",
            transition: "background-color 0.2s ease",
            "&:hover": { backgroundColor: "#2a2a2a" },
          }}
        >
          {onUploadPage ? (
            <ForumIcon sx={{ fontSize: "1.1rem", color: "#fff" }} />
          ) : (
            <UploadFileIcon sx={{ fontSize: "1.1rem", color: "#fff" }} />
          )}
          <Typography sx={{ color: "#fff", fontSize: "0.8rem" }}>
            {onUploadPage ? "Chat" : "Upload"}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
};
