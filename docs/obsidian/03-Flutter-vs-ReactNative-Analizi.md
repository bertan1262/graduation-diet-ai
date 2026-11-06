---
title: "Flutter vs. React Native (Expo) Mimari Değerlendirmesi"
date: 2026-10-17
tags:
  - bitirme-projesi
  - diet-ai
  - mobil
  - flutter
  - react-native
author: "Bertan Beyal"
status: "tamamlandi"
---

# 📱 Flutter vs. React Native (Expo) Mimari Analizi

> Ana Dokümantasyon Merkezi: [[00-Ana-Giris]]  
> İlgili Kılavuz: [[04-Mobil-Gelistirici-Yapim-Plani-Bertan]]

Bu analiz; **1 üyenin Windows (Mac'i yok)**, **2 üyenin Mac kullandığı** ve yapay zekâ destekli diyet yönetimi uygulaması geliştiren 3 kişilik mühendislik ekibimiz için hazırlanmıştır.

---

## 1. Karşılaştırma Matrisi

| Kriter | Flutter (Dart) | React Native + Expo (TypeScript) | Kazanan (Sizin İçin) |
| :--- | :--- | :--- | :--- |
| **Windows Kullanıcısının iOS Deneyimi** | **İmkânsız:** Windows üzerinde iOS simülatörü çalışmaz, yerel iOS derlemesi yapılamaz. Her iOS testinde Mac'i olan arkadaşa bağımlısınız. | **Mükemmel:** Expo Go uygulaması sayesinde Windows'ta çalışırken eldeki iPhone'a QR kod okutarak anında canlı test yapılabilir. | 🏆 **React Native (Expo)** |
| **Öğrenme Eğrisi & Ekip Sinerjisi** | Ekibin ayrı bir programlama dili olan **Dart**'ı öğrenmesi gerekir. | Web temeli olan herkes **JavaScript / TypeScript** ile ilk günden kod yazabilir. | 🏆 **React Native** |
| **Kamera & Görsel İşleme** | `camera` ve `image_picker` paketleri olgun ve performanslıdır. | `expo-camera` ve `expo-image-picker` tek API ile hem Android hem iOS izinlerini yönetir. | **Berabere** |
| **Chatbot & Gerçek Zamanlı Streaming** | HTTP/WebSocket istemcileri mevcut. | Fetch API ve WebSocket doğrudan JS ekosisteminden gelir, token streaming çok pratiktir. | 🏆 **React Native** |

---

## 2. Kesin Sonuç: Neden React Native (Expo)?
1. **Mac Bağımlılığını Sıfırlar:** Windows kullanan mobil geliştirici (Bertan), iPhone testlerini **Expo Go** üzerinden Mac'e ihtiyaç duymadan saniyeler içinde gerçekleştirir.
2. **Kimse Dışarıda Kalmaz:** Ekipteki herkes mobil repoyu klonlayıp çalıştırabilir.
3. **Ekip Dili Tekilleşir:** Backend ve AI servislerindeki JSON modelleri, mobilde doğrudan TypeScript tipleriyle eşleşir.
