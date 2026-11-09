// Telefonda parmakla dokunma testi (CDP touch olayları) + bitiş ekranlarının görüntüsü.
import { chromium } from "playwright-core";
import path from "node:path";

const BASE = "http://localhost:5180";
const OUT = path.resolve("../mobil");
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const open = async (p) => {
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(BASE + "/" + p, { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  const drag = async (pts, ms = 25) => { await touch("touchStart", ...pts[0]); for (const p of pts.slice(1)) { await touch("touchMove", ...p); await page.waitForTimeout(ms); } await touch("touchEnd"); await page.waitForTimeout(150); };
  const rect = (sel) => page.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  return { ctx, page, drag, rect, errs };
};
const line = (x0, y0, x1, y1, n = 20) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);

// Ebru: parmakla fırça sürükle
{ const { ctx, page, drag, rect, errs } = await open("ar-ebru-web/");
  const t = await rect("#tray");
  const before = await page.evaluate(() => window.__ebru.drops.length);
  await drag(line(t.x + t.w * 0.2, t.y + t.h * 0.5, t.x + t.w * 0.8, t.y + t.h * 0.5, 30), 40);
  const after = await page.evaluate(() => window.__ebru.drops.length);
  await page.screenshot({ path: path.join(OUT, "dokunma_ebru.png") });
  console.log(`ebru: dokunmayla ${after - before} damla ${errs.length ? "HATA " + errs : ""}`); await ctx.close(); }

// Brick: parmakla dokun = parça koy
{ const { ctx, page, drag, errs } = await open("ar-brick-web/");
  const n0 = await page.evaluate(() => window.__brick.bricks.length);
  const [x, y] = await page.evaluate(() => { const { THREE, camera } = window.__brick; camera.updateMatrixWorld(); const v = new THREE.Vector3(0, 0.2, 0).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
  await drag([[x, y], [x, y]]);
  await page.waitForTimeout(200);
  const n1 = await page.evaluate(() => window.__brick.bricks.length);
  await page.screenshot({ path: path.join(OUT, "dokunma_brick.png") });
  console.log(`brick: dokunmayla ${n1 - n0} parça ${errs.length ? "HATA " + errs : ""}`); await ctx.close(); }

// Kilim: parmakla satır boyunca kaydır, sonra bitir ekranı
{ const { ctx, page, drag, errs } = await open("ar-kilim-web/");
  const pts = await page.evaluate(() => { const K = window.__kilim, c = document.getElementById("loom").getBoundingClientRect(), g = K.geometry; const a = K.cellCenter(K.state.row, 0), z = K.cellCenter(K.state.row, K.state.cols - 1); const sx = c.width / g.LW, sy = c.height / g.LH; return [[c.left + a.x * sx, c.top + a.y * sy], [c.left + z.x * sx, c.top + z.y * sy]]; });
  await drag(line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], 30), 30);
  const woven = await page.evaluate(() => window.__kilim.cells.filter(Boolean).length);
  await page.evaluate(() => { window.__kilim.setPattern("tam"); window.__kilim.weaveRows(30); window.__kilim.finish(); });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "dokunma_kilim_bitir.png") });
  console.log(`kilim: dokunmayla ${woven} hücre dokundu ${errs.length ? "HATA " + errs : ""}`); await ctx.close(); }

// Çini: pano görünümü
{ const { ctx, page, errs } = await open("ar-cini-web/");
  await page.evaluate(() => { const c = window.__cini; c.applyTemplate("rozet"); c.fill(400, 400, "#c23a2b"); c.fill(400, 239, "#1f4e9c"); c.fill(20, 400, "#1f4e9c"); c.setPano(true, true); c.draw(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, "dokunma_cini_pano.png") });
  console.log(`cini: pano ${errs.length ? "HATA " + errs : "tamam"}`); await ctx.close(); }

// Karagöz: perde açık, iki tasvir
{ const { ctx, page, errs } = await open("ar-karagoz-web/");
  await page.evaluate(() => { const K = window.__karagoz; K.openCurtain(); K.move(0, 470, 586); K.move(1, 800, 586); for (let i = 0; i < 60; i++) K.step(); });
  await page.screenshot({ path: path.join(OUT, "dokunma_karagoz.png") });
  console.log(`karagoz: ${errs.length ? "HATA " + errs : "tamam"}`); await ctx.close(); }

await b.close();
