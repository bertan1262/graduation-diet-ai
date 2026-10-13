# 🥗 DietAI — Yapay Zekâ Destekli Diyet ve Beslenme Yönetim Sistemi
> **Graduation Project / Bitirme Projesi**  
> *Akıllı telefon kamerasıyla yemek tanıma, porsiyon tahmini, kişiselleştirilmiş diyet planlama ve etik güvenlik sınırlı yapay zekâ danışmanı.*

---

## 👥 Ekip Kadrosu ve Sorumluluk Dağılımı

| Mühendis | Rol | Birincil Dizin | Temel Teknolojiler | Sorumluluk Alanı |
| :--- | :--- | :--- | :--- | :--- |
| **Bertan Beyal** | Mobil & Ön Yüz (Frontend) | `/mobile` | React Native, Expo, TypeScript | Hem iOS hem Android uyumlu mobil istemci, akıllı kamera vizörü, Expo Go testleri, diyet paneli ve kullanıcı deneyimi. |
| **Eren Torman** | Arka Yüz (Backend) & Veritabanı | `/backend` | FastAPI, PostgreSQL, SQLAlchemy | RESTful API mimarisi, veritabanı şeması, JWT kimlik doğrulama, BMR/TDEE hesaplayıcı ve API Gateway. |
| **Ali Eren Özer** | Yapay Zekâ (AI / CV & LLM) | `/ai-service` | Python, OpenCV, Gemini API | Görüntüden yemek ve porsiyon tahmini, Gemini API diyetisyen asistanı ve tıbbi teşhis engelleyici güvenlik filtreleri (guardrails). |

---

## 🏛️ Sistem Mimarisi ve Uçtan Uca Veri Akışı

Uygulama, cep telefonunda native performansla çalışan bir istemci ile bulutta barındırılan sunucu servislerinin haberleştiği **İstemci - Sunucu (Client-Server)** mimarisine sahiptir:

```mermaid
sequenceDiagram
    autonumber
    actor User as Kullanıcı (Mobil)
    participant Mobile as Mobil İstemci (Bertan)
    participant Backend as FastAPI Backend (Eren)
    participant DB as PostgreSQL Veritabanı
    participant AI as AI & CV Servisi (Ali)
    participant Gemini as Google Gemini API

    User->>Mobile: Tabağın fotoğrafını çeker
    Mobile->>Backend: POST /api/v1/nutrition/analyze-photo (Base64)
    Backend->>AI: POST /api/v1/cv/detect (Görsel aktarımı)
    AI->>AI: OpenCV & Porsiyon Segmentasyonu
    AI-->>Backend: Besin isimleri, gramaj ve kalori tahmini
    Backend->>DB: Kullanıcının günlük günlüğüne kaydeder
    Backend-->>Mobile: JSON besin analizi ve makrolar
    Mobile-->>User: Tabağın kalorisi ve makro değerleri gösterilir

    Note over User,Gemini: Sohbet & Diyetisyen Akışı
    User->>Mobile: "Diyabet için hangi ilacı almalıyım?"
    Mobile->>Backend: POST /api/v1/chat/message
    Backend->>AI: POST /api/v1/llm/chat
    AI->>AI: Güvenlik Filtresi (Tıbbi tanı tespiti)
    alt Tıbbi Teşhis / İlaç Sorusu
        AI-->>Backend: "Uyarı: Tıbbi teşhis/reçete verilemez, hekime danışınız."
    else Genel Sağlıklı Beslenme Sorusu
        AI->>Gemini: Prompt + Güvenlik Şablonu
        Gemini-->>AI: Bilimsel beslenme önerisi
        AI-->>Backend: Yanıt
    end
    Backend-->>Mobile: Güvenli sohbet mesajı
    Mobile-->>User: Mesaj ekranda gösterilir
```

---

## 🚀 Rol Bazlı Adım Adım Kurulum ve Çalıştırma Rehberi

Projeyi klonladıktan sonra her geliştirici yalnızca kendi modülünü şu adımlarla çalıştırabilir:

### 1. Bertan Beyal — Mobil Uygulama Kurulumu (`/mobile` - Windows)

Mobil geliştirici olarak bilgisayarınızda Mac olmasına gerek yoktur. Kodlarınızı hem Android hem iOS üzerinde test edebilirsiniz.

1. **Bağımlılıkları Yükleyin:**
   ```bash
   cd mobile
   npm install
   ```
2. **Ortam Değişkenini Ayarlayın:**
   `mobile/.env.example` dosyasını kopyalayarak `mobile/.env` oluşturun:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   EXPO_PUBLIC_USE_MOCK_DATA=true
   ```
   *(Not: `EXPO_PUBLIC_USE_MOCK_DATA=true` olduğu sürece Backend kapalı olsa bile mobil ekranları sahte veriyle kusursuz çalışır).*
3. **Uygulamayı Başlatın:**
   ```bash
   npx expo start
   ```
4. **Cihazda Test Etme:**
   * **iPhone için:** App Store'dan ücretsiz **Expo Go** indirin ve terminalde çıkan QR kodu telefonunuzun kamerasıyla okutun.
   * **Android için:** Google Play'den **Expo Go** indirin veya bilgisayardaki Android emülatörde çalıştırmak için terminalde `a` tuşuna basın.

---

### 2. Eren Torman — Backend & Veritabanı Kurulumu (`/backend` - macOS)

Backend geliştiricisi REST API uç noktalarını ve veritabanı işlemlerini yönetir.

1. **Sanal Ortam (venv) Oluşturun ve Paketleri Yükleyin:**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
2. **Ortam Değişkenlerini Tanımlayın:**
   ```bash
   cp .env.example .env
   ```
   `.env` dosyasını açıp veritabanı bağlantınızı düzenleyin:
   ```env
   PORT=8000
   DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/diet_ai_db
   AI_SERVICE_URL=http://localhost:8001
   ```
3. **Backend Sunucusunu Başlatın:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
4. **API Dokümantasyonunu İnceleyin:**
   Tarayıcınızda açın: **`http://localhost:8000/api/v1/docs`**  
   *(Swagger UI üzerinden tüm uç noktalar canlı olarak test edilebilir).*

---

### 3. Ali Eren Özer — Yapay Zekâ & CV Servisi Kurulumu (`/ai-service` - macOS)

Yapay zekâ geliştiricisi görüntü işleme algoritmalarını ve Gemini LLM istemcisini yönetir.

1. **Sanal Ortamı Kurun ve Bağımlılıkları Yükleyin:**
   ```bash
   cd ai-service
   python3 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
2. **Gemini API Anahtarını Ekleyin:**
   ```bash
   cp .env.example .env
   ```
   `.env` dosyasını açıp [Google AI Studio](https://aistudio.google.com)'dan aldığınız ücretsiz API anahtarını yapıştırın:
   ```env
   PORT=8001
   GEMINI_API_KEY=AIzaSy...gercek_anahtariniz
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. **AI Mikroservisini Başlatın:**
   ```bash
   uvicorn server:app --reload --port 8001
   ```
   Sağlık kontrolü: `http://localhost:8001/health`

---

### 4. Tek Komutla Tüm Altyapıyı Çalıştırma (Docker İle)

Bilgisayarınızda Docker Desktop kuruluysa, PostgreSQL veritabanını, backend'i ve AI servisini sıfır kurulum zahmetiyle tek seferde başlatabilirsiniz:

```bash
docker compose up -d
```
* PostgreSQL portu: `5432`
* Backend API: `http://localhost:8000`
* AI Servisi: `http://localhost:8001`

Kapatmak için: `docker compose down`

---

## 🌿 Ekip İçi Git & Dal (Branching) Kuralları

Depoda `main` dalı koruma altındadır. Kimse doğrudan `main`e commit atamaz.

### Standart Günlük Çalışma Döngüsü:

```bash
# 1. Her zaman en güncel main kodunu çekin
git checkout main
git pull origin main

# 2. Yapacağınız işe özel yeni bir dal (branch) açın
git checkout -b feat/mobile-camera-screen    # Bertan için örnek
git checkout -b feat/backend-user-model      # Eren için örnek
git checkout -b feat/ai-yolo-food-model      # Ali için örnek

# 3. Yalnızca kendi klasörünüzde kodunuzu yazın ve test edin...

# 4. Değişiklikleri kaydedin ve commit atın
git add .
git commit -m "feat(mobile): add camera capture viewfinder"

# 5. Dalınızı GitHub'a gönderin
git push origin feat/mobile-camera-screen
```

### Pull Request (PR) Açma ve Birleştirme:
1. GitHub deposuna gidin ve **"Compare & pull request"** butonuna tıklayın.
2. Sağ menüden diğer ekip arkadaşlarınızı **Reviewers** olarak seçin.
3. Ekip arkadaşınız kodu inceleyip **"Approve"** verdikten sonra **Squash and Merge** butonuna basarak kodu `main` dalına dahil edin.

---

## 🛡️ Etik ve Yasal Güvenlik Sınırları (Guardrails)

Bitirme projesinin başarı kriterlerinden biri etik ve yasal riskleri yönetebilmektir:
1. **Tıbbi Teşhis Yasağı:** Chatbot kesinlikle tıbbi tanı koyamaz ve ilaç öneremez.
2. **Güvenli Kalori Sınırı:** Kullanıcıya sağlık açısından tehlike arz eden aşırı düşük kalorili şok diyetler tavsiye edilemez.
3. **Yasal Sorumluluk Reddi:** Mobil ekranda ve API yanıtlarında *"Tüm tahminler yapay zekâ modeli tarafından sunulmakta olup hekim veya klinik diyetisyen reçetesi yerine geçmez"* uyarısı zorunludur.

---

## 📄 Ortak API Sözleşmesi

Mobil, Backend ve AI servisleri arasındaki standart JSON modelleri [`docs/openapi.json`](docs/openapi.json) dosyasında tanımlanmıştır. Herhangi bir uç nokta değişikliği öncesinde bu sözleşme güncellenmelidir.
