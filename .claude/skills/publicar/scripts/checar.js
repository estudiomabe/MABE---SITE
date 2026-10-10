/* CHECAGEM ANTES DO COMMIT
   -------------------------------------------------------------------
   Uso, da raiz do repositorio ou de qualquer lugar:
       node .claude/skills/publicar/scripts/checar.js

   Sai com codigo 1 se qualquer item falhar. Nao publique com falha.

   Cada item aqui ja quebrou o site pelo menos uma vez, em silencio:
   nao existe etapa de build na Vercel, o que entra no commit e o que o
   visitante recebe.                                                    */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

/* scripts -> publicar -> skills -> .claude -> raiz */
process.chdir(path.resolve(__dirname, '..', '..', '..', '..'));

let falhas = 0;
const ok = msg => console.log('  ok     ' + msg);
const falha = msg => { falhas++; console.log('  FALHA  ' + msg); };
const recuo = texto => String(texto).trim().split(/\r?\n/).join('\n         ');

const html = fs.readFileSync('index.html', 'utf8');

/* 1. Sintaxe de cada <script> inline. Os de src= sao de fora e os de
      type= sao dados (JSON-LD), conferidos no item 2. */
const blocos = [...html.matchAll(/<script(?![^>]*\b(?:src|type)=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!blocos.length) falha('nenhum <script> inline no index.html');
blocos.forEach((codigo, i) => {
  const arq = path.join(os.tmpdir(), 'mabe-checar-' + process.pid + '-' + i + '.js');
  fs.writeFileSync(arq, codigo);
  try {
    execFileSync(process.execPath, ['--check', arq], { stdio: 'pipe' });
    ok('script ' + (i + 1) + ' de ' + blocos.length + ': sintaxe');
  } catch (e) {
    falha('script ' + (i + 1) + ' de ' + blocos.length + ':\n         ' +
          recuo(String(e.stderr).split(/\r?\n/).slice(0, 6).join('\n')));
  } finally {
    fs.unlinkSync(arq);
  }
});

/* 2. Dados estruturados, em todas as paginas do site: um JSON-LD
      quebrado some do Google sem aviso. O bloco #ldDinamico nasce vazio
      de proposito, o JavaScript o preenche na hora, e por isso e pulado. */
function paginasDoSite(pasta = '.', achadas = []) {
  for (const nome of fs.readdirSync(pasta, { withFileTypes: true })) {
    const caminho = path.join(pasta, nome.name);
    if (nome.isDirectory()) {
      if (!['.git', '.claude', '_arquivo', 'node_modules', 'images'].includes(nome.name)) paginasDoSite(caminho, achadas);
    } else if (nome.name === 'index.html' || caminho === '404.html') {
      achadas.push(caminho.split(path.sep).join('/'));
    }
  }
  return achadas;
}
const paginas = paginasDoSite();
let blocosLd = 0, vaziosLd = 0, ruinsLd = 0;
for (const pagina of paginas) {
  const fonte = fs.readFileSync(pagina, 'utf8');
  for (const m of fonte.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!m[1].trim()) { vaziosLd++; continue; }
    blocosLd++;
    try { JSON.parse(m[1]); }
    catch (e) { ruinsLd++; falha('dados estruturados em ' + pagina + ': ' + e.message); }
  }
}
if (!ruinsLd) ok('dados estruturados: ' + blocosLd + ' blocos validos em ' + paginas.length +
                 ' paginas (' + vaziosLd + ' vazios de proposito, preenchidos pelo JavaScript)');

/* 3. Travessao: regra de escrita do site, nos dois idiomas */
const TRAVESSAO = String.fromCharCode(8212);  /* travessao */
for (const arq of ['index.html', 'en.json']) {
  const linhas = fs.readFileSync(arq, 'utf8').split(/\r?\n/);
  const onde = linhas.map((l, n) => (l.includes(TRAVESSAO) ? n + 1 : 0)).filter(Boolean);
  if (onde.length) falha(arq + ': travessao na(s) linha(s) ' + onde.join(', '));
  else ok(arq + ': sem travessao');
}

/* 4. en.json valido e com a indentacao de sempre. Reserializar com
      JSON.stringify(..., 2) passa no parse mas troca o recuo de um para
      dois espacos e transforma uma palavra num diff de 650 linhas. */
const bruto = fs.readFileSync('en.json', 'utf8');
try {
  const d = JSON.parse(bruto);
  ok('en.json: JSON valido, ' + Object.keys(d.textos || {}).length + ' textos');
} catch (e) {
  falha('en.json: ' + e.message);
}
const segunda = bruto.split(/\r?\n/)[1] || '';
if (/^ "/.test(segunda)) ok('en.json: indentacao de um espaco');
else falha('en.json: a indentacao mudou (' + JSON.stringify(segunda.slice(0, 10)) + '...). ' +
           'O arquivo foi reserializado? Desfaca e troque no texto cru, com trocar-texto.js.');

/* 5. vercel.json: um JSON quebrado aqui derruba o deploy inteiro */
try { JSON.parse(fs.readFileSync('vercel.json', 'utf8')); ok('vercel.json: JSON valido'); }
catch (e) { falha('vercel.json: ' + e.message); }

/* 6. As paginas geradas sao copias do index.html. Se ficarem para tras,
      /peca/..., /projeto/... e as secoes servem o site velho e nada
      avisa: a pagina abre normal, so desatualizada. */
try {
  const saida = execFileSync(process.execPath, ['gerar-compartilhamento.js', '--verificar'],
                             { encoding: 'utf8', stdio: 'pipe' });
  const n = (saida.match(/\((\d+) paginas\)/) || [])[1] || '?';
  ok('paginas geradas: ' + n + ' em dia com o index.html e o en.json');
} catch (e) {
  falha('paginas geradas fora de dia. Rode: node gerar-compartilhamento.js\n         ' +
        recuo(String(e.stdout || e.message).trim().split(/\r?\n/).slice(-4).join('\n')));
}

console.log(falhas ? '\n' + falhas + ' falha(s). Nao publique ainda.' : '\ntudo certo para o commit.');
process.exit(falhas ? 1 : 0);
