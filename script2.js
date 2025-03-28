// script.js

// Tự động thêm class active cho menu dựa trên URL
const navLinks = document.querySelectorAll('.frame-1 a');
const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';

// Tạo mapping giữa tên file và tên hiển thị
const pageNames = {
    'index.html': 'Trang chủ',
    'monitoring.html': 'Thông tin quan trắc',
    'statistics.html': 'Thống kê',
    'contact.html': 'Liên hệ'
};

// Cập nhật class active cho menu
navLinks.forEach(link => {
    link.classList.remove('active');
    const linkPage = link.getAttribute('href').toLowerCase();
    if (linkPage === currentPage) {
        link.classList.add('active');
    }
});

// Cập nhật breadcrumb
const currentPageElement = document.querySelector('.current-page');
if (currentPageElement) {
    const currentPageName = pageNames[currentPage] || 'Không xác định';
    if (currentPage !== 'index.html') {
        currentPageElement.textContent = currentPageName;
    } else {
        // Ẩn breadcrumb nếu đang ở trang chủ
        document.querySelector('.home-nav .arrow-1').style.display = 'none';
        currentPageElement.style.display = 'none';
    }
}

// Slideshow cho Frame 3
const svgPath = document.querySelector('#svg-path');
const patterns = ['pattern0_1', 'pattern0_2', 'pattern0_3'];
let currentPatternIndex = 0;

// Kiểm tra xem hình ảnh có tải được không
function checkImageLoad(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error(`Không thể tải hình ảnh: ${imageUrl}`));
    });
}

// Kiểm tra tất cả hình ảnh trước khi chạy slideshow
async function initializeSlideshow() {
    const imageUrls = [
        '/img/HB.jpg',
        '/img/HB2.jpg',
        '/img/Nhieu_kv.jpg'
    ];

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
    if (!svgPath) {
        console.error('Không tìm thấy #svg-path trong DOM');
        return;
    }
    svgPath.setAttribute('fill', `url(#${patterns[currentPatternIndex]})`);
    currentPatternIndex = (currentPatternIndex + 1) % patterns.length;
}

// Khởi tạo slideshow cho Frame 3
(async () => {
    if (svgPath) {
        const imagesLoaded = await initializeSlideshow();
        if (imagesLoaded) {
            setInterval(showNextPattern, 5000);
            showNextPattern();
        } else {
            console.error('Slideshow không khởi động do lỗi tải hình ảnh');
        }
    }
})();
const SPREADSHEET_ID = '1L-F244XoR4NuNpBJ7taJqOURuLFFt-rPtyLjsEkU2Ts'; // ID bảng tính Google Sheets
const API_KEY = 'AIzaSyABMCq59dfs-BwzlbPuQHHrnMcW1RfyP2M'; // Thay thế bằng API Key của bạn
const SHEET_NAME = 'Trang tính1'; // Tên của sheet bạn muốn lấy dữ liệu từ đó

// Cấu hình range để lấy dữ liệu từ cột A đến K
const range = `${SHEET_NAME}!A1:K`; // Dữ liệu nằm trong cột từ A đến K

// URL API để gọi Google Sheets API
const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status} - ${response.statusText}`);
        }

        // Chuyển đổi dữ liệu từ JSON
        const data = await response.json();
        console.log(data); // Kiểm tra dữ liệu từ bảng tính

        // Kiểm tra nếu dữ liệu hợp lệ và có mảng
        if (data.values && Array.isArray(data.values)) {
            renderTable(data.values); // Hiển thị dữ liệu vào bảng
        } else {
            console.error('Dữ liệu không đúng định dạng.');
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
    }
}

function renderTable(data) {
    const tableBody = document.querySelector('#table-body');
    
    // Clear table body trước khi thêm dữ liệu mới
    tableBody.innerHTML = '';

    data.forEach(row => {
        const rowElement = document.createElement('tr');
        
        row.forEach(cell => {
            const cellElement = document.createElement('td');
            cellElement.textContent = cell || 'Không có dữ liệu';
            rowElement.appendChild(cellElement);
        });

        tableBody.appendChild(rowElement);
    });
}

// Gọi hàm để lấy dữ liệu và hiển thị
fetchData();

function renderSlides(slidesData) {
    const slidesContainer = document.querySelector('#rectangle-4-slides');
    const dotsContainer = document.querySelector('#rectangle-4-dots');
    const titleElement = document.querySelector('#rectangle-4-title');
    let currentSlideIndex = 0;

    if (!slidesContainer || !dotsContainer || !titleElement) {
        console.error('Không tìm thấy các phần tử DOM cần thiết');
        return;
    }

    // Tạo slides
    slidesContainer.innerHTML = '';
    slidesData.forEach((data, index) => {
        const slideElement = displayData(data, index);
        slidesContainer.appendChild(slideElement);
    });

    // Tạo các dấu chấm (dots)
    dotsContainer.innerHTML = '';
    slidesData.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('data-index', index);
        dotsContainer.appendChild(dot);
    });

    // Cập nhật tiêu đề ban đầu
    titleElement.textContent = slidesData[0]?.[0] && slidesData[0]?.[1]
        ? `DỮ LIỆU CẢM BIẾN (${slidesData[0][0]} ${slidesData[0][1]})`
        : 'DỮ LIỆU CẢM BIẾN';

    // Thêm sự kiện cho các dấu chấm (dots)
    const dots = document.querySelectorAll('.rectangle-4-dots .dot');
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'));
            if (!isNaN(index)) {
                showSlide(index);
            }
        });
    });

    // Chuyển slide tiếp theo
    function showSlide(index) {
        const slides = document.querySelectorAll('.rectangle-4-slide');
        const dots = document.querySelectorAll('.rectangle-4-dots .dot');
        if (!slides.length || !dots.length || !titleElement) {
            console.error('Không tìm thấy slides, dots hoặc titleElement trong DOM');
            return;
        }
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[index].classList.add('active');
        dots[index].classList.add('active');

        const newTitle = slides[index].getAttribute('data-title') || 'DỮ LIỆU CẢM BIẾN';
        titleElement.textContent = newTitle;

        currentSlideIndex = index;
    }

    // Hiển thị slide tiếp theo
    function showNextSlide() {
        currentSlideIndex = (currentSlideIndex + 1) % slidesData.length;
        showSlide(currentSlideIndex);
    }

    // Hiển thị slide trước đó
    function showPrevSlide() {
        currentSlideIndex = (currentSlideIndex - 1 + slidesData.length) % slidesData.length;
        showSlide(currentSlideIndex);
    }

    // Gắn sự kiện cho nút "Tiếp theo" và "Trước"
    document.querySelector('.rectangle-4-prev')?.addEventListener('click', showPrevSlide);
    document.querySelector('.rectangle-4-next')?.addEventListener('click', showNextSlide);

    // Hiển thị slide đầu tiên
    showSlide(currentSlideIndex);
}

// Hàm hiển thị dữ liệu cho từng slide
function displayData(data, index) {
    const slideElement = document.createElement('div');
    slideElement.className = `rectangle-4-slide slide-${index + 1} ${index === 0 ? 'active' : ''}`;
    slideElement.setAttribute('data-title', `DỮ LIỆU CẢM BIẾN (${data[0]} ${data[1]})`);
    slideElement.innerHTML = `
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">Dữ liệu cảm biến MPU9250</h5>
                <p class="card-text" style="font-size: 14px; font-style: italic;">Dữ liệu được cập nhật liên tục</p>
                <p class="card-text">Ngày: ${data[0]}</p>
                <p class="card-text">Giờ: ${data[1]}</p>
                <p class="card-text">Gia tốc X: ${data[2] || 'Không có dữ liệu'} m/s²</p>
                <p class="card-text">Gia tốc Y: ${data[3] || 'Không có dữ liệu'} m/s²</p>
                <p class="card-text">Gia tốc Z: ${data[4] || 'Không có dữ liệu'} m/s²</p>
                <p class="card-text">Con quay X: ${data[5] || 'Không có dữ liệu'} °/s</p>
                <p class="card-text">Con quay Y: ${data[6] || 'Không có dữ liệu'} °/s</p>
                <p class="card-text">Con quay Z: ${data[7] || 'Không có dữ liệu'} °/s</p>
                <p class="card-text">Từ kế X: ${data[8] || 'Không có dữ liệu'} µT</p>
                <p class="card-text">Từ kế Y: ${data[9] || 'Không có dữ liệu'} µT</p>
                <p class="card-text">Từ kế Z: ${data[10] || 'Không có dữ liệu'} µT</p>
            </div>
        </div>
    `;
    return slideElement;
}

// Gọi hàm để lấy dữ liệu
fetchData();

// Dự báo thời tiết cho Rectangle 5
const districtSelect = document.querySelector('#district-select');
const communeSelect = document.querySelector('#commune-select');
const weatherTemp = document.querySelector('.weather-temp');
const weatherCondition = document.querySelector('.weather-condition');
const weatherHumidity = document.querySelector('.weather-humidity');
const weatherWind = document.querySelector('.weather-wind');
const weatherIcon = document.querySelector('.weather-icon');
const forecastDays = document.querySelectorAll('.forecast-day');

// Sử dụng API key từ dự án trước (có thể không hợp lệ)
const apiKey = '12118cdb333f0039947273d009989237'; // Thay bằng API key mới (32 ký tự)

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
    if (!districtSelect || !communeSelect) {
        console.error('Không tìm thấy districtSelect hoặc communeSelect trong DOM');
        return;
    }
    const district = districtSelect.value;
    const communes = locations[district]?.communes;
    if (!communes) {
        console.error(`Không tìm thấy xã cho huyện: ${district}`);
        return;
    }
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
    if (!weatherTemp || !weatherCondition || !weatherHumidity || !weatherWind || !weatherIcon || !forecastDays.length) {
        console.error('Không tìm thấy các phần tử thời tiết trong DOM');
        return;
    }

    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`;

        // Gọi API thời tiết hiện tại
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        if (weatherData.cod !== 200) {
            throw new Error(`Lỗi từ API thời tiết: ${weatherData.message}`);
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

districtSelect?.addEventListener('change', updateCommuneOptions);
communeSelect?.addEventListener('change', () => {
    if (!districtSelect || !communeSelect) {
        console.error('Không tìm thấy districtSelect hoặc communeSelect trong DOM');
        return;
    }
    const district = districtSelect.value;
    const commune = communeSelect.value;
    const { lat, lon } = locations[district]?.communes[commune] || {};
    if (lat && lon) {
        fetchWeather(lat, lon);
    } else {
        console.error(`Không tìm thấy tọa độ cho xã ${commune} trong huyện ${district}`);
    }
});

updateCommuneOptions();