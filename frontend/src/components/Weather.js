import React, { useState, useEffect } from 'react';
import weatherService from '../services/weather.service';
import '../styles/Weather.css';

const Weather = () => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const currentWeather = await weatherService.getCurrentWeather();
        setWeather(currentWeather);
      } catch (err) {
        console.error(err);
      }
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000);
    return () => clearInterval(interval);
  }, []);

  if (!weather) return null;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="header-weather">
      <span>{today}</span>
      <span className="weather-temp">{Math.round(weather.current.temp_c)}°C</span>
    </div>
  );
};

export default Weather; 