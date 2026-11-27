# 📱 DietAI Mobil İstemci (Frontend) Kapsamlı Yapım Planı

> **Geliştirici:** Bertan Beyal  
> **Modül Dizin:** `/mobile`  
> **Teknoloji Yığını:** React Native, Expo SDK, TypeScript, Expo Camera, Expo Image Picker, Zustand / React Context  
> **Hedef Platformlar:** iOS ve Android (Expo Go ile Mac gereksinimsiz canlı test)

---

## 1. Mimari Genel Bakış ve Kullanıcı Deneyimi Akışı

Uygulama 4 temel sütun üzerinde yükselecektir:

```text
[Karşılama / Onboarding] 
   └── Boy, Kilo, Yaş, Cinsiyet, Aktivite Düzeyi ve Hedef Girişi
   └── Mifflin-St Jeor Formülü ile BMR & Günlük Hedef Kalori Çıkarımı
   └── [Ana Uygulama (Bottom Tab Navigator)]
         ├── 📊 1. Sekme: Günlük Diyet & Beslenme Özeti (Dashboard)
         ├── 📸 2. Sekme: Akıllı Kamera & Yemek Tarayıcı (Scanner)
         │       └── [Yemek Analiz ve Porsiyon Düzeltme Modalı (Sheet)]
         ├── 💬 3. Sekme: Yapay Zekâ Diyetisyen Sohbeti (Guarded Chat)
         └── 👤 4. Sekme: Kullanıcı Profili, Hedefler ve Mock/API Ayarı
```

---

## 2. Dizin ve Dosya Mimarisi (`/mobile/src`)

Geliştirme sürecinde temiz bir modüler yapı kurmak için önerilen klasör yapısı:

```text
mobile/
├── assets/                  # İkonlar, görseller, sesler
├── src/
│   ├── components/          # Yeniden kullanılabilir UI bileşenleri
│   │   ├── common/
│   │   │   ├── Button.tsx           # Standart & İkincil butonlar
│   │   │   ├── Card.tsx             # Gölge ve kenarlıklı standart kartlar
│   │   │   └── Header.tsx           # Başlık ve geri dönme çubuğu
│   │   ├── dashboard/
│   │   │   ├── CalorieRing.tsx      # SVG/Dairesel günlük kalori ilerleme halkası
│   │   │   ├── MacroBar.tsx         # Protein/Karb/Yağ ilerleme çubukları
│   │   │   ├── MealItemCard.tsx     # Eklenen yemeklerin kart listesi
│   │   │   └── WaterTracker.tsx     # Hızlı su ekleme (+250ml) sayacı
│   │   ├── camera/
│   │   │   ├── CameraViewfinder.tsx # Tam ekran expo-camera görüntüsü
│   │   │   ├── CaptureButton.tsx    # Şık deklanşör butonu
│   │   │   └── ScanningOverlay.tsx  # Fotoğraf çekildiğinde yeşil tarama çizgisi
│   │   ├── nutrition/
│   │   │   ├── PortionSlider.tsx    # Kullanıcının gramajı elle düzelttiği slider
│   │   │   └── FoodAnalysisModal.tsx# Alttan açılan (Bottom Sheet) besin kartı
│   │   └── chat/
│   │       ├── ChatBubble.tsx       # Kullanıcı ve bot mesaj balonları
│   │       ├── QuickPromptChips.tsx # Hızlı soru öneri hapları
│   │       └── MedicalDisclaimer.tsx# Tıbbi teşhis yasağı uyarı bandı
│   ├── screens/             # Sayfa bileşenleri
│   │   ├── OnboardingScreen.tsx     # BMR ve profil veri giriş ekranı
│   │   ├── DashboardScreen.tsx      # Günlük kalori ve makro özeti
│   │   ├── CameraScreen.tsx         # Fotoğraf çekme ve analiz ekranı
│   │   ├── ChatScreen.tsx           # Diyetisyen sohbet ekranı
│   │   └── ProfileScreen.tsx        # BMR ve ayarlar ekranı
│   ├── services/
│   │   ├── api.ts                   # Backend ve sahte veri (mock) istemcisi
│   │   └── bmrCalculator.ts         # Yerel BMR ve TDEE hesaplama formülleri
│   ├── store/
│   │   └── useDietStore.ts          # Zustand veya Context ile global durum
│   ├── types/
│   │   └── index.ts                 # TypeScript arayüz ve tipleri
│   └── constants/
│       ├── colors.ts                # Tasarım sistemi renk kodları
│       └── mockData.ts              # Backend kapalıyken kullanılacak zengin veriler
├── App.tsx                  # Ana gezinme ve sekme kontrolü
├── app.json                 # Kamera izinleri ve Expo yapılandırması
└── package.json
```

---

## 3. Tasarım Sistemi ve Renk Paleti

Sağlık, zindelik ve güven duygusu uyandıran modern bir renk paleti:

* **Ana Renk (Primary Emerald):** `#10B981` (Diyet, zindelik, sağlık)
* **İkincil Renk (Emerald Dark):** `#059669` (Vurgular ve aktif butonlar)
* **Kalori / Karbonhidrat (Amber):** `#F59E0B` (Enerji, kalori halkası)
* **Protein / Su (Royal Blue):** `#3B82F6` (Kas yapısı, su takibi)
* **Sağlıklı Yağ (Rose/Pink):** `#EC4899` (Besin ayrımı)
* **Arka Plan (Slate 50):** `#F8FAFC` (Göz yormayan açık gri/beyaz)
* **Kartlar (Surface):** `#FFFFFF` (Net beyaz, `#E2E8F0` sınır çizgisi)
* **Metin Renkleri:** Başlıklar için `#0F172A`, gövde için `#334155`, ikincil için `#64748B`

---

## 4. Ekran Bazlı Ayrıntılı Geliştirme Planı

### Ekran 1: Karşılama & BMR Hesaplama Formu (`OnboardingScreen`)
* **Amacı:** Kullanıcının fiziksel verilerini alıp BMR ve günlük kalori ihtiyacını çıkarmak.
* **Arayüz Elemanları:**
  * Cinsiyet seçimi (Erkek / Kadın segmentli buton).
  * Boy (cm), Kilo (kg), Yaş giriş kutuları.
  * Aktivite düzeyi seçici (Hareketsiz, Az Hareketli, Orta, Çok Hareketli).
  * Hedef seçimi (Kilo Verme [-400 kcal], Kilo Koruma, Kas Kazanımı [+300 kcal]).
* **Mantık:** Mifflin-St Jeor formülüyle cihazda anında hesaplama yapılır ve `useDietStore` içerisine kaydedilir.

### Ekran 2: Günlük Beslenme Paneli (`DashboardScreen`)
* **Amacı:** Kullanıcının gün içinde ne yediğini, kaç kalori kaldığını ve makro durumunu görmesi.
* **Arayüz Elemanları:**
  * **Kalori Özeti:** Büyük dairesel ilerleme halkası (`1,450 / 2,100 kcal`). Kalan kalori canlı hesaplanır.
  * **Makro Çubukları:** 
    * Protein: `95g / 135g` (Mavi çubuk)
    * Karbonhidrat: `140g / 210g` (Sarı çubuk)
    * Yağ: `42g / 65g` (Pembe çubuk)
  * **Öğün Grupları:** Kahvaltı, Öğle, Akşam, Ara Öğün kartları. Her öğünün altında eklenen yemekler ve sağında `+ Fotoğraf Çek` hızlı butonu.
  * **Su Sayacı:** `1.75 L / 2.5 L` göstergesi ve tek tıkla `+250ml` bardağı ekleme.

### Ekran 3: Akıllı Kamera & Yemek Tarayıcı (`CameraScreen`)
* **Amacı:** Tabağın fotoğrafını çekip yapay zekâya göndermek.
* **Arayüz Elemanları:**
  * Tam ekran kamera akışı (`expo-camera`).
  * Üst çubuk: Flaş modu (Açık/Kapalı/Otomatik), Kamera çevirme (Ön/Arka).
  * Vizör kılavuzu: Ekranın ortasında tabağı hizalamayı kolaylaştıran hafif yuvarlatılmış kare çerçeve.
  * Alt çubuk: Solda "Galeriden Seç (`expo-image-picker`)", ortada büyük deklanşör butonu.
* **Fotoğraf Çekildiğinde:**
  1. Çekilen fotoğraf dondurulur ve üzerinde yeşil ışık efektiyle lazer tarama animasyonu (`ScanningOverlay`) oynatılır.
  2. Fotoğraf 1080p kalitesinde sıkıştırılır ve Base64 formatına çevrilir.
  3. `apiService.analyzeFoodImage()` çağrılır.
  4. Sonuç geldiğinde alttan **Porsiyon Düzeltme Modalı** açılır.

### Ekran 4: Porsiyon İnceleme ve Düzeltme Modalı (`FoodAnalysisModal`)
* **Amacı:** Yapay zekânın tahmin ettiği yemekleri ve gramajı kullanıcının kontrolüne sunmak.
* **Arayüz Elemanları:**
  * Çekilen fotoğrafın küçük bir önizlemesi.
  * Tespit edilen her yemek için bir kart:
    * Yemek Adı: *"Izgara Tavuk Göğsü"*
    * Güven Rozeti: *"%94 Güven"*
    * Gramaj Kaydırıcısı (Slider): `50g` ile `500g` arasında kullanıcı kaydırdıkça kalori değeri anlık olarak matematiksel formülle (`(gram / 100) * 165`) yeniden hesaplanır.
  * Öğün seçimi: Radyo butonuyla *"Hangi öğün? (Kahvaltı / Öğle / Akşam)"*.
  * Yeşil büyük buton: **"Öğünü Günlüğüme Ekle"**. Tıklandığında Dashboard ekranına döner ve makrolar güncellenir.

### Ekran 5: Diyetisyen Sohbet Botu (`ChatScreen`)
* **Amacı:** Kullanıcıya motivasyon ve beslenme rehberliği sunmak.
* **Arayüz Elemanları:**
  * Üstte kalıcı uyarı bandı: *"🛡️ DietAI tıbbi tanı koymaz ve ilaç tedavisi önermez."*
  * Hızlı soru hapları (Chips):
    * *"Bugün akşam için düşük kalorili ne yiyebilirim?"*
    * *"Protein hedefime ulaşmak için pratik ara öğün önerir misin?"*
  * Mesaj balonları: Kullanıcı mesajları sağda zümrüt yeşili, bot mesajları solda beyaz kart formatında.
  * Yazıyor animasyonu: Cevap beklenirken 3 zıplayan nokta.

---

## 5. Uygulama Adımları ve Sprint Planı (5 Aşama)

| Aşama | Süre | Yapılacak Somut İşler | Çıktı Dosyaları |
| :--- | :--- | :--- | :--- |
| **Sprint 1: Temel & Gezinme** | 1-3 Gün | Renk paleti, `types/index.ts`, Zustand global veri havuzu (`useDietStore`) ve alt menü sekmeleri (Tabs). | `src/constants/colors.ts`, `src/store/useDietStore.ts`, `App.tsx` |
| **Sprint 2: Dashboard & Form** | 4-6 Gün | Kalori ilerleme halkası (`CalorieRing`), Makro çubukları (`MacroBar`), Su sayacı ve Onboarding profil ekranı. | `src/screens/DashboardScreen.tsx`, `src/screens/OnboardingScreen.tsx` |
| **Sprint 3: Kamera Vizörü** | 7-10 Gün | `expo-camera` tam ekran entegrasyonu, flaş/çevirme butonları, deklanşör ve galeriden fotoğraf seçici. | `src/screens/CameraScreen.tsx`, `src/components/camera/*` |
| **Sprint 4: Porsiyon Modalı** | 11-13 Gün | Alttan açılan Bottom Sheet modalı, gramaj slider'ı ile dinamik kalori hesaplama ve günlüğe kaydetme. | `src/components/nutrition/FoodAnalysisModal.tsx` |
| **Sprint 5: Chatbot & Entegrasyon** | 14-16 Gün | Sohbet baloncukları, tıbbi sorumluluk reddi bandı, sahte veri modu testi ve backend bağlantı hazırlığı. | `src/screens/ChatScreen.tsx`, `src/services/api.ts` |

---

## 6. Mobil Geliştiricinin Altın Kuralları (Bertan İçin İpuçları)

1. **Backend'i Asla Beklemeyin:** `EXPO_PUBLIC_USE_MOCK_DATA=true` olduğu sürece Eren'in bilgisayarı kapalı olsa bile tüm ekranları, animasyonları ve kamera deneyimini telefonunuzda tek başınıza kusursuzlaştırabilirsiniz.
2. **Mac'e İhtiyacınız Yok:** Bilgisayarınızda `cd mobile && npx expo start` yazın. Kendi telefonunuzdaki (Android veya iPhone) **Expo Go** uygulamasından QR kodu okutun. Kodda bir satır değiştirdiğiniz an telefonunuzda canlı olarak yenilenir.
3. **Kullanıcı Hata Payını Unutmayın:** Yapay zekâ her zaman %100 doğru bilemeyebilir (örneğin pirinç pilavını bulgur sanabilir). Porsiyon Düzeltme Modalı sayesinde kullanıcının yemeğin adını ve gramajını elle değiştirebilmesi jüriden en çok puan toplayacak özelliktir.
