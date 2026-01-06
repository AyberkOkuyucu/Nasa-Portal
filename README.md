# NASA Uzay Portalı – Progressive Web App

Bu proje, Web Tabanlı Mobil Uygulama Geliştirme dersi kapsamında geliştirilmiş, Progressive Web App (PWA) standartlarına uygun, çok sayfalı ve mobil uyumlu bir web uygulamasıdır.

Uygulama, NASA tarafından sunulan açık veri servislerini kullanarak uzay ve astronomi ile ilgili güncel içerikleri kullanıcıya sunmayı amaçlar. Proje, örnek/demo değil; gerçek bir kurumsal web sitesi senaryosu düşünülerek tasarlanmıştır.

---

## Canlı Demo ve Tanıtım Videosu

Canlı Demo:  
[https://ayberkokuyucu.github.io/Nasa-Portal/]

Tanıtım Videosu:  
[https://www.youtube.com/watch?v=aabGIMuP8Ig]

---

## Projenin Amacı

Bu projenin amacı, kullanıcıya NASA verileri üzerinden:

- Günlük astronomi görsellerini (APOD)
- Asteroit geçiş bilgilerini
- Uzay hava durumu (solar aktiviteler)
- NASA görsel arşivini

sunabilen; internet bağlantısı olmadığında bile temel işlevlerini sürdürebilen, kurulabilir bir web uygulaması geliştirmektir.

---

## Kullanılan Teknolojiler

- HTML5
- CSS3
- JavaScript (ES6+, modüler yapı)
- Bootstrap 5.3 (grid sistemi ve UI bileşenleri)

### Kullanılan API

NASA Open APIs  
https://api.nasa.gov/

Kullanılan servisler:

- Astronomy Picture of the Day (APOD)
- Near Earth Object Web Service (NeoWs)
- DONKI (Space Weather)
- NASA Image and Video Library

---

## Sayfa Yapısı (Multi-Page)

Uygulama çok sayfalı olacak şekilde tasarlanmıştır:

- index.html  
  Ana sayfa, öne çıkan veriler ve kullanıcı etkileşimleri

- archive.html  
  APOD arşiv listeleme ve filtreleme

- detail.html  
  Seçilen içeriğin detay sayfası (URL parametresi ile)

- library-detail.html  
  NASA görsel arşivi için detay sayfası

- favorites.html  
  Kullanıcının favori olarak kaydettiği içerikler

- about.html  
  Kurumsal tanıtım, teknik bilgiler ve PWA açıklaması

- contact.html  
  Form doğrulamalı iletişim sayfası

- offline.html  
  İnternet bağlantısı olmadığında gösterilen özel sayfa

---

## PWA Özellikleri

Uygulama Progressive Web App standartlarına uygun olarak geliştirilmiştir.

### Manifest

- Uygulama adı ve kısa adı tanımlanmıştır
- Tema rengi ve ikonlar eklenmiştir
- Uygulama tarayıcı üzerinden kurulabilir durumdadır

### Service Worker

- HTML, CSS, JavaScript ve statik dosyalar önbelleğe alınır
- Offline senaryosunda özel bir offline.html sayfası gösterilir
- API istekleri için network-first stratejisi kullanılmıştır

### Offline ve Plan B Mekanizması

NASA API servisleri erişilemediğinde uygulama tamamen boş kalmaz.

- Örnek veriler `/data` klasöründeki JSON dosyalarından yüklenir
- Kullanıcıya canlı API erişilemediğine dair bilgilendirme mesajı gösterilir
- Daha önce ziyaret edilen sayfalar cache üzerinden çalışmaya devam eder

---

## Veri Yönetimi

- API çağrıları fetch() ile yapılmaktadır
- Yükleniyor, hata ve boş veri durumları arayüzde ele alınmıştır
- Favori verileri IndexedDB (Dexie.js) kullanılarak saklanmaktadır
- Oturum bazlı veriler için localStorage ve sessionStorage kullanılmıştır

---

## Kurulum ve Çalıştırma

1. Proje dosyaları bilgisayara indirilir
2. Bir yerel sunucu (Live Server vb.) ile çalıştırılır
3. Tarayıcı üzerinden uygulama kurulabilir
4. İnternet bağlantısı kesilerek offline senaryo test edilebilir

---

## Not

Bu proje bireysel olarak geliştirilmiştir ve eğitim amacı taşımaktadır.
