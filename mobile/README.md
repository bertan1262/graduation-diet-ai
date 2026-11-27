# 📱 DietAI — Mobile & Frontend Architecture Guide
> **Dal (Branch):** `frontend-and-mobile`  
> **Sorumlu Geliştirici:** Bertan Beyal (Frontend & Mobile Engineer)  
> **Teknoloji Yığını:** React Native (v0.86), Expo (SDK 52), TypeScript, Zustand (v5), AsyncStorage, React Native SVG  

---

## 🌟 Genel Bakış ve Kapsam

Bu doküman, **DietAI** projesinin mobil istemci (`/mobile`) katmanını, mimari kararlarını, bileşen hiyerarşisini, klinik formül entegrasyonunu ve 15 Ekim – 20 Ekim 2026 tarihleri arasında tamamlanan tüm özellikleri açıklamaktadır.

Uygulama, hem iOS hem Android cihazlarda sıfır bağımlılık sorunu ile çalışan, **çevrimdışı öncelikli (offline-first)**, yüksek görsel standartlara ve **derin siyah OLED karanlık mod** desteğine sahip modern bir beslenme ve kalori takip asistanıdır.

---

## 🗓️ Geliştirme Günlüğü & Kilometre Taşları (15 – 20 Ekim 2026)

### 📌 1. Canlı Tarihli Takvim Şeridi & OLED Karanlık Mod (15-18 Ekim)
* **Canlı Takvim Şeridi:** Cihazın yerel saatinden (`Intl.DateTimeFormat('tr-TR')`) anlık gün ve tarihleri çekerek "Bugün 20 Ekim Salı" gibi gerçek zamanlı dinamik tarih gösterimi.
* **OLED Dark Mode:** `@theme` token mimarisi üzerinden tüm ekranlarda (Dashboard, Onboarding, Chat, Profile, Analytics) tek tıkla gece moduna geçiş.
* **Reaktif Kalori Halkası:** Günlük hedeflenen ve tüketilen kaloriyi `react-native-svg` tabanlı dinamik dairesel ilerleme çubuğuyla anlık yansıtma.

### 📌 2. Akıllı Kamera Vizörü & Barkod Tarayıcı (16-18 Ekim)
* **Open Food Facts Barkod Tarayıcısı:** EAN-13 barkodlarını tarayarak saniyeler içinde ürün adı, kalori ve makrolarını çeken vizör arayüzü.
* **Kamera ile Yemek Tanıma & Lazer Efekti:** Tabağı fotoğraflayıp besin segmentasyonu yapan ve kullanıcı onayına sunan akıllı vizör.

### 📌 3. Klinik BMR & Beslenme Motoru Entegrasyonu (19-20 Ekim)
FastAPI backend'inde tanımlanan klinik standartlar istemciye 1:1 entegre edildi:
* **Çift Formül Mantığı (Dual BMR Engine):**
  * $\text{BMI} \le 30$ (Normal ve Hafif Kilo): **Revised Harris-Benedict** (Roza & Shizgal, 1984)
  * $\text{BMI} > 30$ (Obezite Sınırı): **Mifflin-St Jeor** (Yağ kütlesinden kaynaklı kalori sapmasını önler)
* **Yaşa Göre Klinik İdeal Kilo:** Dünya Sağlık Örgütü yaş braketlerine göre ideal BMI ($21\text{–}25$) ve hedef kilo hesaplama.
* **Spor Sıklığı & PAL Çarpanı:** Haftada 1-7 gün spor rutinine göre dinamik aktivite katsayısı ($1.2\text{–}1.9$).
* **Kronik Sağlık Parametreleri:** Diyabet, Kolesterol ve Hipertansiyon takip bayrakları.

### 📌 4. Çevrimdışı Kalıcılık, Porsiyon Düzenleme & Analiz Ekranı (20 Ekim)
* **💾 AsyncStorage Veri Kalıcılığı:** Zustand `persist` middleware ile kullanıcı profili, günlük öğünler ve su tüketimi telefon kapatıldığında dahi korunur.
* **✏️ Etkileşimli Porsiyon Düzenleme Modalı (`EditPortionModal`):** Günlüğe kaydedilmiş veya taranmış bir yemeğe tıklandığında gramajı (`-50g`, `-10g`, `+10g`, `+50g`) değiştirme, kalori ve makroları anında orantısal olarak yeniden hesaplama.
* **⚠️ İstemci Taraflı Alerjen & Klinik Kalkan:** Profilde kayıtlı alerjenler (Gluten, Laktoz, Fındık/Fıstık vb.) ve kronik hastalık durumları (Diyabet, Hipertansiyon) öğünle eşleştiğinde ekranda beliren görsel ikaz rozetleri (`⚠️ Gluten Uyarısı`, `🩸 Diyabet İkazı`).
* **📈 7 Günlük SVG Gelişim Analizleri (`AnalyticsScreen`):**
  * 7 günlük kalori çubuk grafiği (Hedef eşik çizgili).
  * Makro denge dağılımı (Protein % / Karb % / Yağ %).
  * Diyetisyen AI haftalık değerlendirme kartı.
  * Tek tuşla **"📄 Raporu Paylaş / Diyetisyene Gönder"** PDF çıktısı simülasyonu (`Share.share`).

---

## 📂 Dizin Yapısı (`/mobile`)

```text
mobile/
├── App.tsx                        # Kök gezinme, StatusBar ve Header yönetimi
├── app.json                       # Expo yapılandırması
├── package.json                   # Mobil bağımlılıklar
├── tsconfig.json                  # TypeScript yapılandırması
└── src/
    ├── components/
    │   ├── camera/                # Kamera vizörü, lazer tarama ve çekim butonları
    │   ├── common/                # Header, TabBar ve genel UI bileşenleri
    │   ├── dashboard/             # CalorieRing, MacroBar, WaterTracker, MealSection, MealItemCard
    │   └── nutrition/             # EditPortionModal, FoodAnalysisModal, PortionSlider
    ├── constants/
    │   ├── colors.ts              # Aydınlık & OLED Karanlık mod renk paletleri
    │   ├── mockData.ts            # Deterministik test ve başlangıç verileri
    │   └── theme.ts               # Tipografi, Spacing, BorderRadius ve Gölgeler
    ├── screens/
    │   ├── AnalyticsScreen.tsx    # 7 Günlük kalori grafiği, makro analizi ve rapor paylaşımı
    │   ├── CameraScreen.tsx       # Fotoğraf & Barkod okuyucu vizör ekranı
    │   ├── ChatScreen.tsx         # Diyetisyen AI sohbeti ve tıbbi güvenlik koruması
    │   ├── DashboardScreen.tsx    # Ana özet ve segment seçici ([Günün Özeti | Gelişim & Analiz])
    │   ├── MealPlanScreen.tsx     # Haftalık yemek ve diyet planı listesi
    │   ├── OnboardingScreen.tsx   # Klinik BMR hesaplama ve hedef belirleme sihirbazı
    │   └── ProfileScreen.tsx      # Metabolizma telemetrisi ve tema ayarları
    ├── services/
    │   ├── api.ts                 # Canlı FastAPI bağlantısı ve yerel fallback motoru
    │   └── openFoodFacts.ts       # Barkod sorgulama servisi
    ├── store/
    │   └── useDietStore.ts        # Zustand + AsyncStorage merkezi durum yönetimi
    └── types/
        └── index.ts               # TypeScript modelleri ve klinik tipler
```

---

## 🚀 Kurulum ve Yerel Çalıştırma

### Gereksinimler
- Node.js (v18 veya üzeri önerilir)
- npm veya yarn
- Test için fiziksel telefonda **Expo Go** uygulaması veya emülatör

### Adımlar

1. Mobil dizine gidin:
   ```bash
   cd mobile
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Geliştirici sunucusunu başlatın:
   ```bash
   npx expo start
   ```

4. Çıkan QR kodunu telefonunuzdaki **Expo Go** uygulaması ile taratarak canlı olarak test edin.

---

## 🧪 Tip Güvenliği ve Doğrulama

Tüm kodlar katı TypeScript kurallarına uygundur. Doğrulama için:

```bash
npx tsc --noEmit
# Çıkış: 0 hata (Tam tip uyumluluğu)
```

---

## 👥 İletişim & Katkı
- **Geliştirici:** Bertan Beyal
- **Proje:** DietAI — Bitirme Tezi Projesi (Graduation Thesis)
