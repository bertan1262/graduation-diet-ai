# DietAI — AI-Powered Diet Management System
> Graduation Project / Bitirme Projesi

DietAI, akıllı telefon kamerasıyla yemek tespiti ve derinlik/porsiyon tahmini yaparak besin değerlerini çıkaran, Basal Metabolizma Hızı (BMR) ve kullanıcı tercihlerine göre kişiselleştirilmiş haftalık beslenme planı oluşturan ve tıbbi tanı sınırlarına (guardrails) sahip yapay zekâ danışmanı sunan mobil tabanlı bir sağlık mühendisliği projesidir.

---

## 🏛️ Mimari ve Dizin Yapısı (Monorepo)

```text
diet-ai-project/
├── mobile/             # React Native (Expo) - Hem Android hem iOS uyumlu mobil istemci
├── backend/            # FastAPI - REST API, PostgreSQL, BMR hesaplama ve iş mantığı
├── ai-service/         # Python - Gemini API LLM Danışmanı & OpenCV/YOLO Yemek Tanıma
├── docs/               # OpenAPI 3.0 Sözleşmesi (openapi.json)
├── .github/workflows/  # Otomatik PR doğrulama ve CI boru hattı
└── docker-compose.yml  # Yerel veritabanı ve servis orkestrasyonu
```

---

## 👥 Ekip ve Rol Dağılımı

* **Bertan Beyal — Mobil & Ön Yüz (Frontend) Mühendisi:** `/mobile` dizini sorumlusu. React Native (Expo) ile hem Android hem iOS uyumlu arayüz, akıllı kamera vizörü, Expo Go testleri ve kullanıcı deneyimi.
* **Eren Torman — Arka Yüz (Backend) & Veritabanı Mühendisi:** `/backend` dizini sorumlusu. FastAPI REST API, PostgreSQL veri modelleri, BMR/TDEE makro hesaplama algoritmaları ve API Gateway entegrasyonu.
* **Ali Eren Özer — Yapay Zekâ (AI / CV & LLM) Mühendisi:** `/ai-service` dizini sorumlusu. Bilgisayarlı görü (OpenCV/YOLO) ile yemek ve porsiyon tahmini, Gemini API diyetisyen sohbet botu ve tıbbi tanı engelleyici etik güvenlik kuralları (guardrails).

---

## 🚀 Hızlı Başlangıç (Geliştirici Kurulumu)

### 1. Depoyu Klonlayın
```bash
git clone <repo-url>
cd diet-ai-project
```

### 2. Mobil Uygulamayı Çalıştırma (iOS & Android)
```bash
cd mobile
npm install
npx expo start
```
* **Android için:** `a` tuşuna basın veya emülatör açın.
* **iOS için:** Telefonunuza App Store'dan **Expo Go** indirin ve terminaldeki QR kodu okutun!

### 3. Backend Servisini Çalıştırma
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
API Dokümantasyonu: `http://localhost:8000/api/v1/docs`

### 4. Yapay Zekâ Servisini Çalıştırma
```bash
cd ai-service
python -m venv .venv
# venv aktif edildikten sonra:
pip install -r requirements.txt
cp .env.example .env
# .env içine GEMINI_API_KEY değerinizi girin
uvicorn server:app --reload --port 8001
```

### 5. Tüm Altyapıyı Docker ile Başlatma
```bash
docker compose up -d
```

---

## 🌿 Git & Dal (Branching) Kuralları

1. **`main` Dalına Doğrudan Commit Atılamaz!**
2. Herkes kendi özelliği için dal açar:
   * `feat/mobile-camera-screen`
   * `feat/backend-bmr-calculator`
   * `feat/ai-gemini-guardrails`
3. PR açılırken en az 1 ekip arkadaşının incelemesi ve onayı (**Approve**) gerekir.
4. Birleştirme yöntemi: **Squash and Merge**.
