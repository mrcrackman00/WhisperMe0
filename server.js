const http = require('http');
const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname);
const port = Number(process.env.PORT || 5500);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' http://localhost:3000 https://*.supabase.co https://gkeemcezdbfplwhocwzx.supabase.co https://*.onrender.com https://*.railway.app https://*.vercel.app https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com https://www.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
  ].join('; '),
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Allow': 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  let reqPath;
  try {
    reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath === '/blog-article' || reqPath === '/blog') reqPath = reqPath === '/blog-article' ? '/blog-article.html' : '/blog.html';

  const filePath = path.resolve(path.join(base, reqPath));

  if (!filePath.startsWith(base + path.sep) && filePath !== base) {
    res.writeHead(403, securityHeaders);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, securityHeaders);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mime[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, ...securityHeaders });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`WhisperMe running at http://localhost:${port}/`);
});
