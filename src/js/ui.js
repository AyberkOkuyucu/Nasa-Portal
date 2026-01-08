/* =========================================================
   UI.JS
   Uygulamanın tüm arayüz (UI) işlemlerini içerir.
   - Loader / hata mesajları
   - APOD render
   - Asteroid, Space Weather kartları
   - NASA Gallery slider
   - Navbar scroll efekti
========================================================= */

/* =========================================================
   LOADER
   API çağrıları sırasında kullanıcıya geri bildirim verir
========================================================= */
export function showLoader(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="text-center my-5">
            <div class="spinner-border text-info"></div>
            <p class="mt-2 text-muted">Veriler alınıyor...</p>
        </div>
    `;
}

/* =========================================================
   APOD (GÜNÜN GÖRSELİ) RENDER
========================================================= */
export function renderApod(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isVideo = data.media_type === 'video';

    /* ================= MEDYA ================= */
    const mediaHtml = isVideo
        ? `
        <div class="ratio ratio-16x9 rounded-top overflow-hidden">
            <iframe
                src="${data.url}"
                allowfullscreen
                style="border:0;">
            </iframe>
        </div>
        `
        : `
        <div class="position-relative overflow-hidden rounded-top">
            <img 
                src="${data.url}"
                onerror="this.onerror=null; this.src='./public/icons/icons8-nasa-512.png';"
                class="w-100"
                style="max-height: 340px; object-fit: cover;"
                alt="${data.title}"
                data-hd="${data.hdurl || data.url}"
            >

            <span
                class="position-absolute top-0 end-0 m-3
                       badge bg-black bg-opacity-75 text-warning
                       border border-warning"
            >
                <i class="fa-regular fa-calendar-days me-1"></i>
                ${data.date}
            </span>
        </div>
        `;

    container.innerHTML = `
        <div class="glass-card overflow-hidden">

            ${mediaHtml}

            <div class="p-4">
                <h3 class="text-warning fw-bold mb-2">
                    ${data.title}
                </h3>

                <p class="text-secondary small mb-4">
                    NASA Astronomy Picture of the Day
                </p>

                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex gap-2">
                        ${!isVideo
            ? `
                                <button
                                    class="btn btn-outline-light btn-sm apod-zoom-btn"
                                >
                                    <i class="fa-solid fa-magnifying-glass-plus"></i>
                                </button>
                                `
            : ''
        }

                        <a
                            href="./detail.html?date=${data.date}"
                            class="btn btn-outline-info btn-sm"
                        >
                            <i class="fa-solid fa-circle-info"></i>
                        </a>
                    </div>

                    <button
                        id="fav-btn"
                        class="btn btn-warning btn-sm fw-semibold"
                    >
                        <i class="fa-regular fa-star me-1"></i>
                        Favori
                    </button>
                </div>
            </div>

        </div>
    `;
}

/* =========================================================
   HATA MESAJI
========================================================= */
export function showError(message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="alert alert-danger text-center shadow">
            <i class="fa-solid fa-triangle-exclamation me-2"></i>
            ${message}
        </div>
    `;
}

/* =========================================================
   NAVBAR SCROLL EFEKTİ
========================================================= */
export function initNavbarEffect() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* =========================================================
   SPACE WEATHER (DONKI) RENDER
========================================================= */
export function renderSpaceWeather(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="text-secondary small">
                <i class="fa-solid fa-circle-check me-1"></i>
                Güncel solar aktivite yok
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    data.forEach(event => {
        const card = document.createElement('div');
        card.className = 'glass-card p-3 mb-3';

        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong class="text-warning">
                    <i class="fa-solid fa-fire-flame-curved me-1"></i>
                    ${event.classType || 'Solar Event'}
                </strong>

                <span class="badge bg-black bg-opacity-75 text-danger">
                    ${event.beginTime?.split('T')[0]}
                </span>
            </div>

            <div class="small text-secondary">
                Kaynak: ${event.sourceLocation || 'NASA DONKI'}
            </div>
        `;

        container.appendChild(card);
    });
}

/* =========================================================
   ASTEROID RADAR RENDER
========================================================= */
export function renderAsteroids(data, containerId) {
    const list = document.getElementById(containerId);
    if (!list) return;

    list.innerHTML = data.slice(0, 4).map(neo => {
        const approach = neo.close_approach_data?.[0];

        const speed = approach
            ? Math.round(approach.relative_velocity.kilometers_per_hour)
            : '—';

        const distance = approach
            ? Math.round(approach.miss_distance.kilometers / 1_000_000)
            : '—';

        const diameter = Math.round(
            neo.estimated_diameter?.meters?.estimated_diameter_max || 0
        );

        return `
            <div class="glass-card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <strong class="text-warning">
                        ${neo.name.replace(/[()]/g, '')}
                    </strong>

                    <span class="badge ${neo.is_potentially_hazardous_asteroid
                ? 'bg-danger'
                : 'bg-success'
            }">
                        ${neo.is_potentially_hazardous_asteroid
                ? 'TEHLİKELİ'
                : 'GÜVENLİ'
            }
                    </span>
                </div>

                <div class="small text-secondary">
                    <div>
                        <i class="fa-solid fa-gauge-high me-1"></i>
                        ${speed} km/sa
                    </div>
                    <div>
                        <i class="fa-solid fa-ruler-combined me-1"></i>
                        ${diameter} m
                    </div>
                    <div>
                        <i class="fa-solid fa-location-crosshairs me-1"></i>
                        ${distance} M km
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/* =========================================================
   NASA IMAGE GALLERY (SLIDER)
========================================================= */
export function initNasaGallery(results) {
    const slider = document.getElementById('nasa-slider');
    const bg = document.getElementById('gallery-bg');

    if (!slider || !bg || !results || results.length === 0) return;

    /* 1️⃣ Kartları string olarak üret */
    const cardsHtml = results.map((item, i) => `
        <div class="gallery-card glass-card" data-index="${i}">
            <img
                src="${item.thumb}"
                class="nasa-lightbox-trigger"
                data-index="${i}"
                style="cursor:pointer"
                alt="${item.title}"
                loading="lazy"
            />

            <div class="p-3">
                <h6 class="text-warning text-truncate mb-2">
                    ${item.title}
                </h6>

                <div class="d-flex gap-2">
                    <a
                        href="./library-detail.html?id=${i}"
                        class="btn btn-outline-warning btn-sm w-100"
                    >
                        Detay
                    </a>

                    <button
                        class="btn btn-fav-square fav-btn"
                        data-index="${i}"
                    >
                        <i class="fa-regular fa-star"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    /* 2️⃣ Tek seferde DOM'a bas (performans) */
    slider.innerHTML = cardsHtml;

    /* 3️⃣ Başlangıç durumu */
    updateGalleryState(2, results);
}

/* =========================================================
   GALERİ POZİSYON GÜNCELLEME
========================================================= */
export function updateGalleryState(activeIndex, results) {
    const cards = document.querySelectorAll('.gallery-card');
    const bg = document.getElementById('gallery-bg');
    const total = cards.length;

    cards.forEach(card => {
        const i = Number(card.dataset.index);
        card.className = 'gallery-card glass-card';

        let diff = i - activeIndex;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        if (diff >= -2 && diff <= 2) {
            card.classList.add(`pos-${diff}`);
        } else {
            card.classList.add('hidden');
        }
    });

    const activeItem = results[activeIndex];
    bg.style.backgroundImage =
        `url(${activeItem.hdImage || activeItem.thumb})`;
}
