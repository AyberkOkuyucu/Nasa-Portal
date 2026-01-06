/* =========================================================
   DETAIL-LOGIC.JS
   APOD detay sayfasının iş mantığını yönetir.
   - URL parametresinden tarih bilgisini alır
   - İlgili APOD verisini API'den çeker
   - Fallback (sample veri) durumunu ele alır
========================================================= */

import { getDailyPhoto } from './api.js';
import { showLoader, showError } from './ui.js';

/* =========================================================
   SAYFA YÜKLENDİĞİNDE
========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    const containerId = 'detail-container';

    // URL parametresi (detail.html?date=YYYY-MM-DD)
    const params = new URLSearchParams(window.location.search);
    const date = params.get('date');

    // Parametre yoksa hata göster
    if (!date) {
        showError('Geçerli tarih bulunamadı.', containerId);
        return;
    }

    showLoader(containerId);

    try {
        const { data, isSample } = await getDailyPhoto(date);

        if (!data) {
            showError('İçerik bulunamadı.', containerId);
            return;
        }

        renderDetail(data);

        /* ================= SAMPLE (PLAN B) UYARISI ================= */
        if (isSample) {
            document.getElementById(containerId).insertAdjacentHTML(
                'afterbegin',
                `
                <div class="alert alert-warning text-center mb-3">
                    Canlı API erişilemiyor, örnek veri gösteriliyor.
                </div>
                `
            );
        }

    } catch (err) {
        console.error(err);
        showError('Veri yüklenemedi.', containerId);
    }
});

/* =========================================================
   DETAY İÇERİĞİNİ OLUŞTUR
   - Görsel veya video kontrolü
   - Metin bilgileri
========================================================= */
function renderDetail(data) {
    const container = document.getElementById('detail-container');

    container.innerHTML = `
        <div class="row g-4">

            
            <div class="col-lg-7">
                ${data.media_type === 'video'
            ? `<iframe
                                class="w-100 rounded-4"
                                height="420"
                                src="${data.url}"
                                allowfullscreen>
                           </iframe>`
            : `<img
                                src="${data.hdurl || data.url}"
                                class="img-fluid rounded-4 shadow"
                                alt="${data.title}">
                          `
        }
            </div>

           
            <div class="col-lg-5">
                <span class="badge bg-warning text-dark mb-3">
                    ${data.date}
                </span>

                <h2 class="text-warning">${data.title}</h2>

                <p class="opacity-75">
                    ${data.explanation}
                </p>

                <button
                    onclick="history.back()"
                    class="btn btn-outline-warning w-100"
                >
                    ⬅ Geri Dön
                </button>
            </div>

        </div>
    `;
}
