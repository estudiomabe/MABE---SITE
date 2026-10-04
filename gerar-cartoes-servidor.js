/* SERVIDOR LOCAL DOS CARTOES DE COMPARTILHAMENTO
   -------------------------------------------------------------------
   Os cartoes 1200x630 sao desenhados no navegador, com canvas, porque e
   o unico jeito de usar as fontes da marca sem instalar nada. O navegador
   nao escreve em disco sozinho, entao este servidor serve a pasta do site
   e recebe as imagens prontas em POST /salvar.

   Uso:
       node gerar-cartoes-servidor.js
   e, com ele rodando, abra  http://localhost:8801/gerar-cartoes.html

   Nomes que comecam com "trabalho-" vao para images/; os demais, que sao
   os cartoes, vao para images/og/.                                      */

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const PORTA = 8801;

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json'
};

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/salvar') {
    let corpo = '';
    req.on('data', d => { corpo += d; });
    req.on('end', () => {
      try {
        const { nome, dados } = JSON.parse(corpo);
        if (!/^[a-z0-9-]+\.(png|jpg|webp)$/.test(nome)) throw new Error('nome invalido: ' + nome);
        const destino = path.join(RAIZ, 'images', nome.startsWith('trabalho-') ? '' : 'og');
        fs.mkdirSync(destino, { recursive: true });
        const bin = Buffer.from(dados.split(',')[1], 'base64');
        fs.writeFileSync(path.join(destino, nome), bin);
        console.log('  gravado  ' + path.relative(RAIZ, path.join(destino, nome)).replace(/\\/g, '/') +
                    '  (' + Math.round(bin.length / 1024) + ' kB)');
        res.writeHead(200); res.end('ok');
      } catch (e) {
        console.log('  ERRO  ' + e.message);
        res.writeHead(500); res.end(String(e.message));
      }
    });
    return;
  }

  const arquivo = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404); res.end('nao achei'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    res.end(dados);
  });
}).listen(PORTA, () => console.log('servidor dos cartoes em http://localhost:' + PORTA));
