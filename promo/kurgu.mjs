// Tanıtım videosunu birleştirir: klipler (hızlandırılmış/yavaşlatılmış) + altyazı + seslendirme.
// Kullanım: node kurgu.mjs   ->  promo/ar-maker-lab-reel.mp4
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const C = (n) => path.join(here, "clips", n + ".mp4");

// [klip, kaynak başlangıç, kaynak bitiş, çıkış süresi] — süreler seslendirmedeki satır sınırlarına göre
const SEG = [
  ["ebru", 30, 44.9, 3.0],      // hook: lale deseni oluşuyor
  ["home", 0, 4.5, 4.15],       // AR Maker Lab, yedi atölye
  ["pottery", 0, 6.0, 3.15],    // kurulum yok, sadece elin
  ["ebru", 0, 17, 3.05],        // fırça + tarak
  ["ebru", 17, 30, 3.1],        // lale bizi
  ["kilim", 0, 9.0, 5.35],      // mekik + kirkit
  ["cini", 0, 5.5, 3.5],        // dolgular
  ["cini", 5.5, 8.1, 3.25],     // sırla, fırınla
  ["karagoz", 1.8, 4.3, 1.75],  // kafa atma
  ["karagoz", 4.3, 7.5, 4.7],   // bulanık gölge
  ["pottery", 3.0, 6.0, 1.15],  // çömlek
  ["origami", 4, 12, 1.2],      // kâğıt uçak
  ["brick", 0, 6.9, 1.2],       // yapı blokları
  ["origami", 8, 15.5, 3.95],   // el takibi notu
  ["brick", 0, 6.9, 5.15],      // adres
  ["ebru", 38, 44.9, 4.75],     // kapanış, ebruya dönüş
];

const inputs = [], filters = [], labels = [];
SEG.forEach(([clip, s, e, d], i) => {
  inputs.push("-i", C(clip));
  const k = (d / (e - s)).toFixed(5);
  filters.push(`[${i}:v]trim=start=${s}:end=${e},setpts=(PTS-STARTPTS)*${k},fps=30,tpad=stop_mode=clone:stop_duration=1,trim=duration=${d},setpts=PTS-STARTPTS[v${i}]`);
  labels.push(`[v${i}]`);
});
const audioIdx = SEG.length;
const ass = path.join(here, "altyazi.ass").replace(/\\/g, "/").replace(/^([A-Z]):/, "$1\\:");
filters.push(`${labels.join("")}concat=n=${SEG.length}:v=1:a=0,subtitles='${ass}':fontsdir='C\\:/Windows/Fonts'[vout]`);

const out = path.join(here, "ar-maker-lab-reel.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-i", path.join(here, "seslendirme.mp3"),
  "-filter_complex", filters.join(";"), "-map", "[vout]", "-map", `${audioIdx}:a`,
  "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30",
  "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], { stdio: "inherit" });
console.log("Hazır:", out, "toplam", SEG.reduce((a, s) => a + s[3], 0).toFixed(2), "sn");
