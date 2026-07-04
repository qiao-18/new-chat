const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 4173;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".json": "application/json; charset=utf-8"
};

http
  .createServer((req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const filePath = path.join(root, decodeURIComponent(urlPath));

    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath);
      const contentType = types[ext] || "application/octet-stream";
      const cacheControl = ext === ".html"
        ? "no-cache"
        : "public, max-age=31536000, immutable";
      const range = req.headers.range;

      if (range && ext === ".mp4") {
        const match = range.match(/bytes=(\d*)-(\d*)/);
        const start = match && match[1] ? parseInt(match[1], 10) : 0;
        const end = match && match[2] ? parseInt(match[2], 10) : stats.size - 1;
        const safeEnd = Math.min(end, stats.size - 1);

        if (start >= stats.size || safeEnd < start) {
          res.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
          res.end();
          return;
        }

        res.writeHead(206, {
          "Content-Type": contentType,
          "Cache-Control": cacheControl,
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${safeEnd}/${stats.size}`,
          "Content-Length": safeEnd - start + 1
        });
        fs.createReadStream(filePath, { start, end: safeEnd }).pipe(res);
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
        "Content-Length": stats.size
      });
      fs.createReadStream(filePath).pipe(res);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Portfolio preview: http://127.0.0.1:${port}`);
  });
