const https = require('https');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwe2jOB0tDgPTEHsdB9tBo0tiFsKqCxilMEthAkg23he_4d9egprgLzoAcZPwfkq9MUIA/exec';
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    corsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // Proxy para o Google Apps Script
  if (parsed.pathname === '/api') {
    corsHeaders(res);
    const qs = Object.keys(parsed.query)
      .map(k => k + '=' + encodeURIComponent(parsed.query[k]))
      .join('&');
    const target = SCRIPT_URL + '?' + qs;

    https.get(target, (gsRes) => {
      let data = '';
      gsRes.on('data', chunk => data += chunk);
      gsRes.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    }).on('error', (e) => {
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, erro: e.message }));
    });
    return;
  }

  // Serve o index.html para qualquer outra rota
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('PCP Cala Playa rodando na porta ' + PORT);
});
