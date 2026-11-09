// AR Maker Lab tanıtım videosu için atölye kayıtları (dikey 1080x1920).
// Kullanım: node record.mjs [sahne1 sahne2 ...]   (boşsa hepsi)
// Önce kökte `node serve.js` çalışıyor olmalı (http://localhost:5180).
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:5180";
const OUT = path.resolve("../clips");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Yumuşak fare hareketi (ekranda alet imleci görünsün)
async function glide(page, x0, y0, x1, y1, ms, down = false) {
  const steps = Math.max(2, Math.round(ms / 16));
  if (down) { await page.mouse.move(x0, y0); await page.mouse.down(); }
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t * t * (3 - 2 * t);
    await page.mouse.move(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e);
    await sleep(16);
  }
  if (down) await page.mouse.up();
}
const rect = (page, sel) => page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });

const SCENES = {
  // Ana sayfa: kartlar, yavaş kaydırma
  async home(page) {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await sleep(1200);
    for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 14); await sleep(30); }
    await sleep(800);
  },

  // Ebru: fırça serpme (3 renk), tarak, lale
  async ebru(page) {
    await page.goto(BASE + "/ar-ebru-web/", { waitUntil: "networkidle" });
    await sleep(500);
    const t = await rect(page, "#tray");
    const P = (u, v) => [t.x + t.w * u, t.y + t.h * v];
    const color = (c) => page.evaluate((c) => window.__ebru.selectColor(c, c), c);
    const tool = (k) => page.evaluate((k) => window.__ebru.selectTool(k), k);
    await tool("brush");
    for (const c of ["#1f3a68", "#e2b13c", "#b2382c"]) {
      await color(c);
      const [ax, ay] = P(0.1, 0.2), [bx, by] = P(0.9, 0.8);
      await page.mouse.move(ax, ay); await page.mouse.down();
      for (let k = 0; k < 4; k++) {
        const [x0, y0] = P(0.1 + Math.random() * 0.2, 0.15 + k * 0.2), [x1, y1] = P(0.7 + Math.random() * 0.2, 0.2 + k * 0.2);
        await glide(page, x0, y0, x1, y1, 260);
      }
      await page.mouse.up();
    }
    await tool("comb");
    { const [x0, y0] = P(0.05, 0.35), [x1, y1] = P(0.95, 0.35); await glide(page, x0, y0, x1, y1, 900, true); }
    { const [x0, y0] = P(0.95, 0.65), [x1, y1] = P(0.05, 0.65); await glide(page, x0, y0, x1, y1, 900, true); }
    await color("#b2382c"); await tool("flower");
    for (const u of [0.3, 0.5, 0.7]) { const [x0, y0] = P(u, 0.38), [x1, y1] = P(u, 0.6); await glide(page, x0, y0, x1, y1, 600, true); }
    await sleep(700);
  },

  // Kilim: tam kilim deseni, mekik geçişleri + kirkit
  async kilim(page) {
    await page.goto(BASE + "/ar-kilim-web/", { waitUntil: "networkidle" });
    await page.evaluate(() => { const K = window.__kilim; K.setPattern("tam"); K.weaveRows(14); K.draw(); });
    await sleep(400);
    for (let r = 0; r < 7; r++) {
      const g = await page.evaluate(() => { const K = window.__kilim, row = K.state.row, a = K.cellCenter(row, 0), b = K.cellCenter(row, K.state.cols - 1); const c = document.querySelector("canvas").getBoundingClientRect(); return { a, b }; });
      // Gesture in loom coordinates via hooks; animated so the shuttle is visible
      await page.evaluate(async (g) => {
        const K = window.__kilim; K.strokeStart(g.a.x, g.a.y);
        for (let i = 0; i <= 24; i++) { K.strokeMove(g.a.x + (g.b.x - g.a.x) * i / 24, g.a.y); await new Promise((r) => setTimeout(r, 14)); }
        K.strokeEnd();
      }, g);
      await page.evaluate(() => window.__kilim.beat({ instant: false }));
      await sleep(520);
    }
    await page.evaluate(() => { window.__kilim.weaveRows(10); window.__kilim.draw(); });
    await sleep(900);
  },

  // Çini: şablon, dolgular sırayla, damga, sırla
  async cini(page) {
    await page.goto(BASE + "/ar-cini-web/", { waitUntil: "networkidle" });
    await page.evaluate(() => { window.__cini.applyTemplate("rozet"); window.__cini.draw(); });
    await sleep(500);
    const fills = [[400,400,"#c23a2b"],[400,366,"#2fa3a6"],[424,376,"#1f4e9c"],[400,330,"#1f4e9c"],[449.5,350.5,"#2fa3a6"],[400,295,"#c23a2b"],[400,239,"#1f4e9c"],[121.5,121.5,"#1f4e9c"],[63,63,"#c23a2b"],[36,36,"#2fa3a6"],[412,93,"#c23a2b"],[378,130,"#1f8a5b"],[224,177,"#6b4a7a"],[20,400,"#1f4e9c"]];
    for (const f of fills) { await page.evaluate((f) => { window.__cini.fill(...f); window.__cini.draw(); }, f); await sleep(230); }
    await page.evaluate(() => { window.__cini.stamp(300, 140, { motif: "hatayi", size: 60, color: "#2fa3a6", angle: 0 }); window.__cini.draw(); });
    await sleep(700);
    await page.evaluate(() => { window.__cini.fire({ download: false }); window.__cini.draw(); });
    await sleep(1500);
  },

  // Karagöz: perde açılır, iki tasvir yürür, kafa atma, uzaklaşınca bulanıklık
  async karagoz(page) {
    await page.goto(BASE + "/ar-karagoz-web/", { waitUntil: "networkidle" });
    await sleep(900);
    await page.evaluate(() => { const K = window.__karagoz; K.openCurtain(); K.setChar(0, "karagoz"); K.setChar(1, "hacivat"); K.move(0, 250, 586); K.move(1, 1050, 586); K.setDepth(0, 0); K.setDepth(1, 0); });
    await sleep(900);
    await page.evaluate(() => { const K = window.__karagoz; K.move(0, 500, 586, false); K.move(1, 640, 586, false); });
    await sleep(1300);
    await page.evaluate(() => window.__karagoz.act(0)); await sleep(1000);
    await page.evaluate(() => window.__karagoz.act(0)); await sleep(900);
    await page.evaluate(() => { const K = window.__karagoz; K.setDepth(1, 0.85, false); K.move(1, 820, 560, false); });
    await sleep(1600);
    await page.evaluate(() => window.__karagoz.act(1)); await sleep(1000);
  },

  // Çömlek: fareyle bel ver, genişlet
  async pottery(page) {
    await page.goto(BASE + "/ar-pottery-web/", { waitUntil: "networkidle" });
    await sleep(600);
    const toScreen = (x, y) => page.evaluate(([x, y]) => { const { THREE, camera } = window.__pottery; const v = new THREE.Vector3(x, y, 0).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, [x, y]);
    let [x, y] = await toScreen(0.3, 0.55); await page.mouse.move(x, y); await page.mouse.down(); await sleep(1200); await page.mouse.up();
    [x, y] = await toScreen(0.7, 0.25); await page.keyboard.down("Shift"); await page.mouse.move(x, y); await page.mouse.down(); await sleep(1100); await page.mouse.up();
    [x, y] = await toScreen(0.6, 0.92); await page.mouse.move(x, y); await page.mouse.down(); await sleep(900); await page.mouse.up(); await page.keyboard.up("Shift");
    await sleep(600);
  },

  // Origami: adımlar hızlı oynatılır
  async origami(page) {
    await page.goto(BASE + "/ar-origami-web/", { waitUntil: "networkidle" });
    await sleep(500);
    for (let i = 0; i < 10; i++) {
      await page.click("#btnShow");
      await page.waitForFunction(() => !window.__origami.st.anim, null, { timeout: 5000 });
      await sleep(80);
    }
    await sleep(900);
    await page.click("#btnLaunch"); await sleep(1700);
  },

  // Yapı blokları: ev kat kat yükselir
  async brick(page) {
    await page.goto(BASE + "/ar-brick-web/", { waitUntil: "networkidle" });
    await sleep(400);
    const plan = [];
    for (let L = 0; L < 4; L++) {
      const c = L % 2 ? "#f3f2ee" : "#c8312b", o = L % 2 ? 2 : 0;
      for (let x = 6 + o; x < 14; x += 4) plan.push([x, 6, L, Math.min(4, 14 - x), 1, c], [x, 11, L, Math.min(4, 14 - x), 1, c]);
      if (o) plan.push([6, 6, L, 2, 1, c], [6, 11, L, 2, 1, c]);
      for (let z = 7; z < 11; z += 2) plan.push([6, z, L, 1, 2, c], [13, z, L, 1, 2, c]);
    }
    for (let x = 6; x < 14; x += 2) plan.push([x, 6, 4, 2, 6, "#1f5fb8"]);
    plan.push([2, 2, 0, 1, 1, "#8a5a3b"], [2, 2, 1, 1, 1, "#8a5a3b"], [1, 1, 2, 3, 3, "#2f8a43"], [2, 2, 3, 1, 1, "#2f8a43"]);
    for (let i = 0; i < plan.length; i++) {
      await page.evaluate(([x, z, layer, w, d, color]) => { const B = window.__brick; B.bricks.push({ x, z, layer, w, d, color }); B.rebuild(); B.view.az += 0.012; B.placeCamera(); }, plan[i]);
      await sleep(85);
    }
    await sleep(900);
  },
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"] });
for (const name of wanted) {
  // 540x960 CSS piksel, DPR 2 -> 1080x1920 keskin kare (CDP screencast cihaz pikselinde yakalar)
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    frames.push({ data: f.data, t: f.metadata.timestamp });
    try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch {}
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  const t0 = Date.now();
  try { await SCENES[name](page); } catch (e) { errors.push("SCENE: " + e.message); }
  await cdp.send("Page.stopScreencast");
  const tEnd = Date.now() / 1000;
  await ctx.close();

  // Kareleri dosyaya yaz, değişken süreli concat listesiyle mp4'e çevir
  const dir = path.join(OUT, name + "_frames");
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const list = [];
  frames.forEach((f, i) => {
    const fn = `${String(i).padStart(6, "0")}.jpg`;
    fs.writeFileSync(path.join(dir, fn), Buffer.from(f.data, "base64"));
    const next = frames[i + 1] ? frames[i + 1].t : f.t + 0.5;
    list.push(`file '${fn}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
  });
  if (frames.length) list.push(`file '${String(frames.length - 1).padStart(6, "0")}.jpg'`);
  fs.writeFileSync(path.join(dir, "list.txt"), list.join("\n"));
  const dst = path.join(OUT, name + ".mp4");
  const { execFileSync } = await import("node:child_process");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p",
    "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", dst]);
  const dur = frames.length ? (frames.at(-1).t - frames[0].t).toFixed(1) : 0;
  console.log(`${name}: ${frames.length} kare, ${dur}s -> ${dst}${errors.length ? "  HATA: " + errors.join(" | ") : ""}`);
}
await browser.close();
