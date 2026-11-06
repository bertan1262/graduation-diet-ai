# Obsidian Dokümantasyon ve Not Alma Kuralı (Workspace Rule)

Bu kural, **DietAI Bitirme Projesi** kapsamında üretilen tüm mimari belgelerin, yol haritalarının, araştırma notlarının ve teknik kılavuzların Obsidian kasasıyla tam uyumlu şekilde saklanmasını zorunlu kılar.

---

## 1. Depolama Konumu
* Proje ile ilgili hazırlanan tüm `.md` (Markdown) dokümantasyon dosyaları **ZORUNLU OLARAK** şu dizine kaydedilmelidir:
  `diet-ai-project/docs/obsidian/`

## 2. Obsidian Format ve Standartları
Her doküman aşağıdaki format standartlarına uymalıdır:

1. **YAML Frontmatter (Üst Veri):**
   Her dosyanın başında şu YAML bloğu yer almalıdır:
   ```yaml
   ---
   title: "Belge Başlığı"
   date: YYYY-MM-DD
   tags:
     - bitirme-projesi
     - diet-ai
     - [modül: mobil / backend / ai / git / mimari]
   author: "Bertan Beyal / Ekip"
   status: "aktif / tamamlandı / taslak"
   ---
   ```
2. **Çift Köşeli Ayraç Bağlantıları (Wikilinks):**
   İlgili belgeler arasında Obsidian'ın otomatik grafik görünümü (Graph View) oluşturabilmesi için `[[01-Ekip-Is-Birligi-ve-Git-Akisi]]` gibi dahili bağlantılar kullanılmalıdır.
3. **Başlık Hiyerarşisi:**
   Tek bir `# H1` başlığı ve düzenli `## H2`, `### H3` kırılımları kullanılmalıdır.
4. **Mermaid ve Görselleştirme:**
   İş akışları ve mimari şemalar için Obsidian'ın yerel olarak desteklediği ```mermaid blokları tercih edilmelidir.

---

## 3. Otomatik Senkronizasyon Kuralı
Asistan, bitirme projesiyle ilgili herhangi bir plan, rehber, mimari analiz veya toplantı notu ürettiğinde:
* İçeriği doğrudan `docs/obsidian/` altına `.md` olarak yazar.
* `00-Ana-Giris.md` indeks kütüğüne (MOC - Map of Content) yeni belgenin bağlantısını ekler.
