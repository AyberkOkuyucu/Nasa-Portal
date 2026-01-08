/* =========================================================
   STORAGE.JS
   IndexedDB (Dexie.js) kullanılarak:
   - Favoriler
   - API cache verileri
   yönetilir.
========================================================= */

import Dexie from 'https://unpkg.com/dexie/dist/dexie.mjs';

/* =========================================================
   VERİTABANI TANIMI
========================================================= */
export const db = new Dexie('NasaPwaDB');

/*
  favorites:
  - id: otomatik artan
  - date: içerik tarihi
  - title: başlık
  - image: görsel URL
  - source: verinin geldiği kaynak

  cache:
  - date: APOD cache anahtarı
*/
db.version(3).stores({
    favorites: '++id, date, title, image, source',
    cache: 'date'
});

/* =========================================================
   FAVORİ KAYDET
   - Gelen veriyi normalize eder
   - Aynı tarihli veri varsa tekrar eklemez
========================================================= */
export async function saveToFavorites(item, source) {
    const normalized = normalizeFavorite(item, source);
    if (!normalized) return false;

    // Aynı tarihli içerik daha önce eklenmiş mi?
let exists;

if (normalized.source === 'NASA_LIBRARY') {
    exists = await db.favorites
        .where('image')
        .equals(normalized.image)
        .count();
} else {
    exists = await db.favorites
        .where('date')
        .equals(normalized.date)
        .count();
}


    if (exists) return false;

    await db.favorites.add(normalized);
    return true;
}

/* =========================================================
   TÜM FAVORİLERİ GETİR
========================================================= */
export async function getAllFavorites() {
    return db.favorites.toArray();
}

/* =========================================================
   API CACHE KAYDET (APOD)
========================================================= */
export async function saveToCache(key, data) {
    if (!key || !data) return;

    await db.cache.put({
        date: key,
        data
    });
}

/* =========================================================
   API CACHE OKU (APOD)
========================================================= */
export async function getFromCache(key) {
    const cached = await db.cache.get(key);
    return cached ? cached.data : null;
}


/* =========================================================
   FAVORİ NORMALİZASYONU
   Farklı API kaynaklarını tek yapıya dönüştürür
========================================================= */
export function normalizeFavorite(item, source) {

    // APOD verisi
    if (source === 'APOD') {
        return {
            title: item.title,
            date: item.date,
            image: item.hdurl || item.url,
            source: 'APOD'
        };
    }

    // NASA Image Library verisi
    if (source === 'NASA_LIBRARY') {
        return {
            title: item.title,
            date: item.date || '—',
            image: item.hdImage || item.thumb || '',
            source: 'NASA_LIBRARY'
        };
    }

    return null;
}
