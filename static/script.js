document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsSection = document.getElementById('results-section');
    const loader = document.getElementById('loader');
    const bgLayer = document.getElementById('bg-layer');
    const errorMsg = document.getElementById('error-msg');
    const errorText = document.getElementById('error-text');
    const closeError = document.getElementById('close-error');

    // Modal Elements
    const settingsModal = document.getElementById('settings-modal');
    const settingsToggle = document.getElementById('settings-toggle');
    const closeCallbacks = document.querySelectorAll('.close-modal');
    const saveKeysBtn = document.getElementById('save-keys');
    const owmInput = document.getElementById('owm-key');
    const unsplashInput = document.getElementById('unsplash-key');

    // Setup Local Storage for Keys
    const storedOwm = localStorage.getItem('ge_owm_key') || '';
    const storedUnsplash = localStorage.getItem('ge_unsplash_key') || '';
    owmInput.value = storedOwm;
    unsplashInput.value = storedUnsplash;

    // Random Destinations List
    const destinations = [
        "Kyoto, Japan", "Santorini, Greece", "Reykjavik, Iceland",
        "Cape Town, South Africa", "Machu Picchu, Peru", "Paris, France",
        "New York, USA", "Sydney, Australia", "Rome, Italy",
        "Banff, Canada", "Dubai, UAE", "Istanbul, Turkey",
        "Petra, Jordan", "Barcelona, Spain", "Amsterdam, Netherlands"
    ];

    function pickRandomCity() {
        const randomIndex = Math.floor(Math.random() * destinations.length);
        const city = destinations[randomIndex];
        cityInput.value = city;
        performSearch();
    }

    document.getElementById('random-btn').addEventListener('click', pickRandomCity);

    // --- Interaction Logic ---

    // Search Function
    async function performSearch() {
        const city = cityInput.value.trim();
        if (!city) return;

        // UI Reset
        resultsSection.classList.add('hidden');
        resultsSection.classList.remove('visible');
        errorMsg.classList.add('hidden');
        loader.classList.remove('hidden');

        // Headers with Keys
        const headers = {
            'X-OpenWeather-Key': localStorage.getItem('ge_owm_key') || '',
            'X-Unsplash-Key': localStorage.getItem('ge_unsplash_key') || ''
        };

        try {
            const response = await fetch(`/api/explore?city=${encodeURIComponent(city)}`, {
                headers: headers
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch data');
            }

            updateUI(data);

        } catch (error) {
            console.error('Search error:', error);
            showError(error.message);
        } finally {
            loader.classList.add('hidden');
        }
    }

    // Update UI with Data
    function updateUI(data) {
        // 1. Weather Data
        document.getElementById('result-city').textContent = data.city;
        document.getElementById('temperature').textContent = Math.round(data.weather.temperature);
        document.getElementById('weather-desc').textContent = data.weather.description;
        document.getElementById('humidity').textContent = `${data.weather.humidity}%`;
        document.getElementById('wind-speed').textContent = `${data.weather.wind_speed} m/s`;

        // Icon
        if (data.weather.icon) {
            const iconUrl = `https://openweathermap.org/img/wn/${data.weather.icon}@2x.png`;
            document.getElementById('weather-icon').src = iconUrl;
        }

        // Local Time Calculation
        const utcNow = new Date();
        const localTime = new Date(utcNow.getTime() + (utcNow.getTimezoneOffset() * 60000) + (data.weather.timezone_offset * 1000));
        document.getElementById('local-time').textContent = localTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 2. Background & Image Card
        if (data.image_url) {
            // Preload image to avoid flicker
            const img = new Image();
            img.src = data.image_url;
            img.onload = () => {
                bgLayer.style.backgroundImage = `url('${data.image_url}')`;
            };

            // Update "View Original" link
            document.getElementById('view-orig').href = data.image_url;
        } else {
            // Fallback or keep previous? Let's keep previous or set default.
        }

        // 3. Tourism Sites
        const tourismList = document.getElementById('tourism-list');
        tourismList.innerHTML = ''; // Clear previous

        if (data.tourism && data.tourism.length > 0) {
            data.tourism.forEach(site => {
                const a = document.createElement('a');
                a.href = site.url;
                a.target = "_blank";
                a.className = "site-item";

                // Thumbnail
                if (site.thumbnail) {
                    const img = document.createElement('img');
                    img.src = site.thumbnail;
                    img.alt = site.title;
                    img.className = "site-thumb";
                    a.appendChild(img);
                }

                // Info Container
                const infoDiv = document.createElement('div');
                infoDiv.className = "site-info";

                const title = document.createElement('div');
                title.className = "site-title";
                title.textContent = site.title;
                infoDiv.appendChild(title);

                if (site.description) {
                    const desc = document.createElement('div');
                    desc.className = "site-desc";
                    desc.textContent = site.description;
                    infoDiv.appendChild(desc);
                }

                a.appendChild(infoDiv);

                const li = document.createElement('li');
                li.appendChild(a);
                tourismList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No famous sites found nearby.";
            li.style.padding = "10px";
            li.style.color = "var(--text-muted)";
            tourismList.appendChild(li);
        }

        // Show Results
        resultsSection.classList.remove('hidden');
        // Small delay to allow display:block to apply before opacity transition
        setTimeout(() => {
            resultsSection.classList.add('visible');
        }, 50);
    }

    function showError(msg) {
        errorText.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    // Listeners
    searchBtn.addEventListener('click', performSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    closeError.addEventListener('click', () => {
        errorMsg.classList.add('hidden');
    });

    // --- Modal Logic ---
    function toggleModal(show) {
        if (show) settingsModal.classList.remove('hidden');
        else settingsModal.classList.add('hidden');
    }

    settingsToggle.addEventListener('click', () => toggleModal(true));

    closeCallbacks.forEach(btn => {
        btn.addEventListener('click', () => toggleModal(false));
    });

    // Close on click outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) toggleModal(false);
    });

    saveKeysBtn.addEventListener('click', () => {
        localStorage.setItem('ge_owm_key', owmInput.value.trim());
        localStorage.setItem('ge_unsplash_key', unsplashInput.value.trim());
        toggleModal(false);
        // Optional: Trigger notification
    });
});
