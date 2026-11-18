// Araba oyunu: senaryo testi + ekran görüntüleri (masaüstü ve telefon).
import { chromium } from "playwright-core";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:5180";
const OUT = path.resolve("../mobil");
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

for (const [w, h, mobile] of [[1280, 800, false], [390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errs.push("console: " + m.text()));
  await page.goto(BASE + "/ar-araba-web/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const tag = `${w}x${h}`;
  await page.screenshot({ path: path.join(OUT, `araba_menu_${tag}.png`) });
  const r = await page.evaluate(() => {
    const a = window.__araba, s = a.state, log = {};
    a.setAuto(false); a.start(); a.step(1);
    log.started = s.mode;
    a.setSteer(-1); a.step(1); log.leftX = +s.x.toFixed(2); a.setSteer(0); a.step(1.5); log.centerX = +s.x.toFixed(2);
    a.jump(); a.step(0.35); log.jumpY = +s.y.toFixed(2); a.step(1);
    const sc0 = s.score; a.spawn("balloon-" + s.target, s.lane, -12); a.step(2); log.balloonGain = s.score - sc0;
    const sc1 = s.score; a.spawn("balloon-" + (s.target === "red" ? "blue" : "red"), s.lane, -12); a.step(2); log.wrongGain = s.score - sc1;
    a.spawn("cone", s.lane, -12); a.step(1.5); log.coneWobble = s.wobble > 0 || "no";
    a.spawn("light", 1, -50); a.step(8); log.lightRed = s.light; log.speedAtRed = +s.speed.toFixed(2);
    a.step(2.5); log.lightAfter = s.light;
    a.step(8); log.lightLater = s.light;
    return log;
  });
  await page.evaluate(() => { const a = window.__araba; a.setAuto(true); a.step(3); a.render(); });
  await page.screenshot({ path: path.join(OUT, `araba_play_${tag}.png`) });
  const end = await page.evaluate(() => { const a = window.__araba; a.step(60); a.render(); return { over: a.state.over, rating: a.state.rating, score: a.state.score, mode: a.state.mode }; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `araba_end_${tag}.png`) });
  // Telefonda paneller yolu kapatıyor mu?
  const layout = await page.evaluate(() => [...document.querySelectorAll(".hud, .bar, #side, #banner, [id*=banner]")].filter((e) => getComputedStyle(e).display !== "none").map((e) => { const r = e.getBoundingClientRect(); return `${e.id || e.className.split(" ")[0]} ${Math.round(r.top)}-${Math.round(r.bottom)}`; }));
  console.log(tag, JSON.stringify(r), JSON.stringify(end), "| panels:", layout.join(", "), errs.length ? "\n  HATA: " + errs.join(" | ") : "\n  hata yok");
  await ctx.close();
}
await b.close();
