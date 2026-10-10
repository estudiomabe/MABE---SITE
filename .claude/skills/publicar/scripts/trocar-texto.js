/* TROCA UM TEXTO DO SITE E A TRADUCAO DELE, JUNTOS
   -------------------------------------------------------------------
   Uso:
       node .claude/skills/publicar/scripts/trocar-texto.js "texto atual" "texto novo" ["new text"] [--todas]

   No index.html, procura "texto atual" exatamente como esta escrito no
   arquivo, com &nbsp; se houver, e troca por "texto novo".

   No en.json, a chave e o texto como ele fica no DOM, porque e assim que
   traduzirArvore procura: &nbsp; vira o caractere de espaco preso. Por
   isso trocar so o HTML deixa a frase em portugues no site em ingles.

   O en.json nunca e reserializado. So a linha da chave e reescrita, no
   mesmo lugar e com o mesmo recuo, e o espaco preso e gravado como
   \u00a0 para continuar visivel no arquivo.

   - Sem o terceiro argumento, a traducao antiga e mantida, com aviso.
   - Se o texto nao tem entrada propria no dicionario mas faz parte de
     uma frase maior que tem, a chave dessa frase e atualizada e a
     traducao fica para revisar a mao.
   - Recusa travessao, e recusa trocar mais de uma ocorrencia sem --todas.

   Depois: node gerar-compartilhamento.js                               */

const fs = require('fs');
const path = require('path');

process.chdir(path.resolve(__dirname, '..', '..', '..', '..'));

const NBSP = String.fromCharCode(160);       /* espaco preso: &nbsp; no HTML */
const TRAVESSAO = String.fromCharCode(8212);  /* travessao */

/* o mesmo texto, como o navegador o entrega depois de ler o HTML */
const comoNoDom = s => s
  .replace(/&nbsp;/g, NBSP)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');

const args = process.argv.slice(2);
const todas = args.includes('--todas');
const [antes, depois, inglesComoEscrito] = args.filter(a => a !== '--todas');

if (!antes || depois === undefined) {
  console.log('uso: node trocar-texto.js "texto atual" "texto novo" ["new text"] [--todas]');
  process.exit(2);
}

/* A traducao tambem vira texto do DOM: traduzirArvore a grava em
   nodeValue, que nao interpreta entidade. "Solid&nbsp;Wood" passado
   cru apareceria na tela com o "&nbsp;" escrito. */
const ingles = inglesComoEscrito === undefined ? undefined : comoNoDom(inglesComoEscrito);

/* string JSON com o espaco preso escrito por extenso */
const comoNoJson = s => JSON.stringify(s).split(NBSP).join('\\u00a0');

for (const t of [depois, ingles]) {
  if (t && t.includes(TRAVESSAO)) {
    console.log('recusado: travessao em ' + JSON.stringify(t) + '. O site nao usa travessao.');
    process.exit(1);
  }
}

/* ------------------------------------------------------------ index.html */
const html = fs.readFileSync('index.html', 'utf8');
const vezes = html.split(antes).length - 1;
if (!vezes) {
  console.log('nao achei no index.html: ' + JSON.stringify(antes));
  console.log('o texto tem de estar como no arquivo, com &nbsp; onde houver.');
  process.exit(1);
}
if (vezes > 1 && !todas) {
  console.log('aparece ' + vezes + ' vezes no index.html. Passe um trecho maior, ou --todas para trocar todas.');
  process.exit(1);
}
fs.writeFileSync('index.html', html.split(antes).join(depois));
console.log('  ok     index.html: ' + vezes + ' ocorrencia(s)');

/* --------------------------------------------------------------- en.json */
const bruto = fs.readFileSync('en.json', 'utf8');
const fimDeLinha = bruto.includes('\r\n') ? '\r\n' : '\n';
const linhas = bruto.split(fimDeLinha);
const ENTRADA = /^(\s*)("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*")(,?)\s*$/;

const chaveAntes = comoNoDom(antes);
const chaveDepois = comoNoDom(depois);

const entradas = [];
linhas.forEach((linha, i) => {
  const m = linha.match(ENTRADA);
  if (m) entradas.push({ i, recuo: m[1], chave: JSON.parse(m[2]), valor: JSON.parse(m[3]), virgula: m[4] });
});

/* Uma frase do dicionario so conta como "a frase maior" se ela estava de
   fato no index.html antes da troca. Sem isso, trocar uma palavra curta
   renomearia chaves de frases que nao tem nada a ver com a mudanca. */
const estavaNoHtml = chave => html.includes(chave) || html.includes(chave.split(NBSP).join('&nbsp;'));

const exata = entradas.find(e => e.chave === chaveAntes);
const parciais = exata ? [] : entradas.filter(e => e.chave.includes(chaveAntes) && estavaNoHtml(e.chave));
const avisos = [];

if (exata) {
  const valor = ingles !== undefined ? ingles : exata.valor;
  linhas[exata.i] = exata.recuo + comoNoJson(chaveDepois) + ': ' + comoNoJson(valor) + exata.virgula;
  console.log('  ok     en.json linha ' + (exata.i + 1) + ': chave atualizada' +
              (ingles !== undefined ? ', traducao nova' : ''));
  if (ingles === undefined) avisos.push('traducao mantida, confira se ainda serve: ' + JSON.stringify(valor));

} else if (parciais.length) {
  /* o texto e um pedaco de uma frase do dicionario: a chave inteira tem
     de acompanhar o HTML, senao a frase toda deixa de ser traduzida */
  parciais.forEach(e => {
    linhas[e.i] = e.recuo + comoNoJson(e.chave.split(chaveAntes).join(chaveDepois)) + ': ' + comoNoJson(e.valor) + e.virgula;
    console.log('  ok     en.json linha ' + (e.i + 1) + ': chave da frase maior atualizada');
    avisos.push('so o portugues mudou nesta frase, revise o ingles a mao: ' + JSON.stringify(e.valor));
  });
  if (ingles !== undefined) avisos.push('a traducao passada foi ignorada: o texto e parte de uma frase maior.');

} else if (ingles !== undefined) {
  /* entrada nova, logo no comeco de "textos", com o recuo das vizinhas */
  const abre = linhas.findIndex(l => /^\s*"textos"\s*:\s*\{\s*$/.test(l));
  if (abre < 0) { console.log('nao achei "textos" no en.json; nada gravado nele.'); process.exit(1); }
  const vizinha = entradas.find(e => e.i > abre);
  const recuo = vizinha ? vizinha.recuo : '  ';
  linhas.splice(abre + 1, 0, recuo + comoNoJson(chaveDepois) + ': ' + comoNoJson(ingles) + ',');
  console.log('  ok     en.json linha ' + (abre + 2) + ': entrada nova');

} else {
  /* o texto antigo ja saiu do HTML: para acrescentar a traducao, o
     "texto atual" agora e o novo, repetido */
  avisos.push('esse texto nao tem traducao no en.json: no site em ingles ele aparece em portugues. ' +
              'Para acrescentar:\n         node .claude/skills/publicar/scripts/trocar-texto.js ' +
              JSON.stringify(depois) + ' ' + JSON.stringify(depois) + ' "traducao"');
}

const novo = linhas.join(fimDeLinha);
try { JSON.parse(novo); }
catch (e) { console.log('o en.json ficaria invalido (' + e.message + '); nada gravado nele.'); process.exit(1); }
if (novo !== bruto) fs.writeFileSync('en.json', novo);

avisos.forEach(a => console.log('  aviso  ' + a));
console.log('\nagora: node gerar-compartilhamento.js');
