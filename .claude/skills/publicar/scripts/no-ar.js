/* CONFERE O SITE NO AR DEPOIS DO PUSH
   -------------------------------------------------------------------
   Uso:
       node .claude/skills/publicar/scripts/no-ar.js

   Exige que o ultimo commit ja tenha sido enviado, e entao repete a
   conferencia inteira a cada 10 s ate tudo passar, por ate 5 minutos:

   1. Cada arquivo que o ultimo commit mudou, e que vai ao ar, esta
      identico ao commit. Os que ele apagou respondem 404. E isto que
      prova que o deploy deste commit chegou: comparar so o index.html
      passaria na hora num commit que nao mexe nele, conferindo o deploy
      anterior.
   2. index.html e en.json identicos ao commit.
   3. Cada URL do sitemap.xml em 200 e, quando tem arquivo proprio no
      repositorio, identica a ele. Pega pagina gerada que nao subiu.
   4. 404 numa rota que nao existe.
   5. Nenhum arquivo do .vercelignore acessivel. Pastas sao abertas
      arquivo por arquivo: testar um nome inventado so prova que o nome
      inventado nao existe.

   Sai com codigo 1 se, no fim do prazo, algo ainda falhar.            */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

process.chdir(path.resolve(__dirname, '..', '..', '..', '..'));

const SITE = 'https://www.estudiomabe.com.br';
const PRAZO_MS = 5 * 60 * 1000;
const INTERVALO_MS = 10 * 1000;
const TEXTO = /\.(html|json|xml|txt|js|css|svg|md)$/i;

const esperar = ms => new Promise(r => setTimeout(r, ms));
const git = (...a) => execFileSync('git', a, { maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] });
const gitTexto = (...a) => git(...a).toString('utf8');

/* conteudo do arquivo no commit; null se nao existe nele */
function doCommit(arquivo) {
  try { return git('show', 'HEAD:' + arquivo); } catch (e) { return null; }
}

async function doAr(rota) {
  const url = SITE + encodeURI(rota) + (rota.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  const r = await fetch(url, { cache: 'no-store', redirect: 'manual' });
  return { status: r.status, corpo: Buffer.from(await r.arrayBuffer()) };
}

/* texto compara sem se importar com CRLF; o resto, byte a byte */
function iguais(arquivo, a, b) {
  if (TEXTO.test(arquivo)) return a.toString('utf8').replace(/\r\n/g, '\n') === b.toString('utf8').replace(/\r\n/g, '\n');
  return a.equals(b);
}

/* index.html -> / ; mobiliario/index.html -> /mobiliario ; resto -> /caminho */
function rotaDoArquivo(arquivo) {
  if (arquivo === 'index.html') return '/';
  if (arquivo.endsWith('/index.html')) return '/' + arquivo.slice(0, -'/index.html'.length);
  return '/' + arquivo;
}
const arquivoDaRota = rota => (rota === '/' ? '' : rota.replace(/^\//, '').replace(/\/$/, '') + '/') + 'index.html';

/* o .vercelignore deste site so usa nome exato e pasta terminada em / */
const ignorados = fs.readFileSync('.vercelignore', 'utf8').split(/\r?\n/)
  .map(l => l.trim()).filter(l => l && !l.startsWith('#'));
/* configuracao que a propria Vercel le e nunca serve */
const NUNCA_SERVIDOS = ['.vercelignore', 'vercel.json', '.gitignore'];
const ignorado = arq => NUNCA_SERVIDOS.includes(arq) ||
  ignorados.some(p => (p.endsWith('/') ? arq.startsWith(p) : arq === p));

/* ------------------------------------------------ o que o commit mudou */
function mudancasDoCommit() {
  let saida = '';
  try { saida = gitTexto('diff', '--name-status', '--no-renames', 'HEAD~1', 'HEAD'); }
  catch (e) { return { alterados: [], apagados: [] }; }   /* primeiro commit */
  const alterados = [], apagados = [];
  for (const linha of saida.split(/\r?\n/).filter(Boolean)) {
    const [tipo, arquivo] = linha.split('\t');
    if (ignorado(arquivo)) continue;
    (tipo === 'D' ? apagados : alterados).push(arquivo);
  }
  return { alterados, apagados };
}

/* ------------------------------------------------- uma rodada inteira */
async function conferir(mudancas) {
  const oks = [], falhas = [];

  /* 1. o que o commit mudou */
  const alt = await Promise.all(mudancas.alterados.map(async a => {
    const { status, corpo } = await doAr(rotaDoArquivo(a));
    return status === 200 && iguais(a, corpo, doCommit(a)) ? null : a + ' (' + status + ')';
  }));
  const apa = await Promise.all(mudancas.apagados.map(async a => {
    const { status } = await doAr(rotaDoArquivo(a));
    return status === 404 ? null : a + ' ainda responde ' + status;
  }));
  const ruins1 = alt.concat(apa).filter(Boolean);
  if (!mudancas.alterados.length && !mudancas.apagados.length) oks.push('o commit so mexeu em arquivos que nao vao ao ar');
  else if (ruins1.length) falhas.push('ainda nao reflete o commit: ' + ruins1.join(', '));
  else oks.push((mudancas.alterados.length + mudancas.apagados.length) + ' arquivo(s) deste commit no ar, identicos');

  /* 2. as duas pecas centrais */
  for (const a of ['index.html', 'en.json']) {
    const { status, corpo } = await doAr(rotaDoArquivo(a));
    if (status === 200 && iguais(a, corpo, doCommit(a))) oks.push(a + ' identico ao commit');
    else falhas.push(a + ' no ar difere do commit (' + status + ')');
  }

  /* 3. sitemap */
  const rotas = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => m[1].replace(SITE, '') || '/');
  const ruins3 = (await Promise.all(rotas.map(async rota => {
    const { status, corpo } = await doAr(rota);
    if (status !== 200) return rota + ' (' + status + ')';
    const proprio = doCommit(arquivoDaRota(rota));
    return proprio && !iguais('x.html', corpo, proprio) ? rota + ' (diferente do commit)' : null;
  }))).filter(Boolean);
  if (ruins3.length) falhas.push('sitemap: ' + ruins3.join(', '));
  else oks.push(rotas.length + ' URLs do sitemap em 200 e identicas ao commit');

  /* 4. 404 */
  const s404 = (await doAr('/nao-existe-' + Date.now())).status;
  if (s404 === 404) oks.push('rota inexistente responde 404');
  else falhas.push('rota inexistente respondeu ' + s404);

  /* 5. .vercelignore, arquivo por arquivo */
  const arquivos = [];
  for (const p of ignorados) {
    if (p.endsWith('/')) arquivos.push(...gitTexto('ls-files', p).split(/\r?\n/).filter(Boolean));
    else arquivos.push(p);
  }
  const expostos = (await Promise.all(arquivos.map(async a => {
    const { status } = await doAr('/' + a);
    return status === 404 ? null : '/' + a + ' (' + status + ')';
  }))).filter(Boolean);
  if (expostos.length) falhas.push('no .vercelignore mas no ar: ' + expostos.join(', '));
  else oks.push(arquivos.length + ' arquivos do .vercelignore fora do ar');

  return { oks, falhas };
}

(async () => {
  const local = gitTexto('rev-parse', 'HEAD').trim();
  let remoto = '';
  try { remoto = gitTexto('rev-parse', '@{u}').trim(); } catch (e) { /* sem upstream */ }
  if (remoto && remoto !== local) {
    console.log('  FALHA  o commit ' + local.slice(0, 7) + ' ainda nao foi enviado. Rode git push antes.');
    process.exit(1);
  }

  const mudancas = mudancasDoCommit();
  console.log('conferindo ' + local.slice(0, 7) + ' no ar...');
  const inicio = Date.now();
  let r;
  for (;;) {
    r = await conferir(mudancas);
    if (!r.falhas.length || Date.now() - inicio > PRAZO_MS) break;
    console.log('  ...    aguardando: ' + r.falhas[0].slice(0, 100));
    await esperar(INTERVALO_MS);
  }

  r.oks.forEach(m => console.log('  ok     ' + m));
  r.falhas.forEach(m => console.log('  FALHA  ' + m));
  const s = Math.round((Date.now() - inicio) / 1000);
  console.log(r.falhas.length
    ? '\n' + r.falhas.length + ' falha(s) depois de ' + s + ' s. Veja o painel da Vercel: o deploy pode ter falhado.'
    : '\npublicado e conferido em ' + s + ' s.');
  process.exit(r.falhas.length ? 1 : 0);
})().catch(e => { console.log('  FALHA  ' + e.message); process.exit(1); });
