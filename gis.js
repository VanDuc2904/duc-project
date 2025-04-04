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
const SPREADSHEET_ID = '1416C6GSyUnI4G4nGVipU4XAeEZS1PIkagu07BRnk3rs'; // MPU9250
const SPREADSHEET_ID_RAIN = '1qThn_QQ0RSoUtsBuiC3_BAoEtq5EctXF5tweQuB3TxA'; // Rain
const API_KEY = 'AIzaSyABMCq59dfs-BwzlbPuQHHrnMcW1RfyP2M';
const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/BMI160_Data!A1:J?key=${API_KEY}`;
const API_URL_RAIN = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID_RAIN}/values/Sheet1!A1:K?key=${API_KEY}`;
const OPENWEATHER_API_KEY = '12118cdb333f0039947273d009989237'; // OpenWeatherMap API key

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
    return rainData.map(value => {
        cumulativeRain += value;
        return cumulativeRain.toFixed(2);
    });
}

// Hàm định dạng thời gian
function formatDateTime(date) {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    };
    return date.toLocaleString('vi-VN', options).replace(/,/, '');
}

// Google Map với hai marker
window.initMap = async function () {
    console.log("initMap called"); // Debug: Check if initMap is called

    const mapOptions = {
        center: { lat: 20.995536, lng: 105.808129 }, // Tọa độ trung tâm tại điểm bạn cung cấp
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    const map = new google.maps.Map(document.getElementById('map'), mapOptions);
    console.log("Map initialized:", map); // Debug: Check if map is initialized

    // Lấy dữ liệu cảm biến gia tốc
    const accelDataRaw = await fetchData(API_URL);
    const accelStations = accelDataRaw.slice(1).map(row => ({
        time: row[0] || "N/A",
        dispX: parseFloat(row[1]) || 0,
        dispY: parseFloat(row[2]) || 0,
        dispZ: parseFloat(row[3]) || 0,
        lat: parseFloat(row[8]) || 20.995536, // Giả định cột I là latitude
        lng: parseFloat(row[9]) || 105.808129, // Giả định cột J là longitude
        district: row[4] || "Không xác định", // Giả định cột E là huyện
        commune: row[5] || "Không xác định", // Giả định cột F là xã
        station: row[6] || "Không xác định", // Giả định cột G là vị trí trạm
        description: row[7] || "Không có mô tả" // Giả định cột H là mô tả
    }));

    // Lấy dữ liệu lượng mưa từ Google Sheets
    const rainDataRaw = await fetchData(API_URL_RAIN);
    const rainStations = rainDataRaw.slice(1).map(row => ({
        time: row[0] || "N/A",
        currentRain: parseFloat(row[3]) || 0,
        lat: parseFloat(row[1]) || 20.995536,
        lng: parseFloat(row[2]) || 105.808129,
        district: row[7] || "Không xác định", // Giả định cột H là huyện
        commune: row[8] || "Không xác định", // Giả định cột I là xã
        station: row[9] || "Không xác định", // Giả định cột J là vị trí trạm
        description: row[10] || "Không có mô tả" // Giả định cột K là mô tả
    }));

    // Lọc chỉ lấy dữ liệu cho tọa độ được chỉ định (20.995536, 105.808129)
    let selectedAccelStation = accelStations.find(
        station => station.lat === 20.995536 && station.lng === 105.808129
    );
    let selectedRainStation = rainStations.find(
        station => station.lat === 20.995536 && station.lng === 105.808129
    );

    // Nếu không tìm thấy dữ liệu, sử dụng dữ liệu mặc định
    if (!selectedAccelStation) {
        console.warn("No matching accel station found, using default data");
        selectedAccelStation = {
            lat: 20.995536,
            lng: 105.808129,
            time: "2025-04-04 11:00",
            dispX: 10,
            dispY: 5,
            dispZ: 3,
            district: "Hà Nội",
            commune: "Không xác định",
            station: "Trạm quan trắc Hà Nội",
            description: "Khu vực có nguy cơ trượt lở thấp"
        };
        // Dữ liệu mẫu cho biểu đồ dispX
        accelStations.push(
            { time: "2025-04-01 10:00", dispX: 5, lat: 20.995536, lng: 105.808129 },
            { time: "2025-04-02 10:00", dispX: 10, lat: 20.995536, lng: 105.808129 },
            { time: "2025-04-03 10:00", dispX: 15, lat: 20.995536, lng: 105.808129 },
            { time: "2025-04-04 10:00", dispX: 20, lat: 20.995536, lng: 105.808129 },
            { time: "2025-04-05 10:00", dispX: 25, lat: 20.995536, lng: 105.808129 }
        );
    }

    if (!selectedRainStation) {
        console.warn("No matching rain station found, using default data");
        selectedRainStation = {
            lat: 20.995536,
            lng: 105.808129,
            time: "2025-04-04 11:00",
            currentRain: 5,
            district: "Hà Nội",
            commune: "Không xác định",
            station: "Trạm quan trắc Hà Nội",
            description: "Khu vực có nguy cơ trượt lở thấp"
        };
        // Dữ liệu mẫu cho biểu đồ lượng mưa
        rainStations.push(
            { time: "2025-04-01 10:00", currentRain: 2, lat: 20.995536, lng: 105.808129 },
            { time: "2025-04-02 10:00", currentRain: 4, lat: 20.995536, lng: 105.808129 },
            { time: "2025-04-03 10:00", currentRain: 6, lat: 20.995536, lng: 105.808129 },
            { time: "2025-04-04 10:00", currentRain: 8, lat: 20.995536, lng: 105.808129 },
            { time: "2025-04-05 10:00", currentRain: 10, lat: 20.995536, lng: 105.808129 }
        );
    }

    // Tạo marker và InfoWindow
    const infoWindow = new google.maps.InfoWindow();
    console.log("InfoWindow created:", infoWindow); // Debug: Check if InfoWindow is created

    // Định nghĩa URL hình ảnh cho các marker (có thể thay đổi)
    const redMarkerIcon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'; // Hình ảnh cho marker đỏ
    const greenMarkerIcon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'; // Hình ảnh cho marker xanh

    // Marker 1: Red marker for accel and rain data from Google Sheets
    const marker1 = new google.maps.Marker({
        position: { lat: 20.995536, lng: 105.808129 },
        map: map,
        title: `YB-TQLM-1`, // Đặt tên điểm là YB-TQLM-1
        icon: redMarkerIcon // Sử dụng hình ảnh tùy chỉnh cho marker đỏ
    });
    console.log("Marker 1 created:", marker1); // Debug: Check if marker is created

    marker1.addListener('click', () => {
        console.log("Marker 1 clicked"); // Debug: Check if click event is triggered
        showStationInfo(selectedRainStation, selectedAccelStation, infoWindow, map, marker1);
    });

    // Marker 2: Green marker for OpenWeatherMap rainfall forecast
    // Slightly offset to avoid overlap
    const marker2 = new google.maps.Marker({
        position: { lat: 20.995536 + 0.0005, lng: 105.808129 + 0.0005 }, // Nhích nhẹ để tránh chồng lấn
        map: map,
        title: `Dự báo lượng mưa`,
        icon: greenMarkerIcon // Sử dụng hình ảnh tùy chỉnh cho marker xanh
    });
    console.log("Marker 2 created:", marker2); // Debug: Check if marker is created

    marker2.addListener('click', () => {
        console.log("Marker 2 clicked"); // Debug: Check if click event is triggered
        showWeatherForecastInfo(20.995536, 105.808129, infoWindow, map, marker2);
    });

    // Hàm hiển thị thông tin và biểu đồ cho Marker 1 (Google Sheets data)
    function showStationInfo(rainStation, accelStation, infoWindow, map, marker) {
        try {
            console.log("showStationInfo called with:", { rainStation, accelStation }); // Debug: Check input data

            const lat = accelStation.lat;
            const lng = accelStation.lng;
            const district = accelStation.district;
            const commune = accelStation.commune;
            const stationLocation = accelStation.station;
            const description = accelStation.description;
            const title = `YB-TQLM-1`;

            // Tạo nội dung HTML cho InfoWindow theo định dạng trong hình
            const content = document.createElement('div');
            content.style.width = '400px';
            content.style.height = '500px'; // Tăng chiều cao để chứa cả hai biểu đồ
            content.innerHTML = `
                <h3>THÔNG TIN ĐIỂM TRƯỢT LỞ</h3>
                <p><strong>Tên điểm:</strong> ${title}</p>
                <p><strong>Tọa độ:</strong> Kinh độ: ${lng.toFixed(2)}; Vĩ độ: ${lat.toFixed(2)}</p>
                <p><strong>Huyện:</strong> ${district}</p>
                <p><strong>Xã:</strong> ${commune}</p>
                <p><strong>Vị trí:</strong> ${stationLocation}</p>
                <p><strong>Mô tả:</strong> ${description}</p>
                <h4>Chuyển vị X</h4>
                <canvas id="dispX-chart-${title}" width="350" height="150"></canvas>
                <h4>Lượng mưa</h4>
                <canvas id="rain-chart-${title}" width="350" height="150"></canvas>
            `;

            infoWindow.setContent(content);
            console.log("InfoWindow content set:", content.innerHTML); // Debug: Check content

            infoWindow.open(map, marker);
            console.log("InfoWindow opened"); // Debug: Check if InfoWindow opens

            // Sau khi InfoWindow mở, vẽ biểu đồ
            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
                console.log("InfoWindow domready event triggered"); // Debug: Check if domready is triggered

                // Biểu đồ chuyển vị theo dispX
                const dispXCtx = document.getElementById(`dispX-chart-${title}`);
                if (!dispXCtx) {
                    console.error("DispX canvas element not found:", `dispX-chart-${title}`);
                    return;
                }
                const dispXChartCtx = dispXCtx.getContext('2d');
                console.log("DispX chart context created:", dispXChartCtx); // Debug: Check chart context

                const accelDataSliced = accelStations.slice(-5).filter(s => s.lat === accelStation.lat && s.lng === accelStation.lng);
                console.log("Data for dispX chart:", accelDataSliced); // Debug: Check chart data

                new Chart(dispXChartCtx, {
                    type: 'line',
                    data: {
                        labels: accelDataSliced.map(s => s.time),
                        datasets: [
                            { label: 'Disp X (mm)', data: accelDataSliced.map(s => s.dispX), borderColor: 'red', fill: false }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            x: { title: { display: true, text: 'Thời gian' } },
                            y: { title: { display: true, text: 'Chuyển vị X (mm)' } }
                        }
                    }
                });
                console.log("DispX chart rendered"); // Debug: Check if chart is rendered

                // Biểu đồ lượng mưa
                const rainCtx = document.getElementById(`rain-chart-${title}`);
                if (!rainCtx) {
                    console.error("Rain canvas element not found:", `rain-chart-${title}`);
                    return;
                }
                const rainChartCtx = rainCtx.getContext('2d');
                console.log("Rain chart context created:", rainChartCtx); // Debug: Check chart context

                const rainDataSliced = rainStations.slice(-5).filter(s => s.lat === rainStation.lat && s.lng === rainStation.lng);
                const currentRainData = rainDataSliced.map(s => s.currentRain);
                const cumulativeRainData = calculateCumulativeRain(currentRainData);
                console.log("Data for rain chart:", { currentRainData, cumulativeRainData }); // Debug: Check chart data

                new Chart(rainChartCtx, {
                    data: {
                        labels: rainDataSliced.map(s => s.time),
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
                console.log("Rain chart rendered"); // Debug: Check if chart is rendered
            });
        } catch (error) {
            console.error("Error in showStationInfo:", error); // Debug: Catch any errors
        }
    }

    // Hàm hiển thị thông tin và biểu đồ dự báo lượng mưa từ OpenWeatherMap cho Marker 2
    async function showWeatherForecastInfo(lat, lng, infoWindow, map, marker) {
        try {
            console.log("showWeatherForecastInfo called for lat:", lat, "lng:", lng); // Debug: Check input coordinates

            // Lấy dữ liệu dự báo từ OpenWeatherMap
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=vi`;
            const forecastResponse = await fetch(forecastUrl);
            if (!forecastResponse.ok) throw new Error(`HTTP Error: ${forecastResponse.status}`);
            const forecastData = await forecastResponse.json();
            console.log("OpenWeatherMap forecast data:", forecastData); // Debug: Check forecast data

            // Lấy dữ liệu lượng mưa dự báo (rain.3h) cho 5 ngày tới
            const forecastList = forecastData.list.filter((_, i) => i % 8 === 4).slice(0, 5); // Lấy dữ liệu mỗi 24 giờ (3h * 8 = 24h)
            const rainForecastData = forecastList.map(item => item.rain ? (item.rain['3h'] || 0) : 0);
            const cumulativeRainForecastData = calculateCumulativeRain(rainForecastData);
            const labels = forecastList.map(item => {
                const date = new Date(item.dt * 1000);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            });

            // Tạo nội dung HTML cho InfoWindow
            const content = document.createElement('div');
            content.style.width = '400px';
            content.style.height = '400px'; // Giảm chiều cao vì chỉ có một biểu đồ
            content.innerHTML = `
                <h3>DỰ BÁO LƯỢNG MƯA (Theo OpenWeatherMap)</h3>
                <p><strong>Tọa độ:</strong> Kinh độ: ${lng.toFixed(2)}; Vĩ độ: ${lat.toFixed(2)}</p>
                <p><strong>Huyện:</strong> Hà Nội</p>
                <p><strong>Xã:</strong> Không xác định</p>
                <h4>Lượng mưa dự báo</h4>
                <canvas id="forecast-rain-chart" width="350" height="150"></canvas>
            `;

            infoWindow.setContent(content);
            console.log("InfoWindow content set for forecast:", content.innerHTML); // Debug: Check content

            infoWindow.open(map, marker);
            console.log("InfoWindow opened for forecast"); // Debug: Check if InfoWindow opens

            // Vẽ biểu đồ lượng mưa dự báo (kết hợp cả lượng mưa giờ và tích lũy)
            google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
                console.log("InfoWindow domready event triggered for forecast"); // Debug: Check if domready is triggered

                // Biểu đồ lượng mưa dự báo (bar chart) và lượng mưa tích lũy (line chart)
                const rainCtx = document.getElementById('forecast-rain-chart');
                if (!rainCtx) {
                    console.error("Forecast rain canvas element not found");
                    return;
                }
                const rainChartCtx = rainCtx.getContext('2d');
                console.log("Forecast rain chart context created:", rainChartCtx); // Debug: Check chart context

                new Chart(rainChartCtx, {
                    data: {
                        labels: labels,
                        datasets: [
                            { type: 'bar', label: 'Lượng mưa dự báo (mm)', data: rainForecastData, backgroundColor: 'rgba(54, 162, 235, 0.5)', yAxisID: 'y1' },
                            { type: 'line', label: 'Lượng mưa tích lũy dự báo (mm)', data: cumulativeRainForecastData, borderColor: 'red', fill: false, yAxisID: 'y2' }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            x: { title: { display: true, text: 'Ngày' } },
                            y1: { position: 'left', title: { display: true, text: 'Lượng mưa (mm)' }, beginAtZero: true },
                            y2: { position: 'right', title: { display: true, text: 'Lượng mưa tích lũy (mm)' }, beginAtZero: true, grid: { drawOnChartArea: false } }
                        }
                    }
                });
                console.log("Forecast rain chart rendered"); // Debug: Check if chart is rendered
            });
        } catch (error) {
            console.error("Error in showWeatherForecastInfo:", error); // Debug: Catch any errors
        }
    }
};

// Xử lý và hiển thị dữ liệu cho Rectangle-4
async function renderRectangle4() {
    const accelDataRaw = await fetchData(API_URL);
    const rainDataRaw = await fetchData(API_URL_RAIN);

    // Cập nhật thời gian
    const updateTimeElement = document.getElementById('update-time');
    if (updateTimeElement) { // Kiểm tra null
        const updateTime = new Date();
        updateTimeElement.textContent = `Cập nhật lúc: ${formatDateTime(updateTime)}`;
    } else {
        console.warn('Phần tử #update-time không tồn tại trong DOM');
    }

    // Slide 1: Bảng dữ liệu ESP32
    const accelData = accelDataRaw.slice(1).slice(-5); // Lấy 5 dòng cuối
    const accelTableBody = document.getElementById('accel-table-body');
    if (accelTableBody) {
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
    } else {
        console.warn('Phần tử #accel-table-body không tồn tại trong DOM');
    }

    // Slide 2: Biểu đồ Displacement X
    const dispXChartCtx = document.getElementById('dispX-chart');
    if (dispXChartCtx) {
        new Chart(dispXChartCtx.getContext('2d'), {
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
    } else {
        console.warn('Phần tử #dispX-chart không tồn tại trong DOM');
    }

    // Slide 3: Bảng thông tin mưa
    const rainData = rainDataRaw.slice(1).slice(-5); // Lấy 5 dòng cuối
    const rainTableBody = document.getElementById('rain-table-body');
    if (rainTableBody) {
        rainTableBody.innerHTML = rainData.map(row => `
            <tr>
                <td>${row[0]}</td>
                <td>${row[3]}</td>
                <td>${row[7]}</td>
            </tr>
        `).join('');
    } else {
        console.warn('Phần tử #rain-table-body không tồn tại trong DOM');
    }

    // Slide 4: Biểu đồ mưa
    const rainChartCtx = document.getElementById('rain-chart');
    if (rainChartCtx) {
        const rainDataSliced = rainDataRaw.slice(1);
        const currentRainData = rainDataSliced.map(row => parseFloat(row[3]) || 0);
        const cumulativeRainData = calculateCumulativeRain(currentRainData);
        new Chart(rainChartCtx.getContext('2d'), {
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
    } else {
        console.warn('Phần tử #rain-chart không tồn tại trong DOM');
    }

    // Slide 5: Biểu đồ Velocity Z
    const velZChartCtx = document.getElementById('velZ-chart');
    if (velZChartCtx) {
        new Chart(velZChartCtx.getContext('2d'), {
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
    } else {
        console.warn('Phần tử #velZ-chart không tồn tại trong DOM');
    }

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
    const prevButton = document.querySelector('.rectangle-4-prev');
    const nextButton = document.querySelector('.rectangle-4-next');
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(currentIndex);
        });
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % slides.length;
            showSlide(currentIndex);
        });
    }

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
        if (!weatherResponse.ok) throw new Error(`HTTP Error: ${weatherResponse.status}`);
        const weatherData = await weatherResponse.json();

        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) throw new Error(`HTTP Error: ${forecastResponse.status}`);
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
        weatherTemp.textContent = 'Lỗi tải dữ liệu';
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
