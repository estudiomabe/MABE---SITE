/* CONFERE O SITE NO AR DEPOIS DO PUSH
   -------------------------------------------------------------------
   Uso:
       node .claude/skills/publicar/scripts/no-ar.js

   1. Exige que o ultimo commit ja tenha sido enviado.
   2. Espera o deploy ate o index.html e o en.json servidos ficarem
      identicos aos do commit. Ate cinco minutos.
   3. Para cada URL do sitemap.xml, exige 200 e, quando a pagina tem
      arquivo proprio no repositorio, exige que o que esta no ar seja
      identico a ele. Isso pega pagina gerada que nao subiu.
   4. Exige 404 numa rota que nao existe.
   5. Exige que nenhum arquivo do .vercelignore esteja acessivel. Pastas
      sao abertas arquivo por arquivo: testar um nome inventado so prova
      que o nome inventado nao existe.

   Sai com codigo 1 se qualquer item falhar.                            */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

process.chdir(path.resolve(__dirname, '..', '..', '..', '..'));

const SITE = 'https://www.estudiomabe.com.br';
const LIMITE_MS = 5 * 60 * 1000;

let falhas = 0;
const ok = msg => console.log('  ok     ' + msg);
const falha = msg => { falhas++; console.log('  FALHA  ' + msg); };
const esperar = ms => new Promise(r => setTimeout(r, ms));
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] });
const semCR = s => s.replace(/\r\n/g, '\n');

/* o repositorio guarda LF; o disco, no Windows, pode estar em CRLF */
function doCommit(arquivo) {
  try { return semCR(git('show', 'HEAD:' + arquivo)); } catch (e) { return null; }
}

async function doAr(rota) {
  const url = SITE + encodeURI(rota) + (rota.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  const r = await fetch(url, { cache: 'no-store', redirect: 'manual' });
  return { status: r.status, texto: semCR(await r.text()) };
}

/* /mobiliario -> mobiliario/index.html ; / -> index.html */
const arquivoDaRota = rota => (rota === '/' ? '' : rota.replace(/^\//, '').replace(/\/$/, '') + '/') + 'index.html';

(async () => {
  /* ---------------------------------------------------------- 1. push */
  const local = git('rev-parse', 'HEAD').trim();
  let remoto = '';
  try { remoto = git('rev-parse', '@{u}').trim(); } catch (e) { /* sem upstream */ }
  if (remoto && remoto !== local) {
    falha('o commit ' + local.slice(0, 7) + ' ainda nao foi enviado. Rode git push antes.');
    process.exit(1);
  }

  /* ------------------------------------------------------- 2. deploy */
  const esperado = { '/': doCommit('index.html'), '/en.json': doCommit('en.json') };
  console.log('esperando o deploy de ' + local.slice(0, 7) + '...');
  const inicio = Date.now();
  for (;;) {
    const iguais = await Promise.all(Object.entries(esperado).map(async ([rota, texto]) => (await doAr(rota)).texto === texto));
    if (iguais.every(Boolean)) break;
    if (Date.now() - inicio > LIMITE_MS) {
      falha('em 5 minutos o site nao ficou igual ao commit. Veja o painel da Vercel: o deploy pode ter falhado.');
      process.exit(1);
    }
    await esperar(10000);
  }
  ok('deploy no ar em ' + Math.round((Date.now() - inicio) / 1000) + ' s: index.html e en.json identicos ao commit');

  /* ------------------------------------------------------ 3. sitemap */
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  const rotas = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(SITE, '') || '/');
  let ruins = 0;
  await Promise.all(rotas.map(async rota => {
    const { status, texto } = await doAr(rota);
    if (status !== 200) { ruins++; falha(rota + ' respondeu ' + status); return; }
    const proprio = doCommit(arquivoDaRota(rota));
    if (proprio !== null && texto !== proprio) { ruins++; falha(rota + ' esta no ar, mas diferente de ' + arquivoDaRota(rota) + ' no commit'); }
  }));
  if (!ruins) ok(rotas.length + ' URLs do sitemap em 200 e identicas ao commit');

  /* ---------------------------------------------------------- 4. 404 */
  const inexistente = '/nao-existe-' + Date.now();
  const s404 = (await doAr(inexistente)).status;
  if (s404 === 404) ok('rota inexistente responde 404');
  else falha('rota inexistente respondeu ' + s404 + ' em vez de 404');

  /* ------------------------------------------------- 5. .vercelignore */
  const itens = fs.readFileSync('.vercelignore', 'utf8').split(/\r?\n/)
    .map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const arquivos = [];
  for (const item of itens) {
    if (item.endsWith('/')) arquivos.push(...git('ls-files', item).split(/\r?\n/).filter(Boolean));
    else arquivos.push(item);
  }
  let expostos = 0;
  await Promise.all(arquivos.map(async a => {
    const { status } = await doAr('/' + a);
    if (status !== 404) { expostos++; falha('/' + a + ' responde ' + status + ', mas esta no .vercelignore'); }
  }));
  if (!expostos) ok(arquivos.length + ' arquivos do .vercelignore fora do ar (404)');

  console.log(falhas ? '\n' + falhas + ' falha(s) no ar.' : '\npublicado e conferido.');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.log('  FALHA  ' + e.message); process.exit(1); });
