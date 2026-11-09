// Telefon ekranında tüm sayfaları açar, ekran görüntüsü alır ve çakışan/taşan panelleri raporlar.
// Kullanım: node mobil-kontrol.mjs [genişlikxyükseklik ...]   (varsayılan 390x844 360x740)
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:5180";
const OUT = path.resolve("../mobil");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PAGES = ["", "ar-ebru-web/", "ar-karagoz-web/", "ar-cini-web/", "ar-kilim-web/", "ar-pottery-web/", "ar-origami-web/", "ar-brick-web/"];
const sizes = (process.argv.slice(2).length ? process.argv.slice(2) : ["390x844", "360x740"]).map((s) => s.split("x").map(Number));
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let problems = 0;
for (const [w, h] of sizes) {
  for (const p of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(BASE + "/" + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const name = (p.replace(/^ar-|-web\/$/g, "") || "home") + `_${w}x${h}`;
    await page.screenshot({ path: path.join(OUT, name + ".png") });
    const report = await page.evaluate(() => {
      const vw = innerWidth, vh = innerHeight;
      const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && +s.opacity > 0.05 && r.width > 4 && r.height > 4; };
      const label = (el) => el.id ? "#" + el.id : (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/)[0] : el.tagName.toLowerCase());
      // Ekranda sabit duran paneller + ana çalışma alanı (canvas/tepsi)
      const fixed = [...document.querySelectorAll("body *")].filter((el) => getComputedStyle(el).position === "fixed" && vis(el) && el.tagName !== "VIDEO" && el.getAttribute("aria-hidden") !== "true");
      const panels = fixed.filter((el) => !fixed.some((o) => o !== el && o.contains(el)) && el.querySelector("button, h1, input, p") );
      const stage = [...document.querySelectorAll("canvas")].filter(vis).map((c) => ({ el: c, r: c.getBoundingClientRect() })).filter((o) => o.r.width < vw * 0.98 || o.r.height < vh * 0.98); // tam ekran canvas'ları sayma
      const items = [...panels.map((el) => ({ name: label(el), r: el.getBoundingClientRect() })), ...stage.map((o) => ({ name: "canvas" + (o.el.id ? "#" + o.el.id : ""), r: o.r }))];
      const out = [];
      for (const it of items) {
        const { r } = it;
        if (r.left < -1 || r.right > vw + 1) out.push(`${it.name} yatayda taşıyor (${Math.round(r.left)}..${Math.round(r.right)} / ${vw})`);
        if (r.top < -1 || r.bottom > vh + 1) out.push(`${it.name} dikeyde taşıyor (${Math.round(r.top)}..${Math.round(r.bottom)} / ${vh})`);
      }
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i].r, b = items[j].r;
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 6 && iy > 6) out.push(`${items[i].name} ↔ ${items[j].name} çakışıyor (${Math.round(ix)}×${Math.round(iy)} px)`);
      }
      // Yatay kaydırma ve dokunma hedefi boyutu
      if (document.documentElement.scrollWidth > vw + 1) out.push(`sayfa yatay kayıyor (${document.documentElement.scrollWidth}px)`);
      const small = [...document.querySelectorAll("button, a, input")].filter(vis).filter((b) => { const r = b.getBoundingClientRect(); return r.height < 30 || r.width < 30; }).length;
      if (small) out.push(`${small} dokunma hedefi 30px'ten küçük`);
      return { items: items.map((i) => `${i.name} ${Math.round(i.r.top)}-${Math.round(i.r.bottom)}`), out };
    });
    const bad = report.out.length + errors.length;
    problems += bad;
    console.log(`\n${name}: ${bad ? "SORUN " + bad : "temiz"}`);
    for (const o of report.out) console.log("  - " + o);
    for (const e of errors) console.log("  - HATA " + e);
    if (process.env.VERBOSE) console.log("    " + report.items.join(" | "));
    await ctx.close();
  }
}
await browser.close();
console.log(`\nToplam sorun: ${problems}. Görüntüler: ${OUT}`);
