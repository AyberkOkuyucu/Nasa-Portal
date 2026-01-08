/* =========================================================
   ARCHIVE-LOGIC.JS
   APOD Arşiv sayfasının tüm iş mantığını yönetir.
   - API çağrısı
   - Cache (localStorage)
   - Fallback (Plan B)
   - UI render
   - Favori ekleme
========================================================= */

import { showLoader, showError, initNavbarEffect } from './ui.js';
import { saveToFavorites } from './storage.js';
import { getApodArchive } from './api.js';

/* ================= CACHE AYARI ================= */
const ARCHIVE_CACHE_KEY = 'apod_archive_cache';

/* =========================================================
   SAYFA YÜKLENDİĞİNDE
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const containerId = 'archive-result';
    const refreshBtn = document.getElementById('refresh-archive');

    // Navbar scroll efekti (varsa)
    if (typeof initNavbarEffect === 'function') initNavbarEffect();

    /* =====================================================
       ARŞİV VERİLERİNİ YÜKLE
       - Cache öncelikli
       - İsteğe bağlı zorla yenileme
    ====================================================== */
    async function loadArchive(forceRefresh = false) {
        const container = document.getElementById(containerId);
        if (!container) return;

        showLoader(containerId);

        /* 1️⃣ CACHE → Hızlı gösterim */
        if (!forceRefresh) {
            const cached = localStorage.getItem(ARCHIVE_CACHE_KEY);
            if (cached) {
                renderList(JSON.parse(cached));
            }
        }

        try {
            const result = await getApodArchive(12);

            if (!result || !Array.isArray(result.data)) {
                showError(containerId, 'Arşiv verisi alınamadı');
                return;
            }

            // Sadece görsel tipindeki içerikler
            const images = result.data
                .filter(item => item.media_type === 'image')
                .slice(0, 9);

            if (images.length === 0) {
                showError(containerId, 'Gösterilecek veri bulunamadı.');
                return;
            }

            /* 2️⃣ CACHE GÜNCELLE */
            localStorage.setItem(
                ARCHIVE_CACHE_KEY,
                JSON.stringify(images)
            );

            /* 3️⃣ UI TEMİZLE */
            container.innerHTML = '';

            /* 4️⃣ SAMPLE (PLAN B) UYARISI */
            if (result.isSample) {
                container.innerHTML = `
                    <div class="alert alert-warning text-center mb-4">
                        <i class="fa-solid fa-triangle-exclamation me-2"></i>
                        Canlı API erişilemiyor, örnek veri gösteriliyor.
                    </div>
                `;
            }

            /* 5️⃣ KARTLARI OLUŞTUR */
            renderList(images);

        } catch (err) {
            console.error(err);
            showError(containerId, 'Veriler yüklenemedi.');
        }
    }

    /* =====================================================
       ARŞİV KARTLARINI OLUŞTUR
       - Card yapısı
       - Detay linki
       - Favori ekleme
    ====================================================== */
    function renderList(dataList) {
        const container = document.getElementById(containerId);

        // Lightbox ve detay için session cache
        sessionStorage.setItem(
            'nasaGalleryCache',
            JSON.stringify(dataList)
        );

        dataList.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-4';

            card.innerHTML = `
                <div class="card bg-dark border-secondary h-100 shadow">

                  
                    <a 
                        href="#"
                        class="lightbox-trigger"
                        data-image="${item.image}"
                        data-title="${item.title}"
                        data-date="${item.date}"
                        data-desc="${item.explanation || ''}"
                    >
                        <img
                            src="${item.image}"
                            class="card-img-top"
                            style="height:200px;object-fit:cover"
                            loading="lazy"
                            alt="${item.title}"
                        >
                    </a>

                    <div class="card-body d-flex flex-column">
                        <h6 class="text-warning fw-bold text-truncate">
                            ${item.title}
                        </h6>

                        <p class="text-secondary small">
                            <i class="fa-regular fa-calendar-days me-1"></i>
                            ${item.date}
                        </p>

                        
                        <div class="mt-auto d-flex gap-2">
                            <a
                                href="./detail.html?date=${item.date}"
                                class="btn btn-sm btn-outline-info flex-grow-1"
                            >
                                <i class="fa-solid fa-circle-info me-1"></i>
                                Detay
                            </a>

                            <button
                                class="btn btn-sm btn-warning fav-btn"
                                data-index="${index}"
                            >
                                <i class="fa-regular fa-star"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        /* =================================================
           FAVORİ EKLEME
        ================================================= */
        document.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                const idx = e.currentTarget.dataset.index;
                const item = dataList[idx];

                const added = await saveToFavorites({
                    id: `${item.date}-${idx}`, // benzersiz ID
                    title: item.title,
                    date: item.date,
                    image: item.image,
                    source: 'APOD_ARCHIVE'
                }, 'APOD_ARCHIVE');

                if (added) {
                    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    btn.disabled = true;
                } else {
                    alert('Bu görsel zaten favorilerde.');
                }
            });
        });
    }

    /* ================= ARŞİVİ YENİLE ================= */
    refreshBtn?.addEventListener('click', () => {
        localStorage.removeItem(ARCHIVE_CACHE_KEY);
        loadArchive(true);
    });

    // İlk yükleme
    loadArchive();
});

/* =========================================================
   LIGHTBOX
   Arşiv görselleri için modal önizleme
========================================================= */
document.addEventListener('click', e => {
    const target = e.target.closest('.lightbox-trigger');
    if (!target) return;

    e.preventDefault();

    document.getElementById('lb-image').src = target.dataset.image;
    document.getElementById('lb-title').textContent = target.dataset.title;
    document.getElementById('lb-date').textContent =
        `📅 ${target.dataset.date}`;
    document.getElementById('lb-desc').textContent =
        target.dataset.desc || 'Açıklama bulunmuyor.';

    new bootstrap.Modal(
        document.getElementById('archiveLightboxModal')
    ).show();
});
