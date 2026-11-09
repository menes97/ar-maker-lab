# ✋ AR Maker Lab

Kamerana elini göster, havada üret. Tarayıcıda açılan yedi el takibi atölyesi; kurulum yok.

**Canlı:** https://ar-maker-lab.vercel.app

| Atölye | Ne yaparsın |
|---|---|
| 🎨 Ebru | Fırçayla boya serp, bizle çek, tarakla tara, lale aç; kâğıda al. |
| 🎭 Karagöz | İki elinle iki tasvir oynat; elini uzaklaştırınca gölge bulanıklaşır; videoya kaydet. |
| 🔷 Çini | Simetrik karoda tahrir çek, motif damgala, İznik renkleriyle boya, sırla ve fırınla. |
| 🧶 Kilim | Mekiği çözgülerden geçir, kirkitle sıkıştır; elibelinde, koçboynuzu, göz motifleri. |
| 🏺 Çömlek | Dönen kili parmağınla bastır, pinch ile çek. |
| 📄 Origami | Kâğıt uçağı on adımda katla ve fırlat. |
| 🧱 Yapı blokları | Parça koy, üst üste diz, boya, sil. |

## Nasıl çalışır

- El takibi: [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) tarayıcıda, cihazın üzerinde çalışır. **Kamera görüntüsü hiçbir sunucuya gönderilmez.**
- İşaretçi titremesi One Euro filtresiyle yumuşatılır; pinch (başparmak + işaret parmağı) = tut/dokun.
- 3B sahneler Three.js, diğerleri Canvas 2D. Her atölye tek bir `index.html` dosyasıdır, derleme adımı yoktur.
- Kamera yoksa fare veya dokunmatik ile de kullanılır.

## Yerelde çalıştırma

Node.js yeterli:

```bash
node serve.js
```

Sonra http://localhost:5180 adresini aç. Sunucu yalnızca bu bilgisayardan erişilebilir (127.0.0.1). Kamera izni yalnızca `localhost` veya `https` üzerinde verilir.

## Klasörler

- `index.html` — ana sayfa
- `ar-*-web/` — atölyeler (her biri bağımsız; `node serve.js` ile tek başına da açılır)
- `promo/` — tanıtım videosu, seslendirme metni, altyazı ve kurgu betikleri
- `scripts/serve-template.js` — yerel sunucuların ortak şablonu
