/* =========================================================
   APP.JS
   Uygulamanın ana kontrol dosyasıdır.
   - Sayfa yüklendiğinde tüm API çağrılarını başlatır
   - UI etkileşimlerini yönetir
   - PWA (Service Worker) kaydını yapar
========================================================= */

import {
    getDailyPhoto,
    getAsteroidData,
    searchNasaImages,
    getSpaceWeather
} from './api.js';

import {
    renderApod,
    renderAsteroids,
    renderSpaceWeather,
    initNasaGallery,
    updateGalleryState,
    showLoader,
    showError,
    initNavbarEffect,
} from './ui.js';

import { saveToFavorites } from './storage.js';

/* ================= GLOBAL STATE ================= */
let nasaGalleryData = [];
let currentGalleryIndex = 2;

/* =========================================================
   DOM YÜKLENDİKTEN SONRA ANA AKIŞ
========================================================= */
document.addEventListener('DOMContentLoaded', async () => {

    /* ================= DOM REFERANSLARI ================= */
    const apodSearchBtn = document.getElementById('search-btn');
    const resetBtn = document.getElementById('reset-btn');
    const dateInput = document.getElementById('date-input');
    const nasaSearchBtn = document.getElementById('nasa-search-btn');
    const nasaSearchInput = document.getElementById('nasa-search-input');

    // Navbar scroll efekti (varsa)
    if (typeof initNavbarEffect === 'function') initNavbarEffect();

    /* =====================================================
       1️⃣ APOD – GÜNÜN ASTRONOMİ GÖRSELİ
    ====================================================== */
    async function loadMainApod(date = '') {
        const containerId = 'apod-container';
        showLoader(containerId);

        try {
            const result = await getDailyPhoto(date);

            // Veri gelmezse hata göster
            if (!result || !result.data) {
                showError(
                    'NASA APOD servisi şu anda yanıt vermiyor.',
                    containerId
                );
                return;
            }

            // Görseli render et
            renderApod(result.data, containerId);

            // Plan B uyarısı
            if (result.isSample) {
                showError(
                    'Canlı API erişilemiyor, örnek veri gösteriliyor.',
                    containerId,
                    'warning'
                );
            }

            // Favorilere ekleme
            const favBtn = document.getElementById('fav-btn');
            if (favBtn) {
                favBtn.onclick = async () => {
                    await saveToFavorites(result.data, 'APOD');
                    favBtn.innerHTML =
                        `<i class="fa-solid fa-check me-1"></i> Kaydedildi`;
                    favBtn.classList.replace('btn-warning', 'btn-success');
                    favBtn.disabled = true;
                };
            }

        } catch (err) {
            console.error('APOD Hatası:', err);
            showError('Veri çekilemedi.', containerId);
        }
    }

    /* =====================================================
       2️⃣ ASTEROID RADAR
       Güncel NEO (Near Earth Object) verileri
    ====================================================== */
    async function loadAsteroidRadar() {
        const containerId = 'asteroid-list';
        showLoader(containerId);

        try {
            const data = await getAsteroidData();
            renderAsteroids(data, containerId);
        } catch (err) {
            console.error('Asteroid Radar Hatası:', err);
            showError('Asteroid verisi alınamadı', containerId);
        }
    }

    /* =====================================================
       3️⃣ NASA IMAGE LIBRARY (GALERİ)
       Slider + detay sayfası için kullanılır
    ====================================================== */
    async function loadNasaLibrary(query = 'galaxy') {
        showLoader('nasa-slider');

        try {
            const result = await searchNasaImages(query);

            if (!result || !Array.isArray(result.data) || result.data.length === 0) {
                throw new Error('Boş veri');
            }

            nasaGalleryData = result.data;
            currentGalleryIndex = 2;

            // Session cache (sayfa yenilenirse kaybolur)
            sessionStorage.setItem(
                'nasaGalleryCache',
                JSON.stringify(result.data)
            );

            initNasaGallery(nasaGalleryData);
            updateGalleryState(currentGalleryIndex, nasaGalleryData);

        } catch (err) {
            console.warn('NASA API kapalı, fallback devrede');

            // Session fallback
            const cached = sessionStorage.getItem('nasaGalleryCache');
            if (cached) {
                nasaGalleryData = JSON.parse(cached);
                currentGalleryIndex = 2;

                initNasaGallery(nasaGalleryData);
                updateGalleryState(currentGalleryIndex, nasaGalleryData);
            } else {
                showError('NASA Gallery yüklenemedi', 'nasa-slider');
            }
        }
    }

    /* ================= GALERİ NAVİGASYONU ================= */
    document.getElementById('gallery-prev')?.addEventListener('click', () => {
        currentGalleryIndex =
            (currentGalleryIndex - 1 + nasaGalleryData.length) % nasaGalleryData.length;

        updateGalleryState(currentGalleryIndex, nasaGalleryData);
    });

    document.getElementById('gallery-next')?.addEventListener('click', () => {
        currentGalleryIndex =
            (currentGalleryIndex + 1) % nasaGalleryData.length;

        updateGalleryState(currentGalleryIndex, nasaGalleryData);
    });

    /* =====================================================
       4️⃣ SPACE WEATHER (DONKI)
       LocalStorage + TTL cache kullanır
    ====================================================== */
    async function loadSpaceWeatherMonitor() {
        const list = document.getElementById('space-weather');
        if (!list) return;

        const CACHE_KEY = 'space_weather_cache';
        const CACHE_TTL = 1000 * 60 * 30; // 30 dakika

        const cached = localStorage.getItem(CACHE_KEY);

        // Cache geçerliyse direkt göster
        if (cached) {
            const { data, time } = JSON.parse(cached);
            if (Date.now() - time < CACHE_TTL) {
                renderSpaceWeather(data, 'space-weather');
                return;
            }
        }

        try {
            const flares = await getSpaceWeather();

            if (!flares?.length) {
                list.innerHTML =
                    '<div class="text-secondary small">Veri yok</div>';
                return;
            }

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({ data: flares, time: Date.now() })
            );

            renderSpaceWeather(flares, 'space-weather');

        } catch (e) {
            list.innerHTML =
                '<div class="text-warning p-2">Uzay havası alınamadı</div>';
        }
    }

    /* ================= EVENTLER ================= */
    nasaSearchBtn?.addEventListener('click', () => {
        const val = nasaSearchInput.value.trim() || 'nebula';
        loadNasaLibrary(val);
    });

    apodSearchBtn?.addEventListener('click', () => {
        if (!dateInput.value) return alert('Lütfen tarih seçin!');
        resetBtn?.classList.remove('d-none');
        loadMainApod(dateInput.value);
    });

    resetBtn?.addEventListener('click', () => {
        dateInput.value = '';
        resetBtn.classList.add('d-none');
        loadMainApod();
    });

    /* ================= SAYFA İLK YÜKLEME ================= */
    loadMainApod();
    loadAsteroidRadar();
    loadNasaLibrary();
    loadSpaceWeatherMonitor();
});

/* =========================================================
   SERVICE WORKER KAYDI (PWA)
========================================================= */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered', reg.scope))
            .catch(err => console.error('SW failed', err));
    });
}

/* =========================================================
   GLOBAL CLICK HANDLER
   - Lightbox
   - Favori ekleme
========================================================= */
document.addEventListener('click', async e => {

    /* ================= NASA GALLERY LIGHTBOX ================= */
    const galleryTrigger = e.target.closest('.nasa-lightbox-trigger');
    if (galleryTrigger) {
        const index = galleryTrigger.dataset.index;
        const cached = sessionStorage.getItem('nasaGalleryCache');

        if (cached) {
            const items = JSON.parse(cached);
            const item = items[index];

            if (item) {
                const modalElement = document.getElementById('imageLightbox');
                const modalImg = document.getElementById('lightboxImage');
                modalImg.src = item.hdImage || item.thumb;

                const modalInstance = new bootstrap.Modal(modalElement);
                modalInstance.show();
            }
        }
        return;
    }

    /* ================= APOD LIGHTBOX ================= */
    const apodTrigger = e.target.closest('#apod-container img');
    if (apodTrigger) {
        const modalElement = document.getElementById('imageLightbox');
        const modalImg = document.getElementById('lightboxImage');
        modalImg.src = apodTrigger.src;

        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
        return;
    }

    /* ================= FAVORİ EKLEME ================= */
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
        e.preventDefault();

        const index = favBtn.dataset.index;
        const cached = sessionStorage.getItem('nasaGalleryCache');
        if (!cached) return;

        const items = JSON.parse(cached);
        const item = items[index];
        if (!item) return;

        const saved = await saveToFavorites(item, 'NASA_LIBRARY');

        if (saved) {
            favBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            favBtn.classList.replace('btn-warning', 'btn-success');
            favBtn.disabled = true;
        } else {
            alert('Bu görsel zaten favorilerinizde!');
        }
        return;
    }

    /* ================= APOD ZOOM BUTONU ================= */
    const zoomBtn = e.target.closest('.apod-zoom-btn');
    if (zoomBtn) {
        const img = document.querySelector('#apod-container img');
        if (img) {
            const modalElement = document.getElementById('imageLightbox');
            const modalImg = document.getElementById('lightboxImage');
            modalImg.src = img.src;

            const modalInstance = new bootstrap.Modal(modalElement);
            modalInstance.show();
        }
    }
});
