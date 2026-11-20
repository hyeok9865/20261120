const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const responseFile = path.join(root, 'responses.json');

function readResponses() { try { return JSON.parse(fs.readFileSync(responseFile, 'utf8')); } catch { return []; } }
function send(res, status, type, body) { res.writeHead(status, {'Content-Type': type + '; charset=utf-8'}); res.end(body); }

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'POST' && url.pathname === '/api/responses') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const item = JSON.parse(body);
        if (!['A','B'].includes(item.condition) || !Number.isInteger(item.intent) || item.intent < 1 || item.intent > 7) throw Error();
        const rows = readResponses();
        rows.push({condition:item.condition, intent:item.intent, fairPrice:Number(item.fairPrice) || null, game:item.game || '기타', createdAt:new Date().toISOString()});
        fs.writeFileSync(responseFile, JSON.stringify(rows, null, 2));
        send(res, 201, 'application/json', JSON.stringify({ok:true}));
      } catch { send(res, 400, 'application/json', JSON.stringify({ok:false, message:'Invalid response'})); }
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/results') {
    const rows = readResponses();
    const group = key => rows.filter(x => x.condition === key);
    const summary = key => { const r = group(key); return {n:r.length, mean:r.length ? +(r.reduce((s,x)=>s+x.intent,0)/r.length).toFixed(2) : null}; };
    return send(res, 200, 'application/json', JSON.stringify({total:rows.length, A:summary('A'), B:summary('B')}));
  }
  if (req.method === 'GET' && url.pathname === '/api/responses.csv') {
    const rows = readResponses();
    const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = ['condition,intent,fairPrice,game,createdAt', ...rows.map(row => [row.condition,row.intent,row.fairPrice,row.game,row.createdAt].map(quote).join(','))].join('\n');
    res.writeHead(200, {'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="mouse-lab-responses.csv"'});
    return res.end('\uFEFF' + csv);
  }
  const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'text/plain', 'Not found');
  const type = file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html';
  send(res, 200, type, fs.readFileSync(file));
}).listen(3000, () => console.log('Open http://localhost:3000'));
