const WEATHER_API_KEY = '37f557b7d3464cccb6c161816251006';
const BASE_URL = 'https://api.weatherapi.com/v1';

class WeatherService {
  async getCurrentWeather(city = 'Amman') {
    try {
      const response = await fetch(
        `${BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${city}&aqi=yes`
      );
      
      if (!response.ok) {
        throw new Error('Weather data fetch failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather:', error);
      throw error;
    }
  }

  async getForecast(city = 'Amman', days = 3) {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${city}&days=${days}&aqi=yes`
      );
      
      if (!response.ok) {
        throw new Error('Forecast data fetch failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }
}

export default new WeatherService(); 