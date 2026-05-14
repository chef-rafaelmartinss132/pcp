const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwe2jOB0tDgPTEHsdB9tBo0tiFsKqCxilMEthAkg23he_4d9egprgLzoAcZPwfkq9MUIA/exec';
const PORT = process.env.PORT || 3000;

function httpsGet(url, redirects) {
  redirects = redirects || 0;
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(httpsGet(res.headers.location, redirects + 1));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, 'http://localhost');

  if (reqUrl.pathname === '/api') {
    const qs = reqUrl.search;
    const target = SCRIPT_URL + qs;
    httpsGet(target)
      .then(data => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      })
      .catch(e => {
        res.writeHead(500);
        res.end(JSON.stringify({ ok: false, erro: e.message }));
      });
    return;
  }

  // POST para /api
  if (req.method === 'POST' && reqUrl.pathname === '/api') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const action = reqUrl.searchParams.get('action') || '';
      const target = SCRIPT_URL + '?action=' + action + '&dados=' + encodeURIComponent(body);
      httpsGet(target)
        .then(data => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        })
        .catch(e => {
          res.writeHead(500);
          res.end(JSON.stringify({ ok: false, erro: e.message }));
        });
    });
    return;
  }

  // Serve index.html
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log('PCP Cala Playa porta ' + PORT));
