---
title: "Bertan Beyal — Mobil Geliştirme Gün Gün Çalışma Takvimi (16 Günlük Program)"
date: 2026-10-17
tags:
  - bitirme-projesi
  - diet-ai
  - mobil
  - takvim
  - sprint
author: "Bertan Beyal"
status: "aktif"
---

# 📅 Bertan Beyal — Mobil Geliştirme Gün Gün Çalışma Programı (16 Gün)

> Ana Dokümantasyon Merkezi: [[00-Ana-Giris]]  
> İlgili Kılavuz: [[04-Mobil-Gelistirici-Yapim-Plani-Bertan]]

Bu program; **Bertan Beyal**'in günde ortalama **2-3 saat** ayırarak, backend ve yapay zekâ ekiplerini beklemeden sahte veri (mock-data) yaklaşımıyla React Native (Expo) mobil istemcisini sıfırdan bitirmesi için hazırlanmıştır.

---

## 📌 Genel İlkeler ve Çalışma Düzeni
* **Bağımsızlık:** `EXPO_PUBLIC_USE_MOCK_DATA=true` ayarı sayesinde Eren (backend) ve Ali (AI) kendi işlerini yaparken siz projenizi telefonunuzda her gün canlı çalıştırıp görebileceksiniz.
* **Canlı Test:** Her günün sonunda `npx expo start` diyerek telefonunuzdaki **Expo Go** üzerinden o gün yazdığınız özellikleri gerçek ekranda test edin.
* **Küçük ve Temiz Adımlar:** Her gün yalnızca o günün dosyalarına odaklanın.

---

## 🗺️ 16 Günlük Sprint Özeti

```text
[Hafta 1: Gün 1-5]   Temeller, Navigasyon, Global State ve Günlük Dashboard
[Hafta 2: Gün 6-10]  BMR Karşılama Ekranı ve Tam Ekran Akıllı Kamera Vizörü
[Hafta 3: Gün 11-15] Porsiyon İnceleme Modalı (Slider) ve AI Sohbet Ekranı
[Hafta 4: Gün 16]    Çapraz Platform Testleri (iOS/Android) ve Backend Entegrasyon Hazırlığı
```

---

## 📆 1. Hafta: Temel Altyapı, Durum Yönetimi ve Dashboard

### ✅ Gün 1: Renk Paleti, Tipografi ve Gezinme (Navigation) İskeleti (Tamamlandı)
* **Hedef:** Alt menü sekmelerini (Bottom Tabs) ve tasarım sistemini oturtmak.
* **Yapılanlar:**
  * `src/constants/colors.ts`, `src/constants/theme.ts`, `src/components/common/Header.tsx`, `src/components/common/TabBar.tsx` oluşturuldu.
  * `App.tsx` içerisindeki alt menü sekmeleri yapılandırıldı (Dashboard, Kamera, Sohbet, Profil).
* **Doğrulama:** Expo Go üzerinde sekmeler arası geçiş ve SafeArea/StatusBar tam uyumlu çalışıyor.

### ✅ Gün 2: Global Durum Yönetimi (Zustand) ve Sahte Veri Katmanı (Tamamlandı)
* **Hedef:** Kullanıcı verilerini ve günlük yemek listesini hafızada tutacak yapıyı kurmak.
* **Yapılanlar:**
  * `src/store/useDietStore.ts` oluşturuldu (`userProfile`, `todayMeals`, `waterIntakeMl`, `addMeal`, `removeMeal`, `addWater`, `getDailySummary`).
  * `src/constants/mockData.ts` içerisine başlangıç verileri ve domain modelleri eklendi.
* **Doğrulama:** Reaktif Zustand store hesaplamaları test edildi, tüm CRUD eylemleri doğrulandı.

### ✅ Gün 3: Dashboard — Kalori İlerleme Halkası (CalorieRing) (Tamamlandı)
* **Hedef:** Dairesel SVG kalori göstergesini kodlamak.
* **Yapılanlar:**
  * `react-native-svg` entegre edildi.
  * `src/components/dashboard/CalorieRing.tsx` bileşeni yazıldı.
* **Doğrulama:** Alınan/kalan kalori dairesel halkada dinamik renk ve yüzde ile doğrulandı.

### ✅ Gün 4: Dashboard — Makro Çubukları (MacroBar) ve Su Sayacı (WaterTracker) (Tamamlandı)
* **Hedef:** Protein, Karbonhidrat ve Yağ göstergeleri ile su takip sayacını eklemek.
* **Yapılanlar:**
  * `src/components/dashboard/MacroBar.tsx` (Protein mavi, Karb sarı, Yağ pembe yatay progress barları ve aşım indikatörleri) kodlandı.
  * `src/components/dashboard/WaterTracker.tsx` (+250ml bardak, +500ml şişe ve geri alma aksiyonları) yazıldı.
  * `DashboardScreen.tsx` ekranına monte edildi.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi, Zustand store reaktivitesi bağlandı.

### ✅ Gün 5: Dashboard — Öğün Listesi (MealItemCard & MealSection) (Tamamlandı)
* **Hedef:** Gün içinde yenen yemekleri 4 ana kategoride (Kahvaltı, Öğle, Akşam, Ara Öğün) listelemek ve hızlı ekleme/silme aksiyonlarını sunmak.
* **Yapılanlar:**
  * `src/components/dashboard/MealItemCard.tsx` (Yemek adı, porsiyon, eklenme saati, P/K/Y makro hapları, kalori etiketi, silme butonu) kodlandı.
  * `src/components/dashboard/MealSection.tsx` (Öğün kategorisi başlığı, ara toplam kalorisi, hızlı `+ Ekle` butonu ve boş durum yer tutucusu) oluşturuldu.
  * `DashboardScreen.tsx` ekranına monte edilip `useDietStore` fonksiyonlarına bağlandı.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; 1. Hafta (Gün 1-5) tam teşekküllü canlı Dashboard ile başarıyla tamamlandı.

---

## 📆 2. Hafta: BMR Profil Ekranı ve Akıllı Kamera Alt Sistemi

### ✅ Gün 6: Karşılama ve BMR Hesaplama Formu (OnboardingScreen) (Tamamlandı)
* **Hedef:** Kullanıcının boy, kilo, yaş, cinsiyet, aktivite seviyesi ve hedefini girdiği bilimsel BMR hesaplama formunu hazırlamak.
* **Yapılanlar:**
  * `src/screens/OnboardingScreen.tsx` (Mifflin-St Jeor formülleri, BMR, TDEE, Hedef Kalori, Makro hedefleri, günlük su ihtiyacı ve anlık canlı hesaplama önizleme kartı) oluşturuldu.
  * `src/screens/ProfileScreen.tsx` ekranına entegre edildi; aktif hedefleri görüntüleme ve "Hedefleri & BMR'ı Yeniden Hesapla" aksiyonuyla düzenleme modu bağlandı.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; form doldurulup kaydedildiğinde Zustand store (`useDietStore`) ve Dashboard hedefleri canlı güncellendi.

### ✅ Gün 7: Kamera İzin Yönetimi ve Boş Durum Ekranı (Tamamlandı)
* **Hedef:** `expo-camera` izinlerini profesyonelce ele almak ve tam ekran vizörü başlatmak.
* **Yapılanlar:**
  * `src/screens/CameraScreen.tsx` ekranı `useCameraPermissions` ve `CameraView` ile yapılandırıldı.
  * İzin verilmediğinde: 3 maddelik yapay zekâ avantajları, bilgilendirici kart ve "Kameraya İzin Ver" (`requestPermission()`) akışı sağlandı.
  * İzin verildiğinde: Tam ekran vizör, üst yönlendirici hap, köşe retikül çizgileri ve ön/arka kamera çevirme kontrolleri bağlandı.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; Expo Go üzerinde kamera akışı test edildi.

### ✅ Gün 8: Kamera Kontrolleri (Deklanşör, Flaş, Ön/Arka Çevirme) (Tamamlandı)
* **Hedef:** Kameranın fiziksel kontrollerini ve vizör kılavuzunu eklemek.
* **Yapılanlar:**
  * `src/components/camera/CaptureButton.tsx` (Çift halkalı, dokunma geri bildirimli ve yükleme indikatörlü modern deklanşör) geliştirildi.
  * `CameraScreen.tsx` ekranına flaş döngüsü (`off`, `on`, `auto`), ön/arka kamera çevirme (`front`/`back`), galeri kısayolu ve 270x270 zümrüt köşebentli retikül monte edildi.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; vizör HUD kontrolleri Expo Go üzerinde test edildi.

### ✅ Gün 9: Fotoğraf Çekimi ve Görsel Sıkıştırma (Tamamlandı)
* **Hedef:** Fotoğrafı çekip performansı bozmayacak boyuta getirmek ve galeri entegrasyonu sağlamak.
* **Yapılanlar:**
  * `cameraRef.current.takePictureAsync({ quality: 0.8, base64: true })` entegre edildi.
  * `expo-image-picker` (`launchImageLibraryAsync`) ile cihaz galerisinden yemek fotoğrafı seçme desteği bağlandı.
  * Fotoğraf çekildiğinde veya galeriden seçildiğinde açılan tam ekran önizleme ve onay katmanı ("Tekrar Çek" / "Yemeği Analiz Et") oluşturuldu.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; Expo Go üzerinde hem kameradan çekim hem de galeriden görsel aktarımı doğrulandı.

### ✅ Gün 10: Lazer Tarama Animasyonu (ScanningOverlay) & Anında Tarama Akışı (Tamamlandı)
* **Hedef:** Fotoğraf çekildikten veya galeriden seçildikten hemen sonra yapay zekâ analiz ederken kullanıcıyı büyüleyecek kesintisiz bir fütüristik lazer tarama ekranı sunmak.
* **Yapılanlar:**
  * `src/components/camera/ScanningOverlay.tsx` (Yerel Animated motoruyla 60 FPS süzülen zümrüt yeşili lazer tarama çizgisi, parlama efekti, 4 aşamalı dinamik analiz rozeti ve iptal butonu) geliştirildi.
  * **Anında Akış Entegrasyonu:** Aradaki manuel onay ekranı kaldırılarak deklanşöre basıldığı veya galeriden görsel seçildiği milisaniyede lazer tarama ekranının donan görsel üzerinde doğrudan devreye girmesi sağlandı.
  * **Performans & Kararlılık Optimizasyonu:** `takePictureAsync` ve galerideki bellek canavarı `base64: true` kaldırılarak saf URI formatına geçildi; iOS Expo Go üzerindeki gecikme ve kilitlenmeler sıfırlandı.
  * **Fail-Safe Güvencesi:** Donanım veya simülatör kamerasından görsel alınamadığı durumlarda dahi akışın asla kesintiye uğramaması için otomatik yüksek çözünürlüklü yedek görsel fallback'i eklendi.
  * **Okunabilirlik & Pacing:** 4 aşamanın (Görsel optimizasyonu -> Yemek tespiti -> Porsiyon/makro hesabı -> %100 Analiz tamamlandı) her biri 900-1000ms aralıklarla pürüzsüzce gösterilecek şekilde zamanlandı.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; Expo Go üzerinde deklanşöre tıklandığı an lazer animasyonunun ve 4 aşamalı AI akışının çalıştığı doğrulandı. 2. Hafta başarıyla tamamlandı.

---

## 📆 3. Hafta: Porsiyon İnceleme Modalı ve Diyetisyen Sohbeti

### ✅ Gün 11: Porsiyon İnceleme Modalı (FoodAnalysisModal) — Kart Tasarımı (Tamamlandı)
* **Hedef:** Yapay zekâdan dönen yemekleri alttan açılan şık bir modal (Bottom Sheet) içinde göstermek.
* **Yapılanlar:**
  * `src/components/nutrition/FoodAnalysisModal.tsx` bileşeni geliştirildi (alttan kayarak açılan drag tutamaçlı Bottom Sheet, çekilen görselin zümrüt çerçeveli küçük thumbnail önizlemesi, "Izgara Tavuk Göğsü & Kinoa Salatası" ana kartı, %94 AI güvenilirlik rozeti, 385 kcal alevli kalori kartı, protein/karb/yağ makro dağılım çubukları, öğün seçici çipler ve diyetisyen tavsiye notu).
  * `src/constants/mockData.ts` içerisine `MOCK_DETECTED_MEAL` nesnesi tanımlandı.
  * `CameraScreen.tsx` ekranına entegre edildi: Lazer taraması bittiğinde geçici Alert yerine doğrudan bu şık modal açılıyor; "Porsiyonu Düzenle & Kaydet" butonuna basıldığında yemek doğrudan Zustand store'a (`addMeal`) ekleniyor.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; Expo Go üzerinde lazer tarama bitiminde alttan açılan çekmece modalı ve günlüğe kayıt akışı başarıyla doğrulandı.

### ✅ Gün 12: Porsiyon Kaydırıcısı (PortionSlider) ile Dinamik Kalori Hesabı (Tamamlandı)
* **Hedef:** Kullanıcının gramajı elle değiştirebilmesi ve kalori/makroların anlık formülle yeniden hesaplanması.
* **Yapılanlar:**
  * `src/components/nutrition/PortionSlider.tsx` bileşeni geliştirildi (Doğrudan dokunarak ve sürükleyerek 60 FPS akıcı çalışan PanResponder delta motoru, 50g-2000g genişletilmiş ölçek, -25g/+25g adım butonları, sabit gramaj kafa karışıklığı giderilmiş sade `0.5x, 1.0x, 1.5x, 2.0x` dinamik çarpan hapları).
  * `FoodAnalysisModal.tsx` içerisine entegre edildi: Gramaj değiştikçe `oran = secilenGramaj / bazGramaj` çarpanı üzerinden kalori, protein, karbonhidrat ve yağ değerleri milisaniyesinde canlı olarak yeniden hesaplanıyor (2000g'a kadar kesintisiz ölçeklenir).
  * Dinamik hesaplanan gramaj ve besin değerleri "Porsiyonu Kaydet" butonuna tıklandığında Zustand store'a (`addMeal`) aktarılıyor ve Dashboard kalori halkasında anında artış sağlıyor.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; dokunarak kaydırmanın, 2000g üst sınırının ve sade çarpan çiplerinin çalıştığı doğrulandı.

### ✅ Gün 13: Diyetisyen Sohbet Ekranı (ChatScreen) — Mesajlaşma Akışı (Tamamlandı)
* **Hedef:** Yapay zekâ diyetisyen sohbet arayüzünü ve çift taraflı konuşma akışını oluşturmak.
* **Yapılanlar:**
  * `src/components/chat/ChatBubble.tsx` bileşeni geliştirildi (Kullanıcı mesajları sağda zümrüt yeşili balonda, DietAI diyetisyen mesajları solda avatarlı beyaz kartta, zaman damgaları ve gerektiğinde tıbbi sorumluluk uyarı kartı).
  * `src/screens/ChatScreen.tsx` ekranı yeniden yazıldı: Sayfanın en üstünde yasal koruma bandı (*"🛡️ DietAI tıbbi tanı koymaz ve reçete vermez"*), kullanıcının BMR ve kalori hedeflerini bilen sıcak karşılama mesajı, `FlatList` ile otomatik en aşağıya kaydırma (`scrollToEnd`), yazıyor animasyonu ve kullanıcının sorularına (protein, kalori, su, akşam yemeği, kahvaltı, tıbbi uyarı) bağlamsal gerçekçi diyetisyen yanıtları üreten mock motor eklendi.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; Expo Go üzerinde mesajlaşma akışı ve otomatik kaydırma başarıyla doğrulandı.

### ✅ Gün 14: Hızlı Soru Hapları (QuickPromptChips) ve Yazıyor Animasyonu (Tamamlandı)
* **Hedef:** Sohbet deneyimini interaktif hale getirmek ve tek dokunuşla hazır soru sorma kolaylığı sunmak.
* **Yapılanlar:**
  * `src/components/chat/QuickPromptChips.tsx` bileşeni geliştirildi (Yatay kayan menüde akşam yemeği, protein, kalori hedefi, su takibi, tatlı krizi ve kahvaltı hapları).
  * `src/components/chat/TypingIndicator.tsx` bileşeni geliştirildi (React Native Animated motoruyla 60 FPS hızında çalışan 3 zıplayan zümrüt nokta, diyetisyen avatarı ve gerçekçi yazıyor balonu).
  * `ChatScreen.tsx` ekranına entegre edildi: Hızlı soru çipine tıklandığı an soru sohbet listesine eklenir, diyetisyen 3 noktalı yazıyor animasyonunu gösterir ve 750 ms sonra bağlamsal akıllı tavsiye balonu listeye eklenir.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; Expo Go üzerinde çipe tıklandığında yazıyor animasyonu ve yanıt akışı başarıyla doğrulandı.

### ✅ Gün 15: Kullanıcı Profili ve Ayarlar Ekranı (ProfileScreen) (Tamamlandı)
* **Hedef:** Kullanıcının mevcut metabolik durumunu görebileceği, kilo hedefini takip edebileceği, alerji çiplerini yönetebileceği ve geliştirici mock/canlı API modunu değiştirebileceği ekran.
* **Yapılanlar:**
  * `src/screens/ProfileScreen.tsx` ekranı kapsamlı biçimde geliştirildi:
    * **Metabolik Başlık & BMI Rozeti:** Kullanıcının boy ve kilosundan dinamik olarak hesaplanan BMI (Vücut Kitle İndeksi, örn: 23.5 kg/m² Normal Kilo) ve Mifflin-St Jeor hedeflerini yeniden hesaplama CTA'sı (`OnboardingScreen` düzenleme modunu açar).
    * **Kilo Hedefi & İlerleme Kartı:** Kullanıcının serbestçe belirleyebildiği hedef kilo (`targetWeightKg`), kilo verme modunda `↘` oku, `-4.0 kg verilecek`, `Haftalık -0.5 kg (Yağ Yakımı)`; kas kazanımı modunda `↗` oku, `+3.0 kg hedefleniyor`, `Haftalık +0.3 kg (Kas Kütlesi)`; kilo koruma modunda `✓` oku ve `Form Koruma (±0 kg)` rozeti ile hedefe kalan mesafeye göre canlı hesaplanan dinamik ilerleme çubuğu.
    * **Özelleştirilebilir Hedef Kilo Girişi:** `OnboardingScreen.tsx` ekranında kullanıcı amaç seçtiğinde akıllı öneri sunan, ancak kullanıcının dilediği hedef kiloyu (örn: 70, 75, 80 kg) elle serbestçe yazıp kaydedebildiği özel hedef kilo kutusu.
    * **Mifflin-St Jeor Metabolizma Telemetrisi:** BMR (1750 kcal), TDEE (2400 kcal), Günlük Kalori Hedefi (2100 kcal), Aktivite düzeyi, Protein (135g), Karb (210g), Yağ (65g) ve Su (2500ml) makro hapları.
    * **Alerji & Hassasiyet Çipleri:** `userProfile.allergies` listesini (`🥜 Fıstık (Hafif)`, `🥛 Laktoz (Düşük Tolerans)`) şık rozetlerle render eden ve düzenleme imkanı sunan alerji bölümü.
    * **Geliştirici & Mimari API Kontrolleri:** Mock Modu (Yerel veri simülasyonu) ile Canlı FastAPI & Gemini Backend modu arasında geçiş sağlayan Switch ve aktif durumu gösteren durum telemetri banner'ı.
    * **Güvenli Gün Sıfırlama:** Kazara veri kaybını önleyen `Alert.alert` onay diyaloğu ile korunan "Günü Sıfırla" butonu.
    * **Sürüm Altlığı:** `DietAI Mobile v1.0.0 (Expo SDK 52)` ve proje künyesi.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; Profil ekranındaki değerlerin Onboarding ve Zustand store ile birebir senkronize çalıştığı, güvenli sıfırlama onayının ve API mod değişiminin sorunsuz çalıştığı doğrulandı.

---

## 📆 4. Hafta: Testler, Cilalama ve Backend Entegrasyonu

### ✅ Gün 16: Çapraz Platform Testleri ve Eren/Ali ile Birleşme Günü (Tamamlandı)
* **Hedef:** Tüm uygulamanın hem Android hem iOS'ta hatasız çalıştığını doğrulamak, canlı backend mimarisine dinamik bağlanmak ve çevrimdışı toleransı sağlamak.
* **Yapılanlar:**
  * `mobile/.env` ortam yapılandırma dosyası oluşturuldu (`EXPO_PUBLIC_API_BASE_URL` ve `EXPO_PUBLIC_USE_MOCK_DATA`).
  * `src/services/api.ts` servisi `useDietStore` ile dinamik çift taraflı köprüye bağlandı: Profil ekranından "Mock Modu" kapatıldığı an canlı FastAPI/Gemini modeline bağlanır; ağ hatası veya bağlantı kesintisinde uygulamanın çökmesini önleyen 8 saniyelik timeout ve akıllı fallback koruması eklendi.
  * `CameraScreen.tsx` ve `ChatScreen.tsx` ekranları canlı API motoruna bağlandı: Çekilen veya galeriden seçilen fotoğraf arka planda canlı görsel modeline gönderilir, diyetisyen sohbeti canlı FastAPI LLM endpoint'ine iletilir.
  * `App.tsx` içerisine Android durum çubuğu çakışmalarını önleyen `Platform.OS === 'android'` SafeAreaView padding koruması eklendi.
* **Doğrulama:** `npx tsc --noEmit` sıfır hata ile derlendi; canlı ve mock modları arasında anında geçiş yapılabildiği, ağ kesintilerinde deterministik yedek veriye düşüldüğü ve iOS/Android Safe Area düzeninin kusursuz çalıştığı doğrulandı.

---

## 🏆 Program Sonu Başarı Kriterleri
Bu 16 gün bittiğinde:
1. Elinizde App Store ve Google Play standartlarında çalışan, 60 FPS akıcı ve modern bir mobil uygulama prototipi olacak.
2. Jüriye sunum yaparken hem kamera ile porsiyon tanımayı hem de kullanıcının bunu elle düzeltebilme esnekliğini canlı gösterebileceksiniz.
3. Ekip arkadaşlarınız backend'de gecikse bile siz projenizi vaktinde %100 bitirmiş olacaksınız!
