import { db } from './storage.js'; // Veritabanını çağırdık

// Helper fonksiyonu en tepeye koyduk ki hata vermesin
function generateDescription(title) {
  return `${title} görseli için detaylı bir açıklama bulunmuyor. Ancak NASA arşivlerindeki bu eşsiz kare, evrenin derinliklerine dair ipuçları taşıyor.`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('detail-container');

  // URL Parametrelerini al
  const params = new URLSearchParams(window.location.search);
  const searchIndexId = params.get('id');    // Arama sonucu indeksi
  const favId = params.get('favId');         // Favori ID'si

  let data = null;

  try {
    // 1️⃣ SENARYO: Favorilerden geldiyse Veritabanından çek
    if (favId) {
      const id = parseInt(favId);
      data = await db.favorites.get(id);

      // Veritabanı verisini uyumlu hale getir (field mapping)
      if (data) {
        // Veritabanında 'image' diye saklıyoruz, burada 'hdImage' bekleniyor olabilir
        data.hdImage = data.image;
        // Veritabanında 'explanation' diye saklıyoruz, burada 'description' bekleniyor
        data.description = data.explanation;
      }
    }
    // 2️⃣ SENARYO: Aramadan geldiyse Cache'den çek
    else if (searchIndexId !== null) {
      const cache = sessionStorage.getItem('nasaGalleryCache');
      if (cache) {
        const items = JSON.parse(cache);
        data = items[searchIndexId];
      }
    }

    // Veri yoksa hata göster
    if (!data) {
      container.innerHTML = `
          <div class="alert alert-warning text-center mt-5">
            <h4>İçerik Bulunamadı</h4>
            <p>Aradığınız görsel bellekte veya favorilerde bulunamadı.</p>
            <a href="./index.html" class="btn btn-outline-warning mt-2">Ana Sayfaya Dön</a>
          </div>`;
      return;
    }

    // --- İÇERİĞİ OLUŞTUR ---

    // Açıklama var mı kontrol et
    // Not: Veritabanında 'explanation', API'de 'description' gelebilir. İkisini de kontrol edelim.
    const rawDesc = data.description || data.explanation || '';
    const hasOfficialDescription = rawDesc.trim().length > 0;

    const descriptionText = hasOfficialDescription
      ? rawDesc
      : generateDescription(data.title);

    const warningHtml = !hasOfficialDescription
      ? `<p class="text-warning small mb-2">⚠️ NASA bu görsel için resmi bir açıklama paylaşmamıştır.</p>`
      : '';

    container.innerHTML = `
        <div class="row g-4 fade-in">
          <div class="col-lg-7">
            <img 
              src="${data.hdImage || data.thumb}"
              class="img-fluid rounded-4 shadow-lg border border-secondary"
              alt="${data.title}"
              loading="lazy"
            />
          </div>

          <div class="col-lg-5 d-flex flex-column">
            <div class="p-4 bg-secondary bg-opacity-10 rounded-4 border border-secondary h-100 shadow">

              <span class="badge bg-warning text-dark mb-3 px-3 py-2 fs-6">
                📅 ${data.date || 'Tarih yok'}
              </span>

              <h1 class="text-warning h2 fw-bold mb-3">
                ${data.title}
              </h1>

              ${warningHtml}

              <p class="lead opacity-75 mb-4" style="line-height:1.8">
                ${descriptionText}
              </p>

              <div class="mt-auto">
                <button onclick="history.back()" class="btn btn-outline-warning w-100 fw-bold">
                  ⬅ Geri Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="alert alert-danger">Bir hata oluştu.</div>`;
  }
});
