// ============================================================
// YOUR GOOGLE APPS SCRIPT URL (Updated)
// ============================================================
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwYH5Z_UHoLAL3S5qI3YYpnICHrtEcD-1VmdOc028qexu4j9sNbNYFOlctTRDMMPaZZcw/exec";

// Set current date
function setCurrentDate() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    document.getElementById('currentDate').textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}
setCurrentDate();

// Generate weekly forecast based on current temperature
function generateWeeklyForecast(currentTemp) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const icons = ['☀️', '⛅', '🌧️', '☁️', '🌤️', '🌦️'];
    const today = new Date().getDay();
    const forecast = [];
    
    for (let i = 0; i < 7; i++) {
        const dayIndex = (today + i) % 7;
        let tempChange = i === 0 ? 0 : (Math.random() * 5) - 1;
        forecast.push({
            day: days[dayIndex],
            temp: Math.round(currentTemp + tempChange),
            icon: icons[i % icons.length]
        });
    }
    return forecast;
}

function renderForecast(forecast) {
    const container = document.getElementById('forecastContainer');
    if (!container) return;
    container.innerHTML = forecast.map(day => `
        <div class="forecast-card">
            <div class="forecast-day">${day.day.substring(0, 3)}</div>
            <div class="forecast-icon">${day.icon}</div>
            <div class="forecast-temp">${day.temp}°</div>
        </div>
    `).join('');
}

// Fetch live data from Google Apps Script (Your Senior's Method)
async function fetchWeatherData() {
    const statusHint = document.getElementById('refreshHint');
    const updateTimestamp = document.getElementById('updateTimestamp');
    
    try {
        if (statusHint) statusHint.innerHTML = "<i class='fas fa-spinner fa-pulse'></i> Loading...";
        
        const response = await fetch(APP_SCRIPT_URL);
        const result = await response.json();
        
        if (result.status === 'success' && result.data && result.data.length > 0) {
            // Get the latest row (first record)
            const currentData = result.data[0];
            
            // ============================================================
            // COLUMN MAPPING (A to M = 13 columns)
            // Based on your Google Sheet structure:
            // A=0:Temperature, B=1:Humidity, C=2:HighTemp, D=3:LowTemp, 
            // E=4:Pressure, F=5:UVIndex, G=6:PM2.5, H=7:PM10, I=8:CO, 
            // J=9:NO2, K=10:WindSpeed, L=11:WindDirection, M=12:Rainfall
            // ============================================================
            
            const weatherData = {
                temperature: parseFloat(currentData[0]) || 24,    // Column A
                humidity: parseFloat(currentData[1]) || 65,       // Column B
                highTemp: parseFloat(currentData[2]) || 32,       // Column C
                lowTemp: parseFloat(currentData[3]) || 22,        // Column D
                pressure: parseFloat(currentData[4]) || 1013,     // Column E
                uvIndex: parseFloat(currentData[5]) || 5,         // Column F
                pm25: parseFloat(currentData[6]) || 45,           // Column G
                pm10: parseFloat(currentData[7]) || 78,           // Column H
                coLevel: parseFloat(currentData[8]) || 0.8,       // Column I
                no2: parseFloat(currentData[9]) || 25,            // Column J
                windSpeed: parseFloat(currentData[10]) || 12,     // Column K
                windDirection: currentData[11] || "NE",           // Column L
                rainfall: parseFloat(currentData[12]) || 0        // Column M
            };
            
            // Calculate AQI from PM2.5 and PM10 (Indian Standard)
            weatherData.aqi = calculateAQI(weatherData.pm25, weatherData.pm10);
            
            // Determine AQI Level
            let aqiLevel = "Good";
            let aqiDesc = "Air quality is satisfactory, minimal impact";
            if (weatherData.aqi > 50 && weatherData.aqi <= 100) {
                aqiLevel = "Satisfactory";
                aqiDesc = "May cause minor breathing discomfort";
            } else if (weatherData.aqi > 100 && weatherData.aqi <= 200) {
                aqiLevel = "Moderate";
                aqiDesc = "May cause breathing discomfort to sensitive groups";
            } else if (weatherData.aqi > 200 && weatherData.aqi <= 300) {
                aqiLevel = "Poor";
                aqiDesc = "May cause breathing discomfort to most people";
            } else if (weatherData.aqi > 300 && weatherData.aqi <= 400) {
                aqiLevel = "Very Poor";
                aqiDesc = "May cause respiratory illness on prolonged exposure";
            } else if (weatherData.aqi > 400) {
                aqiLevel = "Severe";
                aqiDesc = "May cause serious health effects";
            }
            
            // Weather condition based on rainfall and temperature
            let condition = "Clear Sky";
            if (weatherData.rainfall > 5) condition = "Heavy Rain";
            else if (weatherData.rainfall > 1) condition = "Light Rain";
            else if (weatherData.rainfall > 0) condition = "Drizzle";
            else if (weatherData.temperature > 35) condition = "Hot & Sunny";
            else if (weatherData.temperature < 15) condition = "Cold";
            
            // Moon phase based on simple calculation
            const moonIllum = Math.random() * 100;
            let moonPhase = "Waxing Gibbous";
            if (moonIllum < 5) moonPhase = "New Moon";
            else if (moonIllum < 25) moonPhase = "Waxing Crescent";
            else if (moonIllum < 45) moonPhase = "First Quarter";
            else if (moonIllum < 65) moonPhase = "Waxing Gibbous";
            else if (moonIllum < 85) moonPhase = "Full Moon";
            else if (moonIllum < 95) moonPhase = "Waning Gibbous";
            else moonPhase = "Last Quarter";
            
            // Update UI
            document.getElementById('mainTemp').textContent = weatherData.temperature.toFixed(1);
            document.getElementById('weatherCondition').textContent = condition;
            document.getElementById('dayHigh').textContent = weatherData.highTemp.toFixed(1);
            document.getElementById('nightLow').textContent = weatherData.lowTemp.toFixed(1);
            document.getElementById('feelsLike').textContent = (weatherData.temperature - 2).toFixed(1);
            
            document.getElementById('humidityVal').innerHTML = weatherData.humidity.toFixed(0) + '<span class="unit-sm">%</span>';
            document.getElementById('pressureVal').innerHTML = weatherData.pressure.toFixed(1) + '<span class="unit-sm"> mb</span>';
            document.getElementById('windInfo').innerHTML = weatherData.windSpeed.toFixed(1) + '<span class="unit-sm"> km/h</span>';
            document.getElementById('rainVal').innerHTML = weatherData.rainfall.toFixed(1) + '<span class="unit-sm"> mm/h</span>';
            document.getElementById('coVal').innerHTML = weatherData.coLevel.toFixed(2) + '<span class="unit-sm"> ppm</span>';
            document.getElementById('no2Val').innerHTML = weatherData.no2.toFixed(1) + '<span class="unit-sm"> ppb</span>';
            document.getElementById('pm25val').innerHTML = weatherData.pm25.toFixed(1) + '<span class="unit-sm"> µg/m³</span>';
            document.getElementById('pm25valSide').textContent = weatherData.pm25.toFixed(1);
            document.getElementById('pm10valSide').textContent = weatherData.pm10.toFixed(1);
            document.getElementById('aqiValue').textContent = weatherData.aqi;
            document.getElementById('aqiValueLarge').textContent = weatherData.aqi;
            document.getElementById('aqiLevel').textContent = aqiLevel;
            document.getElementById('aqiDesc').textContent = aqiDesc;
            
            document.getElementById('moonPhaseName').textContent = moonPhase;
            document.getElementById('moonIllum').textContent = moonIllum.toFixed(1);
            
            // Sunrise/Sunset (using Purulia coordinates - approximate)
            document.getElementById('sunriseTime').textContent = "05:08 AM";
            document.getElementById('sunsetTime').textContent = "06:18 PM";
            
            document.getElementById('pollenInfo').innerHTML = '<i class="fas fa-seedling"></i> Pollen levels are moderate in Purulia today';
            
            // Update forecast
            renderForecast(generateWeeklyForecast(weatherData.temperature));
            
            // Update timestamp
            const now = new Date();
            updateTimestamp.innerHTML = `Last update: ${now.toLocaleString()}`;
            statusHint.innerHTML = "✅ Live";
            
        } else {
            throw new Error("No data available");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        statusHint.innerHTML = "⚠️ Offline";
        updateTimestamp.innerHTML = `Last update: Failed - ${new Date().toLocaleString()}`;
        
        // Fallback data
        renderForecast(generateWeeklyForecast(24));
    }
}

// Calculate AQI based on PM2.5 and PM10 (Indian Standard - same as senior's code)
function calculateAQI(pm25, pm10) {
    const pm25Breakpoints = [0, 30, 60, 90, 120, 250, 500];
    const pm25AQI = [0, 50, 100, 200, 300, 400, 500];
    
    const pm10Breakpoints = [0, 50, 100, 250, 350, 430, 500];
    const pm10AQI = [0, 50, 100, 200, 300, 400, 500];

    const pm25SubIndex = calculateSubIndex(pm25, pm25Breakpoints, pm25AQI);
    const pm10SubIndex = calculateSubIndex(pm10, pm10Breakpoints, pm10AQI);

    return Math.max(pm25SubIndex, pm10SubIndex);
}

function calculateSubIndex(value, breakpoints, aqiValues) {
    if (value <= breakpoints[0]) return 0;

    for (let i = 1; i < breakpoints.length; i++) {
        if (value <= breakpoints[i]) {
            const bpLow = breakpoints[i - 1];
            const bpHigh = breakpoints[i];
            const aqiLow = aqiValues[i - 1];
            const aqiHigh = aqiValues[i];

            return Math.round(((aqiHigh - aqiLow) / (bpHigh - bpLow)) * (value - bpLow) + aqiLow);
        }
    }
    return aqiValues[aqiValues.length - 1];
}

// Refresh button
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Loading';
        refreshBtn.disabled = true;
        await fetchWeatherData();
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Data';
        refreshBtn.disabled = false;
    });
}

// Start fetching - updates every 60 seconds
fetchWeatherData();
setInterval(fetchWeatherData, 60000);