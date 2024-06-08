document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '4da392491f9a4cc485873437240806'; // Your WeatherAPI key
    const weatherInfoDiv = document.getElementById('weather-info');
    const forecastInfoDiv = document.getElementById('forecast-info');
    const locationInputDiv = document.getElementById('location-input');
    const manualLocationInput = document.getElementById('manual-location');
    const getWeatherButton = document.getElementById('get-weather');
    const changeLocationButton = document.getElementById('change-location');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.error('Geolocation is not supported by this browser.');
        askForLocation();
    }

    // Event listener for changing location
    changeLocationButton.addEventListener('click', () => {
        showLocationInput();
    });

    // Event listener for getting weather by manual location input
    getWeatherButton.addEventListener('click', () => {
        const newLocation = manualLocationInput.value.trim();
        if (newLocation !== '') {
            getWeatherByLocation(newLocation);
        }
    });

    function showPosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log(`Current Position: lat=${lat}, lon=${lon}`);
        getWeatherByCoords(lat, lon);
    }

    function showError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                console.error("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                console.error("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                console.error("The request to get user location timed out.");
                break;
            case error.UNKNOWN_ERROR:
                console.error("An unknown error occurred.");
                break;
        }
        askForLocation();
    }

    function askForLocation() {
        const savedLocation = localStorage.getItem('location');
        if (savedLocation) {
            getWeatherByLocation(savedLocation);
        } else {
            locationInputDiv.style.display = 'block';
        }
    }

    function getWeatherByCoords(lat, lon) {
        showLoadingIndicator(); // Show loading indicator
        fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                displayWeather(data);
                hideLoadingIndicator(); // Hide loading indicator after data is loaded
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                hideLoadingIndicator(); // Hide loading indicator if there's an error
            });
    }

    function getWeatherByLocation(location) {
        showLoadingIndicator(); // Show loading indicator
        const loc = location || manualLocationInput.value;
        if (loc) {
            localStorage.setItem('location', loc);
            fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${loc}&days=5`)
                .then(response => response.json())
                .then(data => {
                    forecastInfoDiv.innerHTML = '';
                    displayWeather(data);
                    hideLoadingIndicator(); // Hide loading indicator after data is loaded
                })
                .catch(error => {
                    console.error('Error fetching weather data:', error);
                    hideLoadingIndicator(); // Hide loading indicator if there's an error
                });
        }
    }

    // to convert date
    function getDayFromDate(dateString) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
        const date = new Date(dateString);
        const dayOfWeek = daysOfWeek[date.getDay()];
        const dayOfMonth = date.getDate();
        const month = monthsOfYear[date.getMonth()];
        const year = date.getFullYear();
    
        return `${dayOfWeek}, ${month} ${dayOfMonth}, ${year}`;
    }
    
    function displayWeather(data) {
        if (data.error) {
            weatherInfoDiv.innerHTML = `<p>Error: ${data.error.message}</p>`;
        } else {
            const { temp_c, condition, wind_kph, humidity, feelslike_c, vis_km, gust_kph, precip_mm, pressure_mb } = data.current;
            const { name, country } = data.location;
    
            document.getElementById('location').textContent = `${name}, ${country}`;
            document.getElementById('temperature').textContent = `${temp_c}°C`;
            document.getElementById('condition').innerHTML = `
                <img src="https:${condition.icon}" alt="${condition.text}">
                <p class="badge ${getConditionBadgeClass(condition.code)}">${condition.text}</p>
            `;
            document.getElementById('additional-info').innerHTML = `
                <p>Feels Like: ${feelslike_c}°C</p>
                <p>Wind: ${wind_kph} km/h</p>
                <p>Humidity: ${humidity}%</p>
                <p>Visibility: ${vis_km} km</p>
                <p>Gust: ${gust_kph} km/h</p>
                <p>Precip: ${precip_mm} mm</p>
                <p>Pressure: ${pressure_mb} mb</p>
            `;
    
            // forecastInfoDiv.innerHTML = `<h1>5-Day Forecast</h1>`;
            forecastInfoDiv.innerHTML += `<div class="forecast-days">`; // Start a container for forecast days
            data.forecast.forecastday.forEach(day => {
                const { date, day: { maxtemp_c, mintemp_c, condition, maxwind_kph, avghumidity } } = day;
                const formattedDate = getDayFromDate(date); // Convert date to "Day, Month Date, Year" format
                forecastInfoDiv.innerHTML += `
                    <div class="forecast-day">
                        <h4>${formattedDate}</h4> 
                        <img src="https:${condition.icon}" alt="${condition.text}">
                        <p class="badge ${getConditionBadgeClass(condition.code)}">${condition.text}</p>
                        <p>Max Temp: ${maxtemp_c}°C</p>
                        <p>Min Temp: ${mintemp_c}°C</p>
                        <p>Max Wind: ${maxwind_kph} kph</p>
                        <p>Avg Humidity: ${avghumidity}%</p>
                    </div>
                `;
            });
            forecastInfoDiv.innerHTML += `</div>`; // End the container for forecast days
        }
        locationInputDiv.style.display = 'none';
        hideLoadingIndicator(); // Hide loading indicator once weather data is displayed
    }
    

    function showLocationInput() {
        locationInputDiv.style.display = 'block';
    }

    function showLoadingIndicator() {
        weatherInfoDiv.classList.add('loading');
    }

    function hideLoadingIndicator() {
        weatherInfoDiv.classList.remove('loading');
    }

    function getConditionBadgeClass(conditionCode) {
        // badge classes based on weather 
        switch (conditionCode) {
            case 1000: // Sunny
                return 'sunny';
            case 1003: // Partly Cloudy
            case 1006: // Cloudy
            case 1009: // Overcast
                return 'cloudy';
            case 1063: // Patchy rain possible
            case 1180: // Patchy rain nearby
            case 1183: // Patchy light rain
            case 1186: // Light rain
            case 1189: // Moderate rain at times
            case 1192: // Moderate rain
            case 1195: // Heavy rain at times
            case 1198: // Heavy rain
            case 1201: // Light freezing rain
            case 1204: // Moderate or heavy freezing rain
            case 1207: // Light sleet
            case 1210: // Moderate or heavy sleet
            case 1213: // Patchy light snow
            case 1216: // Light snow
            case 1219: // Patchy moderate snow
            case 1222: // Moderate snow
            case 1225: // Patchy heavy snow
            case 1228: // Heavy snow
            case 1237: // Ice pellets
            case 1240: // Light rain shower
            case 1243: // Moderate or heavy rain shower
            case 1246: // Torrential rain shower
            case 1249: // Light sleet showers
            case 1252: // Moderate or heavy sleet showers
            case 1255: // Light snow showers
            case 1258: // Moderate or heavy snow showers
                return 'rainy';
            case 1066: // Patchy snow possible
            case 1069: // Patchy sleet possible
            case 1072: // Patchy freezing drizzle possible
            case 1135: // Fog
            case 1147: // Freezing fog
                return 'snowy';
            default:
                return '';
        }
    }
});
