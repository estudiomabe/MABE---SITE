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
   os cartoes, vao para images/og/.

   -------------------------------------------------------------------
   SEGURANCA (auditoria de 10/10/2026)

   A primeira versao disto entregava o computador inteiro enquanto rodava,
   de tres jeitos que se somavam:

     - servia qualquer caminho pedido, sem conferir se ele continuava
       dentro da pasta do site. Com %2e%2e%2f na URL dava para ler
       "MABE - CRM" e "MABE - ERP", que ficam ao lado;
     - escutava em 0.0.0.0, entao qualquer um no mesmo wifi alcancava;
     - aceitava POST /salvar de qualquer origem, entao uma pagina aberta
       noutra aba podia gravar arquivo aqui dentro.

   As tres barreiras abaixo existem por causa disso. Nenhuma atrapalha o
   uso normal: a pagina de cartoes continua funcionando igual.           */

const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname);
const PORTA = 8801;

/* So estes dois enderecos podem pedir gravacao, e so por eles o navegador
   abre a pagina. Qualquer outro Host ou Origin e recusado. */
const MAQUINAS = ['localhost:' + PORTA, '127.0.0.1:' + PORTA, '[::1]:' + PORTA];
const ORIGENS = MAQUINAS.map(m => 'http://' + m);

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json'
};

/* O path.resolve resolve os ".." antes de eu olhar, entao basta conferir
   se o que sobrou ainda comeca na raiz. O path.sep no fim evita que uma
   pasta irma chamada "MABE - SITE-outra" passe pelo startsWith. */
function dentroDaRaiz(caminho) {
  const alvo = path.resolve(caminho);
  return alvo === RAIZ || alvo.startsWith(RAIZ + path.sep);
}

/* Fecha a porta para DNS rebinding: mesmo escutando so no loopback, um
   nome de dominio que aponte para 127.0.0.1 chegaria aqui, e chegaria
   com o Host dele no cabecalho. */
function maquinaConhecida(req) {
  return MAQUINAS.includes(String(req.headers.host || '').toLowerCase());
}

function recusar(res, codigo, motivo) {
  console.log('  recusado  ' + codigo + '  ' + motivo);
  res.writeHead(codigo, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(motivo);
}

http.createServer((req, res) => {
  if (!maquinaConhecida(req)) {
    recusar(res, 403, 'este servidor so atende localhost');
    return;
  }

  if (req.method === 'POST' && req.url === '/salvar') {
    /* O navegador manda Origin em todo POST. Se veio de outro lugar, ou
       se nao veio nenhum, nao e a pagina de cartoes pedindo. */
    const origem = req.headers.origin;
    if (!origem || !ORIGENS.includes(origem)) {
      recusar(res, 403, 'gravacao so pela pagina de cartoes (origem: ' + (origem || 'nenhuma') + ')');
      return;
    }

    let corpo = '';
    req.on('data', d => {
      corpo += d;
      /* um cartao 1200x630 em base64 nao passa de uns poucos MB */
      if (corpo.length > 12e6) { req.destroy(); console.log('  ERRO  corpo grande demais'); }
    });
    req.on('end', () => {
      try {
        const { nome, dados } = JSON.parse(corpo);
        if (!/^[a-z0-9-]+\.(png|jpg|webp)$/.test(nome)) throw new Error('nome invalido: ' + nome);
        const destino = path.join(RAIZ, 'images', nome.startsWith('trabalho-') ? '' : 'og');
        const arquivo = path.join(destino, nome);
        /* o nome ja foi filtrado, mas confiro o caminho pronto do mesmo
           jeito: e a unica barreira que nao depende de eu ter escrito a
           expressao regular certa */
        if (!dentroDaRaiz(arquivo)) throw new Error('caminho fora da pasta do site');
        fs.mkdirSync(destino, { recursive: true });
        const bin = Buffer.from(String(dados).split(',')[1] || '', 'base64');
        if (!bin.length) throw new Error('imagem vazia');
        fs.writeFileSync(arquivo, bin);
        console.log('  gravado  ' + path.relative(RAIZ, arquivo).replace(/\\/g, '/') +
                    '  (' + Math.round(bin.length / 1024) + ' kB)');
        res.writeHead(200); res.end('ok');
      } catch (e) {
        console.log('  ERRO  ' + e.message);
        res.writeHead(500); res.end(String(e.message));
      }
    });
    return;
  }

  /* decodeURIComponent lanca em sequencia malformada, tipo %ZZ */
  let pedido;
  try { pedido = decodeURIComponent(req.url.split('?')[0]); }
  catch (e) { recusar(res, 400, 'endereco malformado'); return; }

  const arquivo = path.join(RAIZ, pedido);
  if (!dentroDaRaiz(arquivo)) { recusar(res, 403, 'fora da pasta do site: ' + pedido); return; }

  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404); res.end('nao achei'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    res.end(dados);
  });

/* '127.0.0.1' em vez de nada: sem isso o node escuta em todas as
   interfaces de rede, e o servidor aparece para o wifi inteiro. */
}).listen(PORTA, '127.0.0.1', () => console.log('servidor dos cartoes em http://localhost:' + PORTA));
