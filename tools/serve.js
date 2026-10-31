// Tiny static server for the app folder (development preview only).
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.env.APP_DIR || path.join(__dirname, '..');
const port = +(process.env.PORT || 5180);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
// Optional dev-only route that exposes a Tray folder so the app can be tested without a file dialog.
const trayDir = process.env.TRAY_DIR;
http.createServer((req, res) => {
  if (trayDir && req.url.startsWith('/__tray/')) {
    const name = decodeURIComponent(req.url.slice(8));
    if (name === 'list') {
      const list = fs.readdirSync(trayDir).map(n => ({ name: n, lastModified: fs.statSync(path.join(trayDir, n)).mtimeMs }));
      res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(list));
    }
    const f = path.join(trayDir, path.basename(name));
    return fs.readFile(f, (err, data) => { res.writeHead(err ? 404 : 200); res.end(err ? '' : data); });
  }
  const p =path.normalize(path.join(root, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0])));
  if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}`));
