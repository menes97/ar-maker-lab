// Basit, güvenli statik geliştirme sunucusu: node serve.js
// - Yalnızca bu bilgisayardan erişilir (127.0.0.1); ağdaki başka cihazlar dosyaları göremez.
// - Bu klasörün dışına çıkılamaz; bozuk adresler sunucuyu çökertmez.
// Kamera (getUserMedia) yalnızca localhost veya https üzerinde çalışır.
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || __PORT__;
const host = process.env.HOST || "127.0.0.1";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function send(res, code, body = "") {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
  res.end(body);
}

http
  .createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method Not Allowed");
    let urlPath;
    try { urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
    catch { return send(res, 400, "Bad Request"); }
    if (urlPath.includes("\0")) return send(res, 400, "Bad Request");

    let file = path.resolve(root, "." + urlPath);
    const rel = path.relative(root, file);
    if (rel.startsWith("..") || path.isAbsolute(rel)) return send(res, 403, "Forbidden");
    // Gizli dosyaları (.env, .git, .vercel …) ve sunucunun kendisini verme
    if (rel.split(path.sep).some((p) => p.startsWith(".")) || /(^|[\\/])serve\.js$/.test(rel)) return send(res, 404, "Not found");

    fs.stat(file, (err, st) => {
      if (!err && st.isDirectory()) {
        if (!urlPath.endsWith("/")) { res.writeHead(301, { Location: urlPath + "/" }); return res.end(); }
        file = path.join(file, "index.html");
      }
      fs.readFile(file, (err2, data) => {
        if (err2) return send(res, 404, "Not found");
        res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
        res.end(req.method === "HEAD" ? undefined : data);
      });
    });
  })
  .listen(port, host, () => console.log(`__LABEL__: http://localhost:${port}`));
