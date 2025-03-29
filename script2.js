// Tự động thêm class active cho menu dựa trên URL
const navLinks = document.querySelectorAll('.frame-1 a');
const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.htm';

const pageNames = {
    'index.htm': 'Trang chủ',
    'thongtinqt.htm': 'Thông tin quan trắc',
    'statistics.html': 'Thống kê',
    'contact.html': 'Liên hệ'
};

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

function checkImageLoad(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error(`Không thể tải hình ảnh: ${imageUrl}`));
    });
}

async function initializeSlideshow() {
    const imageUrls = ['/img/HB.jpg', '/img/HB2.jpg', '/img/Nhieu_kv.jpg'];
    try {
        await Promise.all(imageUrls.map(url => checkImageLoad(url)));
        console.log('Tất cả hình ảnh đã tải thành công');
    } catch (error) {
        console.error(error.message);
        return false;
    }
    return true;
}

function showNextPattern() {
    if (!svgPath) return;
    svgPath.setAttribute('fill', `url(#${patterns[currentPatternIndex]})`);
    currentPatternIndex = (currentPatternIndex + 1) % patterns.length;
}

(async () => {
    if (svgPath) {
        const imagesLoaded = await initializeSlideshow();
        if (imagesLoaded) {
            setInterval(showNextPattern, 5000);
            showNextPattern();
        }
    }
})();

// Lấy dữ liệu từ Google Sheets
const SPREADSHEET_ID = '1L-F244XoR4NuNpBJ7taJqOURuLFFt-rPtyLjsEkU2Ts'; // MPU9250
const SPREADSHEET_ID_RAIN = '1qThn_QQ0RSoUtsBuiC3_BAoEtq5EctXF5tweQuB3TxA'; // Rain
const API_KEY = 'AIzaSyABMCq59dfs-BwzlbPuQHHrnMcW1RfyP2M';
const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Trang tính1!A1:J?key=${API_KEY}`;
const API_URL_RAIN = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_RAIN}/values/Sheet1!A1:K?key=${API_KEY}`;

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        return data.values || [];
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
        return [];
    }
}

// Hàm tính lượng mưa tích lũy từ lượng mưa hiện tại
function calculateCumulativeRain(rainData) {
    let cumulativeRain = 0;
    return rainData.map(row => {
        const currentRain = parseFloat(row[3]) || 0; // Lượng mưa hiện tại (cột D)
        cumulativeRain += currentRain;
        return cumulativeRain.toFixed(2);
    });
}

// Xử lý và hiển thị dữ liệu cho Rectangle-4
async function renderRectangle4() {
    const accelDataRaw = await fetchData(API_URL);
    const rainDataRaw = await fetchData(API_URL_RAIN);

    // Slide 1: Bảng dữ liệu ESP32
    const accelData = accelDataRaw.slice(1).slice(-5); // Lấy 5 dòng cuối
    const accelTableBody = document.getElementById('accel-table-body');
    accelTableBody.innerHTML = accelData.map(row => `
        <tr>
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td>${row[2]}</td>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]}</td>
            <td>${row[6]}</td>
            <td>${row[7]}</td>
            <td>${row[8]}</td>
            <td>${row[9]}</td>
        </tr>
    `).join('');

    // Slide 2: Biểu đồ Displacement X
    const dispXChartCtx = document.getElementById('dispX-chart').getContext('2d');
    new Chart(dispXChartCtx, {
        type: 'line',
        data: {
            labels: accelDataRaw.slice(1).map(row => row[0]), // Thời gian
            datasets: [
                { label: 'Displacement X (mm)', data: accelDataRaw.slice(1).map(row => row[1]), borderColor: 'red', fill: false }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Thời gian' } },
                y: { title: { display: true, text: 'Displacement X (mm)' } }
            }
        }
    });

    // Slide 3: Bảng thông tin mưa
    const rainData = rainDataRaw.slice(1).slice(-5); // Lấy 5 dòng cuối
    const rainTableBody = document.getElementById('rain-table-body');
    rainTableBody.innerHTML = rainData.map(row => `
        <tr>
            <td>${row[0]}</td>
            <td>${row[3]}</td>
            <td>${row[7]}</td>
        </tr>
    `).join('');

    // Slide 4: Biểu đồ mưa
    const rainChartCtx = document.getElementById('rain-chart').getContext('2d');
    const rainDataSliced = rainDataRaw.slice(1);
    const currentRainData = rainDataSliced.map(row => parseFloat(row[3]) || 0);
    const cumulativeRainData = calculateCumulativeRain(rainDataSliced);
    new Chart(rainChartCtx, {
        data: {
            labels: rainDataSliced.map(row => row[0]), // Thời gian
            datasets: [
                { type: 'bar', label: 'Lượng mưa hiện tại (mm)', data: currentRainData, backgroundColor: 'rgba(54, 162, 235, 0.5)', yAxisID: 'y1' },
                { type: 'line', label: 'Lượng mưa tích lũy (mm)', data: cumulativeRainData, borderColor: 'red', fill: false, yAxisID: 'y2' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Thời gian' } },
                y1: { position: 'left', title: { display: true, text: 'Lượng mưa hiện tại (mm)' }, beginAtZero: true },
                y2: { position: 'right', title: { display: true, text: 'Lượng mưa tích lũy (mm)' }, beginAtZero: true, grid: { drawOnChartArea: false } }
            }
        }
    });

    // Slide 5: Biểu đồ Velocity Z
    const velZChartCtx = document.getElementById('velZ-chart').getContext('2d');
    new Chart(velZChartCtx, {
        type: 'line',
        data: {
            labels: accelDataRaw.slice(1).map(row => row[0]), // Thời gian
            datasets: [
                { label: 'Velocity Z (mm/s)', data: accelDataRaw.slice(1).map(row => row[6]), borderColor: 'blue', fill: false }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Thời gian' } },
                y: { title: { display: true, text: 'Velocity Z (mm/s)' } }
            }
        }
    });

    // Xử lý chuyển slide
    const slides = document.querySelectorAll('.rectangle-4-slide');
    const dots = document.querySelectorAll('.rectangle-4-dots .dot');
    const title = document.getElementById('rectangle-4-title');
    let currentIndex = 0;

    function showSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        title.textContent = slides[index].getAttribute('data-title');
        currentIndex = index;
    }

    dots.forEach((dot, idx) => dot.addEventListener('click', () => showSlide(idx)));
    document.querySelector('.rectangle-4-prev').addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
    });
    document.querySelector('.rectangle-4-next').addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    });

    showSlide(0); // Hiển thị slide đầu tiên
}

// Dự báo thời tiết cho Rectangle 5
const districtSelect = document.querySelector('#district-select');
const communeSelect = document.querySelector('#commune-select');
const weatherTemp = document.querySelector('.weather-temp');
const weatherCondition = document.querySelector('.weather-condition');
const weatherHumidity = document.querySelector('.weather-humidity');
const weatherWind = document.querySelector('.weather-wind');
const weatherIcon = document.querySelector('.weather-icon');
const forecastDays = document.querySelectorAll('.forecast-day');
const apiKey = '12118cdb333f0039947273d009989237';

const locations = {
    "Luc Yen": { communes: { "Phuc Loi": { lat: 22.1167, lon: 104.9167 }, "Minh Xuan": { lat: 22.1333, lon: 104.9000 }, "Lam Thuong": { lat: 22.1000, lon: 104.9333 } } },
    "Van Yen": { communes: { "Mau A": { lat: 21.8667, lon: 104.6667 }, "Lang Thip": { lat: 21.8833, lon: 104.6500 }, "Dong Cuong": { lat: 21.8500, lon: 104.6833 } } },
    "Mu Cang Chai": { communes: { "Mu Cang Chai": { lat: 21.7667, lon: 104.1167 }, "La Pan Tan": { lat: 21.7833, lon: 104.1000 }, "Che Cu Nha": { lat: 21.7500, lon: 104.1333 } } },
    "Tran Yen": { communes: { "Hong Ca": { lat: 21.6667, lon: 104.8333 }, "Hop Minh": { lat: 21.6833, lon: 104.8167 }, "Dao Thinh": { lat: 21.6500, lon: 104.8500 } } },
    "Yen Binh": { communes: { "Thac Ba": { lat: 21.7000, lon: 105.0500 }, "Yen Thanh": { lat: 21.7167, lon: 105.0333 }, "Vu Linh": { lat: 21.6833, lon: 105.0667 } } },
    "Van Chan": { communes: { "Nghia Lo": { lat: 21.5667, lon: 104.5000 }, "Son A": { lat: 21.5833, lon: 104.4833 }, "Suoi Giang": { lat: 21.5500, lon: 104.5167 } } },
    "Tram Tau": { communes: { "Tram Tau": { lat: 21.4667, lon: 104.3167 }, "Hat Liu": { lat: 21.4833, lon: 104.3000 }, "Ban Mu": { lat: 21.4500, lon: 104.3333 } } },
    "Yen Bai City": { communes: { "Minh Bao": { lat: 21.7167, lon: 104.9167 }, "Tuy Loc": { lat: 21.7000, lon: 104.9333 }, "Van Phu": { lat: 21.7333, lon: 104.9000 } } }
};

function updateCommuneOptions() {
    const district = districtSelect.value;
    const communes = locations[district]?.communes || {};
    communeSelect.innerHTML = Object.keys(communes).map(c => `<option value="${c}">${c}</option>`).join('');
    fetchWeather(communes[Object.keys(communes)[0]].lat, communes[Object.keys(communes)[0]].lon);
}

async function fetchWeather(lat, lon) {
    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;

        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        weatherTemp.textContent = `${Math.round(weatherData.main.temp)}°C`;
        weatherCondition.textContent = weatherData.weather[0].description;
        weatherHumidity.textContent = `Độ ẩm: ${weatherData.main.humidity}%`;
        weatherWind.textContent = `Gió: ${weatherData.wind.speed} m/s`;
        weatherIcon.style.backgroundImage = `url(https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png)`;

        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const forecastList = forecastData.list.filter((_, i) => i % 8 === 4).slice(0, 5);
        forecastDays.forEach((day, i) => {
            if (forecastList[i]) {
                const date = new Date(forecastList[i].dt * 1000);
                day.querySelector('.forecast-day-name').textContent = days[date.getDay()];
                day.querySelector('.forecast-icon').style.backgroundImage = `url(https://openweathermap.org/img/wn/${forecastList[i].weather[0].icon}@2x.png)`;
                day.querySelector('.forecast-temp').textContent = `${Math.round(forecastList[i].main.temp_min)}°C / ${Math.round(forecastList[i].main.temp_max)}°C`;
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu thời tiết:', error);
    }
}

districtSelect?.addEventListener('change', updateCommuneOptions);
communeSelect?.addEventListener('change', () => {
    const district = districtSelect.value;
    const commune = communeSelect.value;
    const { lat, lon } = locations[district].communes[commune];
    fetchWeather(lat, lon);
});

updateCommuneOptions();
renderRectangle4();
