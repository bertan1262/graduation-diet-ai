---
title: "DietAI Proje Dokümantasyon Merkezi (MOC)"
date: 2026-10-17
tags:
  - bitirme-projesi
  - diet-ai
  - moc
  - mimari
author: "Bertan Beyal"
status: "aktif"
---

# 🥗 DietAI — Proje Dokümantasyon ve Not Merkezi (MOC)

Bu klasör, **DietAI Yapay Zekâ Destekli Diyet ve Beslenme Yönetimi** bitirme projesine ait tüm teknik analizleri, mimari kararları, iş birliği kılavuzlarını ve geliştirme planlarını içeren ana **Obsidian Kasası (Vault)** merkezidir.

---

## 📑 İndeks ve Dokümantasyon Haritası

### 1. Ekip Organizasyonu & Git İş Akışı
* [[01-Ekip-Is-Birligi-ve-Git-Akisi]]: 3 kişilik ekip için rol dağılımı (Bertan, Eren, Ali), dal isimlendirme formatları (`feat/...`), Conventional Commits ve Pull Request (PR) inceleme kuralları.
* [[02-Monorepo-Kurulum-Rehberi]]: Projenin tekil depo (Monorepo) mimarisi, `.gitignore` kuralları, Docker Compose orkestrasyonu ve alt modül bağımsızlığı.

### 2. Mimari Kararlar ve Teknoloji Analizleri
* [[03-Flutter-vs-ReactNative-Analizi]]: Ekip donanım kısıtlarına (1 Windows, 2 Mac) göre Flutter ile React Native (Expo) karşılaştırması ve sıfır-Mac iOS test stratejisi (Expo Go).
* [[05-Sistem-Mimarisi-ve-Veri-Akisi]]: İstemci-Sunucu mimarisi, mobil-backend-AI arasındaki uçtan uca Mermaid sequence veri akışı ve etik güvenlik sınırları (guardrails).

### 3. Mobil Geliştirme (Bertan Beyal)
* [[04-Mobil-Gelistirici-Yapim-Plani-Bertan]]: Bertan için A'dan Z'ye hazırlanmış 5 aşamalı sprint planı, ekran akışları, `expo-camera` entegrasyonu, porsiyon düzeltme modalı ve Zustand durum yönetimi.
* [[06-Mobil-Gun-Gun-Calisma-Programi]]: Günde 2-3 saatlik çalışma ile 16 günde mobil uygulamayı mock veriyle eksiksiz bitirme takvimi.

---

## 👥 Ekip Kadrosu ve Dizin Sorumlulukları
* **Bertan Beyal:** Mobil & Ön Yüz (Frontend) Mühendisi -> `/mobile`
* **Eren Torman:** Arka Yüz (Backend) & Veritabanı Mühendisi -> `/backend`
* **Ali Eren Özer:** Yapay Zekâ (AI / CV & LLM) Mühendisi -> `/ai-service`

---

## 🔗 Hızlı Bağlantılar ve Dış Kaynaklar
* 🌐 **GitHub Deposu:** [github.com/bertan1262/graduation-diet-ai](https://github.com/bertan1262/graduation-diet-ai)
* 📋 **API Sözleşmesi:** `docs/openapi.json`
* 🛠️ **Yerel Çalıştırma Kılavuzu:** `README.md`
