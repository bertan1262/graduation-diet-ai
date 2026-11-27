---
title: "Sistem Mimarisi, Uçtan Uca Veri Akışı ve Güvenlik Sınırları"
date: 2026-10-17
tags:
  - bitirme-projesi
  - diet-ai
  - mimari
  - sequence-diagram
  - guardrails
author: "Bertan Beyal"
status: "tamamlandi"
---

# 🏛️ Sistem Mimarisi, Uçtan Uca Veri Akışı ve Güvenlik Sınırları

> Ana Dokümantasyon Merkezi: [[00-Ana-Giris]]  
> İlgili Kılavuzlar: [[01-Ekip-Is-Birligi-ve-Git-Akisi]], [[04-Mobil-Gelistirici-Yapim-Plani-Bertan]]

Bu belge, **DietAI** projesinin mobil istemcisi, FastAPI arka yüzü, PostgreSQL veritabanı ve yapay zekâ mikroservisi arasındaki mimari iletişimi detaylandırır.

---

## 1. Uçtan Uca Veri Akışı (Sequence Diagram)

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

## 2. Etik ve Yasal Güvenlik Sınırları (Guardrails)

Bitirme projesinin başarısı için sisteme entegre edilen etik filtreler:
1. **Tıbbi Teşhis Yasağı:** Chatbot kesinlikle tıbbi tanı koyamaz ve ilaç tedavisi öneremez.
2. **Güvenli Kalori Sınırı:** Kullanıcıya sağlık açısından tehlike arz eden aşırı düşük kalorili şok diyetler tavsiye edilemez.
3. **Yasal Sorumluluk Reddi:** Mobil ekranda ve API yanıtlarında *"Tüm tahminler yapay zekâ modeli tarafından sunulmakta olup hekim veya klinik diyetisyen reçetesi yerine geçmez"* uyarısı zorunludur.
