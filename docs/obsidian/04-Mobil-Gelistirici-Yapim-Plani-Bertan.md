---
title: "Mobil İstemci Kapsamlı Yapım Planı (Bertan Beyal)"
date: 2026-10-17
tags:
  - bitirme-projesi
  - diet-ai
  - mobil
  - react-native
  - plan
author: "Bertan Beyal"
status: "aktif"
---

# 🚀 Mobil İstemci Kapsamlı Yapım Planı

> Ana Dokümantasyon Merkezi: [[00-Ana-Giris]]  
> İlgili Kılavuzlar: [[03-Flutter-vs-ReactNative-Analizi]], [[05-Sistem-Mimarisi-ve-Veri-Akisi]]

Bu plan, **Bertan Beyal** tarafından geliştirilecek olan React Native (Expo) mobil uygulamasının ekran mimarisini, kamera entegrasyonunu, porsiyon düzeltme mekanizmasını ve sprint takvimini içerir.

---

## 1. Kodlanacak Ana Ekranlar ve Kullanıcı Akışı

```text
[1. Onboarding / Profil Ekranı]
   └── Boy, kilo, yaş, cinsiyet ve hedef (Kilo verme, koruma, kas kazanımı)
   └── Mifflin-St Jeor formülüyle anlık BMR ve Hedef Kalori hesaplama
         ↓
[2. Günlük Beslenme Paneli (Dashboard)]
   ├── 🟢 Büyük Kalori İlerleme Halkası (Alınan / Kalan Kalori)
   ├── 📊 Makro Çubukları (Protein, Karbonhidrat, Yağ hedefleri)
   ├── 🍽️ Öğün Kartları (Kahvaltı, Öğle, Akşam)
   └── 💧 Hızlı Su Takip Sayacı (+250ml butonu)
         ↓
[3. Akıllı Kamera & Yemek Tarayıcı (Scanner)]
   ├── 📷 Tam ekran expo-camera önizlemesi (Flaş, kamera çevirme, deklanşör)
   ├── 🖼️ Galeriden fotoğraf seçme butonu (expo-image-picker)
   └── ⚡ Lazer tarama animasyonu ("Yemek analiz ediliyor...")
         ↓
[4. Porsiyon İnceleme & Düzeltme Modalı (Bottom Sheet) - Jüri İçin Kritik!]
   ├── Tespit edilen yemekler (Örn: "Izgara Tavuk - %94 Güven")
   ├── 🎚️ Gramaj Kaydırıcısı (Slider): Kullanıcı "180g" yerine kaydırarak "120g" yapabilir, kaloriler anında güncellenir.
   └── 💾 "Öğünümü Günlüğüme Ekle" butonu -> Dashboard makroları canlı güncellenir.
         ↓
[5. AI Diyetisyen Sohbet Ekranı (Chat)]
   ├── 🛡️ Kalıcı Güvenlik Bandı: "DietAI tıbbi tanı koymaz ve reçete veremez."
   ├── 💬 Konuşma balonları (Kullanıcı & Bot)
   └── 💡 Hızlı Soru Hapları (Chips): "Proteinimi nasıl tamamlarım?", "Düşük kalorili tatlı önerisi"
```

---

## 2. 5 Aşamalı Sprint Takvimi

| Sprint | Süre | Yapılacak İşler | Çıktı Dosyaları |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | 1-3. Gün | Alt menü sekmeleri (Tabs), renk paleti ve Zustand global veri deposu (`useDietStore`). | `src/constants/colors.ts`, `src/store/useDietStore.ts`, `App.tsx` |
| **Sprint 2** | 4-6. Gün | BMR hesaplama formu (`OnboardingScreen`), Günlük Kalori Halkası ve Makro Çubukları. | `src/screens/DashboardScreen.tsx`, `src/screens/OnboardingScreen.tsx` |
| **Sprint 3** | 7-10. Gün | `expo-camera` tam ekran vizörü, flaş/çevirme kontrolleri ve galeriden resim seçici. | `src/screens/CameraScreen.tsx`, `src/components/camera/*` |
| **Sprint 4** | 11-13. Gün | Alttan açılan Porsiyon Düzeltme Modalı, gramaj slider'ı ve günlüğe kaydetme mantığı. | `src/components/nutrition/FoodAnalysisModal.tsx` |
| **Sprint 5** | 14-16. Gün | Diyetisyen sohbet ekranı, tıbbi sorumluluk reddi bandı ve canlı backend bağlantı hazırlığı. | `src/screens/ChatScreen.tsx`, `src/services/api.ts` |
