/* GERADOR DAS PAGINAS DE COMPARTILHAMENTO
   -------------------------------------------------------------------
   WhatsApp, Instagram, Facebook e LinkedIn nao executam JavaScript:
   eles leem o HTML cru que o servidor entrega. Como o site inteiro vive
   num unico index.html, todo endereco devolvia o mesmo titulo e a mesma
   imagem, e o link de um projeto chegava com a previa da home.

   Este script resolve escrevendo, para cada projeto, um arquivo proprio
   em projeto/<slug>/index.html (e en/projeto/<slug>/index.html) com o
   cabecalho certo. O corpo continua sendo o site completo, entao quem
   abre o endereco ve exatamente a mesma pagina de sempre.

   ATENCAO: estes arquivos sao copias do index.html. Toda vez que o site
   mudar, rode este script de novo antes de publicar, senao os enderecos
   de projeto passam a servir uma versao velha do site.

       node gerar-compartilhamento.js

   Com "--verificar" ele nao escreve nada e so diz se estao atualizados.   */

const fs = require('fs');
const path = require('path');

const SITE = 'https://www.estudiomabe.com.br';
const RAIZ = __dirname;
const SO_VERIFICAR = process.argv.includes('--verificar');

const fonte = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const dicionario = JSON.parse(fs.readFileSync(path.join(RAIZ, 'en.json'), 'utf8')).textos;

/* ---------------------------------------------- le os projetos do site */

function lerProjetos() {
  const bloco = fonte.match(/const trabalhos = \[([\s\S]*?)\n\];/);
  if (!bloco) throw new Error('nao achei a lista de trabalhos no index.html');
  return bloco[1].split(/\n  \{/).slice(1).map(p => {
    const campo = nome => (p.match(new RegExp(nome + ": '([^']*)'")) || [])[1];
    const primeiraFoto = (p.match(/imgs: \[\s*'([^']*)'/) || [])[1];
    return { slug: campo('slug'), titulo: campo('titulo'), servico: campo('servico'), foto: primeiraFoto };
  }).filter(p => p.slug && p.titulo);
}

/* ------------------------------------------------------- troca o cabecalho */

function escapar(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function trocarEtiqueta(html, procura, valor) {
  const re = new RegExp('(' + procura + '[^>]*content=")[^"]*(")');
  if (!re.test(html)) throw new Error('nao achei a etiqueta: ' + procura);
  return html.replace(re, '$1' + escapar(valor) + '$2');
}

function montarPagina(projeto, idioma) {
  const en = idioma === 'en';
  const titulo = (en && dicionario[projeto.titulo]) || projeto.titulo;
  const servico = (en && dicionario[projeto.servico]) || projeto.servico;
  const url = SITE + (en ? '/en' : '') + '/projeto/' + projeto.slug;
  const imagem = SITE + '/images/og/' + projeto.slug + '.jpg';
  const descricao = servico + (en
    ? '. A completed project by Estúdio MABE, authorial cabinetmaking in Rio de Janeiro.'
    : '. Projeto realizado pelo Estúdio MABE, marcenaria autoral no Rio de Janeiro.');

  let h = fonte;

  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + escapar(titulo + ' | Estúdio MABE') + '</title>');
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + url + '$2');
  h = trocarEtiqueta(h, '<meta name="description"', descricao);

  h = trocarEtiqueta(h, '<meta property="og:type"', 'article');
  h = trocarEtiqueta(h, '<meta property="og:locale"', en ? 'en_US' : 'pt_BR');
  h = trocarEtiqueta(h, '<meta property="og:url"', url);
  h = trocarEtiqueta(h, '<meta property="og:title"', titulo);
  h = trocarEtiqueta(h, '<meta property="og:description"', descricao);
  /* o espaco no fim evita casar com og:image:width e og:image:alt */
  h = trocarEtiqueta(h, '<meta property="og:image" ', imagem);
  h = trocarEtiqueta(h, '<meta property="og:image:alt"', titulo);

  h = trocarEtiqueta(h, '<meta name="twitter:title"', titulo);
  h = trocarEtiqueta(h, '<meta name="twitter:description"', descricao);
  h = trocarEtiqueta(h, '<meta name="twitter:image"', imagem);

  h = h.replace(/(<link rel="alternate" hreflang="pt-BR" id="altPt" href=")[^"]*(")/,
    '$1' + SITE + '/projeto/' + projeto.slug + '$2');
  h = h.replace(/(<link rel="alternate" hreflang="en" id="altEn" href=")[^"]*(")/,
    '$1' + SITE + '/en/projeto/' + projeto.slug + '$2');

  return h.replace('<head>', '<head>\n  <!-- Gerado por gerar-compartilhamento.js. Nao edite a mao: rode o script. -->');
}

/* --------------------------------------------------------------- escreve */

const projetos = lerProjetos();
let escritos = 0, desatualizados = 0;

for (const projeto of projetos) {
  for (const idioma of ['pt', 'en']) {
    const pasta = path.join(RAIZ, idioma === 'en' ? 'en' : '', 'projeto', projeto.slug);
    const destino = path.join(pasta, 'index.html');
    const conteudo = montarPagina(projeto, idioma);

    const atual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
    if (atual === conteudo) continue;

    if (SO_VERIFICAR) {
      desatualizados++;
      console.log('  desatualizado  ' + path.relative(RAIZ, destino).replace(/\\/g, '/'));
      continue;
    }
    fs.mkdirSync(pasta, { recursive: true });
    fs.writeFileSync(destino, conteudo);
    escritos++;
    console.log('  escrito  ' + path.relative(RAIZ, destino).replace(/\\/g, '/'));
  }
}

if (SO_VERIFICAR) {
  console.log(desatualizados
    ? '\n' + desatualizados + ' pagina(s) desatualizada(s). Rode: node gerar-compartilhamento.js'
    : '\ntudo atualizado (' + projetos.length + ' projetos).');
  process.exit(desatualizados ? 1 : 0);
}

console.log('\n' + projetos.length + ' projetos, ' + escritos + ' arquivo(s) escrito(s).');
