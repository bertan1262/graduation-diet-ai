---
title: "Monorepo Mimarisi ve Kurulum Rehberi"
date: 2026-10-17
tags:
  - bitirme-projesi
  - diet-ai
  - mimari
  - monorepo
  - docker
author: "Bertan Beyal"
status: "tamamlandi"
---

# 📦 Monorepo Mimarisi ve Kurulum Rehberi

> Ana Dokümantasyon Merkezi: [[00-Ana-Giris]]  
> İlgili Kılavuzlar: [[01-Ekip-Is-Birligi-ve-Git-Akisi]], [[05-Sistem-Mimarisi-ve-Veri-Akisi]]

Bu rehber, projenin tekil depo (Monorepo) yapısını, dizin ayrımını ve Docker orkestrasyonunu açıklar.

---

## 1. Neden Monorepo (Tek Depo)?
3 ayrı repo yerine tek depoda çalışmak şu avantajları sağlar:
* Tek bir GitHub Issues ve Projects panosundan tüm projenin ilerlemesi izlenebilir.
* API'de yapılan bir değişikliğin mobil ve AI karşılıkları aynı anda doğrulanabilir.
* `docker-compose.yml` ile tüm backend, veritabanı ve AI servisleri tek komutla ayağa kalkar.

---

## 2. Dizin Yapısı

```text
diet-ai-project/
├── .github/workflows/ci.yml # PR doğrulama ve testler
├── .gitignore               # Multi-stack koruma (.env, node_modules, venv)
├── README.md                # Genel proje tanıtımı ve kurulum
├── docker-compose.yml       # PostgreSQL, Backend ve AI servisi
├── docs/
│   ├── openapi.json         # Ortak API sözleşmesi
│   └── obsidian/            # 📓 Obsidian dokümantasyon kasası
├── mobile/                  # React Native + Expo (Bertan)
├── backend/                 # FastAPI + PostgreSQL (Eren)
└── ai-service/              # Python + OpenCV + Gemini API (Ali)
```

---

## 3. Docker'ın Rolü ve İstemci-Sunucu Ayrımı
* **Telefonda (iOS / Android) Asla Docker Çalışmaz:** Mobil uygulama native paket (.ipa / .apk) olarak derlenir ve doğrudan telefonun donanımında çalışır.
* **Docker Ne İşe Yarar?:** Yalnızca sunucu tarafındaki PostgreSQL veritabanını, FastAPI backend'ini ve AI mikroservisini izole ve zahmetsiz çalıştırmak için kullanılır.
* Mobil geliştirici (Bertan) bilgisayarına Docker kurmak zorunda değildir; doğrudan `cd mobile && npx expo start` ile telefonunda çalışabilir.
