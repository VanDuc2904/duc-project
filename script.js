// script.js

// Tự động thêm class active cho menu dựa trên URL
const navLinks = document.querySelectorAll('.frame-1 a');
const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';

navLinks.forEach(link => {
    link.classList.remove('active');
    const linkPage = link.getAttribute('href').toLowerCase();
    if (linkPage === currentPage) {
        link.classList.add('active');
    }
});

// Slideshow cho Frame 3
const svgPath = document.querySelector('#svg-path');
const patterns = ['pattern0_1', 'pattern0_2', 'pattern0_3'];
let currentPatternIndex = 0;

function showNextPattern() {
    svgPath.setAttribute('fill', `url(#${patterns[currentPatternIndex]})`);
    currentPatternIndex = (currentPatternIndex + 1) % patterns.length;
    if (currentPatternIndex === 0) {
        setTimeout(showNextPattern, 0);
    }
}

setInterval(showNextPattern, 7000);
showNextPattern();

// Slideshow cho Rectangle 4
const slides = document.querySelectorAll('.rectangle-4-slide');
const dots = document.querySelectorAll('.rectangle-4-dots .dot');
const prevButton = document.querySelector('.rectangle-4-prev');
const nextButton = document.querySelector('.rectangle-4-next');
const titleElement = document.querySelector('#rectangle-4-title');
let currentSlideIndex = 0;

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    
    const newTitle = slides[index].getAttribute('data-title');
    titleElement.textContent = newTitle;
    
    currentSlideIndex = index;
}

function showNextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    showSlide(currentSlideIndex);
}

function showPrevSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    showSlide(currentSlideIndex);
}

setInterval(showNextSlide, 7000);

prevButton.addEventListener('click', showPrevSlide);
nextButton.addEventListener('click', showNextSlide);

dots.forEach(dot => {
    dot.addEventListener('click', () => {
        const index = parseInt(dot.getAttribute('data-index'));
        showSlide(index);
    });
});

showSlide(currentSlideIndex);

// Dự báo thời tiết cho Rectangle 5
const districtSelect = document.querySelector('#district-select');
const communeSelect = document.querySelector('#commune-select');
const weatherTemp = document.querySelector('.weather-temp');
const weatherCondition = document.querySelector('.weather-condition');
const weatherHumidity = document.querySelector('.weather-humidity');
const weatherWind = document.querySelector('.weather-wind');
const weatherIcon = document.querySelector('.weather-icon');
const forecastDays = document.querySelectorAll('.forecast-day');

// Sử dụng API key từ dự án trước
const apiKey = '12118cdb333f0039947273d009989237';

const locations = {
    "Luc Yen": {
        communes: {
            "Phuc Loi": { lat: 22.1167, lon: 104.9167 },
            "Minh Xuan": { lat: 22.1333, lon: 104.9000 },
            "Lam Thuong": { lat: 22.1000, lon: 104.9333 }
        }
    },
    "Van Yen": {
        communes: {
            "Mau A": { lat: 21.8667, lon: 104.6667 },
            "Lang Thip": { lat: 21.8833, lon: 104.6500 },
            "Dong Cuong": { lat: 21.8500, lon: 104.6833 }
        }
    },
    "Mu Cang Chai": {
        communes: {
            "Mu Cang Chai": { lat: 21.7667, lon: 104.1167 },
            "La Pan Tan": { lat: 21.7833, lon: 104.1000 },
            "Che Cu Nha": { lat: 21.7500, lon: 104.1333 }
        }
    },
    "Tran Yen": {
        communes: {
            "Hong Ca": { lat: 21.6667, lon: 104.8333 },
            "Hop Minh": { lat: 21.6833, lon: 104.8167 },
            "Dao Thinh": { lat: 21.6500, lon: 104.8500 }
        }
    },
    "Yen Binh": {
        communes: {
            "Thac Ba": { lat: 21.7000, lon: 105.0500 },
            "Yen Thanh": { lat: 21.7167, lon: 105.0333 },
            "Vu Linh": { lat: 21.6833, lon: 105.0667 }
        }
    },
    "Van Chan": {
        communes: {
            "Nghia Lo": { lat: 21.5667, lon: 104.5000 },
            "Son A": { lat: 21.5833, lon: 104.4833 },
            "Suoi Giang": { lat: 21.5500, lon: 104.5167 }
        }
    },
    "Tram Tau": {
        communes: {
            "Tram Tau": { lat: 21.4667, lon: 104.3167 },
            "Hat Liu": { lat: 21.4833, lon: 104.3000 },
            "Ban Mu": { lat: 21.4500, lon: 104.3333 }
        }
    },
    "Yen Bai City": {
        communes: {
            "Minh Bao": { lat: 21.7167, lon: 104.9167 },
            "Tuy Loc": { lat: 21.7000, lon: 104.9333 },
            "Van Phu": { lat: 21.7333, lon: 104.9000 }
        }
    }
};

function updateCommuneOptions() {
    const district = districtSelect.value;
    const communes = locations[district].communes;
    communeSelect.innerHTML = '';

    for (const commune in communes) {
        const option = document.createElement('option');
        option.value = commune;
        option.textContent = commune;
        communeSelect.appendChild(option);
    }

    const firstCommune = Object.keys(communes)[0];
    fetchWeather(communes[firstCommune].lat, communes[firstCommune].lon);
}

async function fetchWeather(lat, lon) {
    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;

        // Gọi API thời tiết hiện tại
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        if (weatherData.cod !== 200) {
            throw new Error(`Lỗi từ API: ${weatherData.message}`);
        }

        // Gọi API dự báo
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        if (forecastData.cod !== "200") {
            throw new Error(`Lỗi từ API dự báo: ${forecastData.message}`);
        }

        // Hiển thị thời tiết hiện tại
        weatherTemp.textContent = `${Math.round(weatherData.main.temp)}°C`;
        weatherCondition.textContent = weatherData.weather[0].description;
        weatherHumidity.textContent = `Độ ẩm: ${weatherData.main.humidity}%`;
        weatherWind.textContent = `Gió: ${weatherData.wind.speed} m/s`;
        weatherIcon.style.backgroundImage = `url(https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png)`;

        // Hiển thị dự báo 5 ngày
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const forecastList = forecastData.list
            .filter((item, index) => index % 8 === 4) // Lấy dữ liệu giữa ngày (12h trưa)
            .slice(0, 5); // Lấy 5 ngày tiếp theo

        forecastDays.forEach((dayElement, index) => {
            if (forecastList[index]) {
                const forecast = forecastList[index];
                const date = new Date(forecast.dt * 1000);
                const dayName = days[date.getDay()];
                dayElement.querySelector('.forecast-day-name').textContent = dayName;
                dayElement.querySelector('.forecast-icon').style.backgroundImage = 
                    `url(https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png)`;
                dayElement.querySelector('.forecast-temp').textContent = 
                    `${Math.round(forecast.main.temp_min)}°C / ${Math.round(forecast.main.temp_max)}°C`;
            } else {
                dayElement.querySelector('.forecast-day-name').textContent = 'N/A';
                dayElement.querySelector('.forecast-icon').style.backgroundImage = '';
                dayElement.querySelector('.forecast-temp').textContent = 'N/A';
            }
        });

    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu thời tiết:', error);
        weatherTemp.textContent = 'Lỗi tải dữ liệu';
        weatherCondition.textContent = error.message;
        weatherHumidity.textContent = '';
        weatherWind.textContent = '';
        weatherIcon.style.backgroundImage = '';

        forecastDays.forEach(dayElement => {
            dayElement.querySelector('.forecast-day-name').textContent = '';
            dayElement.querySelector('.forecast-icon').style.backgroundImage = '';
            dayElement.querySelector('.forecast-temp').textContent = '';
        });
    }
}

districtSelect.addEventListener('change', updateCommuneOptions);
communeSelect.addEventListener('change', () => {
    const district = districtSelect.value;
    const commune = communeSelect.value;
    const { lat, lon } = locations[district].communes[commune];
    fetchWeather(lat, lon);
});

updateCommuneOptions();