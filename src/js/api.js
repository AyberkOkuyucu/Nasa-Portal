/* =========================================================
   API KATMANI
   Tüm NASA API çağrıları bu dosya üzerinden yönetilir
   Fetch, cache, timeout ve fallback (Plan B) mantığı içerir
========================================================= */

import { getFromCache, saveToCache } from './storage.js';

/* ================= API AYARLARI ================= */
/* ücretsiz keydir o yüzden envlemedim isteyen nasa apisine gidip kendide alabilir */
const MY_NASA_KEY = 'dsLTRqUp57ofjeULyOov2ptQbHcJg4iQNmw8QHFt';
const APOD_BASE_URL = 'https://api.nasa.gov/planetary/apod';

/* ==================================================
   GENEL FETCH + TIMEOUT + FALLBACK (PLAN B)
   - API yanıt vermezse
   - Timeout olursa
   - Network hatası oluşursa
   örnek JSON dosyası devreye girer
================================================== */
export async function fetchWithFallback(url, samplePath) {
    const controller = new AbortController();

    // 5 saniyelik timeout
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        // HTTP hata kontrolü
        if (!res.ok) throw new Error('API_ERROR');

        return {
            data: await res.json(),
            isSample: false
        };

    } catch (err) {
        clearTimeout(timeout);
        console.warn('API erişilemedi, örnek veri kullanılıyor:', err);

        // Plan B: sample JSON
        const sampleRes = await fetch(samplePath);
        return {
            data: await sampleRes.json(),
            isSample: true
        };
    }
}

/* ==================================================
   1. APOD – GÜNÜN ASTRONOMİ GÖRSELİ
   - Tarihe göre veri çeker
   - Cache öncelikli çalışır
================================================== */
export async function getDailyPhoto(date = '') {
    // Tarih seçilmemişse bugünün tarihi kullanılır
    const targetDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `apod-${targetDate}`;

    // Önce cache kontrol edilir
    const cached = await getFromCache(cacheKey);
    if (cached) {
        return {
            data: cached,
            isSample: false
        };
    }

    const url = `${APOD_BASE_URL}?api_key=${MY_NASA_KEY}&date=${targetDate}`;
    const result = await fetchWithFallback(url, './data/sample.json');

    // sample.json dizi dönerse ilk eleman alınır
    const data = Array.isArray(result.data)
        ? result.data[0]
        : result.data;

    // Gerçek API verisi ise cache’e kaydedilir
    if (!result.isSample) {
        await saveToCache(cacheKey, data);
    }

    return {
        data,
        isSample: result.isSample
    };
}

/* ==================================================
   2. APOD ARŞİV
   - Rastgele APOD görselleri çeker
   - UI için normalize edilmiş veri döner
================================================== */
export async function getApodArchive(count = 12) {
    const url = `${APOD_BASE_URL}?api_key=${MY_NASA_KEY}&count=${count}`;
    const result = await fetchWithFallback(url, './data/sample.json');

    // UI uyumlu veri yapısı
    const normalized = result.data.map(item => ({
        title: item.title,
        date: item.date,
        explanation: item.explanation,
        media_type: item.media_type,
        image: item.hdurl || item.url
    }));

    return {
        data: normalized,
        isSample: result.isSample
    };
}

/* ==================================================
   3. NASA IMAGE SEARCH (GÖRSEL KÜTÜPHANE)
   - Arama sorgusuna göre görsel çeker
   - Slider ve detay sayfası için kullanılır
================================================== */
export async function searchNasaImages(query = 'galaxy') {
    const url =
        `https://images-api.nasa.gov/search` +
        `?q=${encodeURIComponent(query)}&media_type=image`;

    const { data, isSample } = await fetchWithFallback(
        url,
        './data/sample-images.json'
    );

    const items = data.collection?.items || [];

    // Slider için sadeleştirilmiş veri
    const mapped = items.slice(0, 8).map(item => {
        const meta = item.data[0];
        const thumb = item.links?.[0]?.href || '';

        // Mümkün olan en yüksek çözünürlük seçilir
        const hdImage =
            item.links?.find(l => l.href.includes('~orig'))?.href ||
            item.links?.find(l => l.href.includes('~large'))?.href ||
            thumb;

        return {
            nasa_id: meta.nasa_id,
            title: meta.title,
            description: meta.description,
            date: meta.date_created?.split('T')[0],
            thumb,
            hdImage
        };
    });

    return {
        data: mapped,
        isSample
    };
}

/* ==================================================
   4. ASTEROID RADAR (NEO)
   - Bugün Dünya’ya yaklaşan gök cisimlerini listeler
================================================== */
export async function getAsteroidData() {
    const today = new Date().toISOString().split('T')[0];

    const url =
        `https://api.nasa.gov/neo/rest/v1/feed` +
        `?start_date=${today}&end_date=${today}&api_key=${MY_NASA_KEY}`;

    const { data } = await fetchWithFallback(
        url,
        './data/sample-asteroids.json'
    );

    return data.near_earth_objects?.[today] || [];
}

/* ==================================================
   5. SPACE WEATHER (DONKI)
   - Güneş patlamaları ve solar olaylar
================================================== */
export async function getSpaceWeather() {
    const url =
        `https://api.nasa.gov/DONKI/FLR` +
        `?api_key=${MY_NASA_KEY}&limit=10`;

    const { data } = await fetchWithFallback(
        url,
        './data/sample-weather.json'
    );

    // En güncel 5 olay
    return data.reverse().slice(0, 5);
}
