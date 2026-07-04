const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of ["index.html", "src", "public"]) {
  fs.cpSync(path.join(root, entry), path.join(dist, entry), {
    recursive: true
  });
}

console.log("Built static site to dist");
