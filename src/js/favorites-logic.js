/* =========================================================
   FAVORITES-LOGIC.JS
   Favoriler sayfasının tüm iş mantığını yönetir.
   - IndexedDB'den favorileri çeker
   - Listeyi dinamik olarak oluşturur
   - Detay yönlendirmelerini ayırt eder
   - Silme ve lightbox işlemlerini yönetir
========================================================= */

import { getAllFavorites, db } from './storage.js';

/* =========================================================
   SAYFA YÜKLENDİĞİNDE
========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('favorites-list');

    // IndexedDB'den tüm favorileri al
    const favorites = await getAllFavorites();

    /* ================= BOŞ DURUM ================= */
    if (favorites.length === 0) {
        listContainer.innerHTML = `
            <div class="col-12 text-center mt-5 content-wrapper">
                <p class="lead opacity-50">
                    Henüz favori eklenmemiş.
                </p>
            </div>
        `;
        return;
    }

    /* =====================================================
       1️⃣ FAVORİ LİSTESİNİ OLUŞTUR
       - Kaynağa göre detay linki belirlenir
    ====================================================== */
    listContainer.innerHTML = favorites.map(item => {

        let detailBtnHtml = '';

        // NASA Library verileri ayrı detay sayfasına gider
        if (item.source === 'NASA_LIBRARY') {
            detailBtnHtml = `
                <a
                    href="library-detail.html?favId=${item.id}"
                    class="btn btn-sm btn-outline-info"
                >
                    Detay
                </a>
            `;
        } else {
            // APOD verileri tarih parametresiyle detail.html'e gider
            detailBtnHtml = `
                <a
                    href="detail.html?date=${item.date}"
                    class="btn btn-sm btn-outline-info"
                >
                    Detay
                </a>
            `;
        }

        return `
            <div class="col-md-6 col-lg-4 card-item">
                <div class="card bg-dark border-secondary h-100 shadow fade-in">

                   
                    <a
                        href="#"
                        class="lightbox-trigger"
                        title="${item.title}"
                        data-image="${item.image}"
                        data-title="${item.title}"
                        data-date="${item.date}"
                        data-desc="${item.explanation || ''}"
                    >
                        <img
                            src="${item.image}"
                            loading="lazy"
                            class="card-img-top"
                            alt="${item.title}"
                            style="height:200px;object-fit:cover;"
                        >
                    </a>

                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title text-warning h6 text-truncate">
                            ${item.title}
                        </h5>

                        <div
                            class="mt-auto d-flex justify-content-between align-items-center
                                   border-top pt-2 border-secondary"
                        >
                            <div class="btn-group">
                                ${detailBtnHtml}

                                <button
                                    class="btn btn-sm btn-outline-danger delete-btn"
                                    data-id="${item.id}"
                                >
                                    Sil
                                </button>
                            </div>

                            <small class="text-secondary small">
                                ${item.date}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    /* =====================================================
       2️⃣ FAVORİ SİLME
       - Animasyonlu kaldırma
       - IndexedDB güncelleme
    ====================================================== */
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const id = parseInt(e.target.dataset.id);
            const cardElement = btn.closest('.card-item');

            // Küçük animasyon
            cardElement.style.transition = 'all 0.4s ease';
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.8)';

            setTimeout(async () => {
                await db.favorites.delete(id);
                cardElement.remove();

                // Liste boş kaldıysa mesaj göster
                if (document.querySelectorAll('.card-item').length === 0) {
                    listContainer.innerHTML = `
                        <div class="col-12 text-center mt-5">
                            <p class="lead opacity-50">
                                Henüz favori eklenmemiş.
                            </p>
                        </div>
                    `;
                }
            }, 400);
        };
    });

    /* =====================================================
       3️⃣ SCROLL ANİMASYONU
       IntersectionObserver kullanımı
    ====================================================== */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
            }
        });
    }, { threshold: 0.1 });

    document
        .querySelectorAll('.fade-in')
        .forEach(card => observer.observe(card));
});

/* =========================================================
   LIGHTBOX
   Favori görseller için modal önizleme
========================================================= */
document.addEventListener('click', e => {
    const target = e.target.closest('.lightbox-trigger');
    if (!target) return;

    e.preventDefault();

    const modalEl = document.getElementById('favoritesLightboxModal');
    if (!modalEl) return;

    // Modal içerikleri
    document.getElementById('fav-lb-image').src = target.dataset.image;
    document.getElementById('fav-lb-title').textContent = target.dataset.title;
    document.getElementById('fav-lb-date').textContent =
        `📅 ${target.dataset.date}`;
    document.getElementById('fav-lb-desc').textContent =
        (target.dataset.desc && target.dataset.desc !== 'undefined')
            ? target.dataset.desc
            : '';

    new bootstrap.Modal(modalEl).show();
});
