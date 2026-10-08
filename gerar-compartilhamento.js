/* GERADOR DAS PAGINAS DE COMPARTILHAMENTO
   -------------------------------------------------------------------
   WhatsApp, Instagram, Facebook e LinkedIn nao executam JavaScript:
   eles leem o HTML cru que o servidor entrega. Como o site inteiro vive
   num unico index.html, todo endereco devolvia o mesmo titulo e a mesma
   imagem, e o link de um projeto ou de uma peca chegava com a previa da
   home.

   Este script resolve escrevendo, para cada projeto e cada peca, um
   arquivo proprio com o cabecalho certo:

       projeto/<slug>/index.html      en/projeto/<slug>/index.html
       peca/<slug>/index.html         en/peca/<slug>/index.html

   O corpo continua sendo o site completo, entao quem abre o endereco ve
   exatamente a mesma pagina de sempre.

   ATENCAO: estes arquivos sao copias do index.html. Toda vez que o site
   mudar, rode este script de novo antes de publicar, senao esses
   enderecos passam a servir uma versao velha do site.

       node gerar-compartilhamento.js

   Com "--verificar" ele nao escreve nada e so diz se estao atualizados.   */

const fs = require('fs');
const path = require('path');

const SITE = 'https://www.estudiomabe.com.br';
const RAIZ = __dirname;
const SO_VERIFICAR = process.argv.includes('--verificar');

const fonte = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const dicionario = JSON.parse(fs.readFileSync(path.join(RAIZ, 'en.json'), 'utf8')).textos;

/* ------------------------------------------------- leitura dos dados */

/* Cada item do site e um objeto simples, sem chaves aninhadas. */
function objetosDe(nome) {
  /* lista vazia escrita numa linha so, como "const decors = [];": sem este
     desvio a busca seguia ate o "];" da lista seguinte e trazia os itens dela */
  if (new RegExp('const ' + nome + ' = \\[\\s*\\];').test(fonte)) return [];
  const m = fonte.match(new RegExp('const ' + nome + ' = \\[([\\s\\S]*?)\\n\\];'));
  if (!m) throw new Error('nao achei a lista "' + nome + '" no index.html');
  return separarObjetos(m[1]);
}

/* Separa os objetos de primeiro nivel contando chaves. Um item pode ter
   outro objeto dentro, como a ficha tecnica de um projeto, e por isso nao
   da para separar so por expressao regular. Texto entre aspas e ignorado,
   para uma chave escrita numa descricao nao atrapalhar a contagem. */
function separarObjetos(texto) {
  const saida = [];
  let profundidade = 0, inicio = -1, aspas = null;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) { if (c === aspas && texto[i - 1] !== '\\') aspas = null; continue; }
    if (c === "'" || c === '"' || c === '`') { aspas = c; continue; }
    if (c === '{') { if (profundidade === 0) inicio = i; profundidade++; }
    else if (c === '}') {
      profundidade--;
      if (profundidade === 0 && inicio >= 0) { saida.push(texto.slice(inicio, i + 1)); inicio = -1; }
    }
  }
  return saida;
}


const campo = (txt, nome) => (txt.match(new RegExp(nome + ":\\s*'([^']*)'")) || [])[1];
const numero = (txt, nome) => {
  const v = (txt.match(new RegExp(nome + ':\\s*(\\d+)')) || [])[1];
  return v === undefined ? null : Number(v);
};
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const preco = v => 'R$ ' + v.toLocaleString('pt-BR');
const en = (texto) => dicionario[texto] || texto;

/* ------------------------------------------------ as paginas a escrever */

/* A pagina de erro, em 404.html na raiz.

   A Vercel serve este arquivo com status 404 de verdade para todo endereco
   que nao casa com nada. Antes, a reescrita curinga mandava qualquer
   endereco para o index.html, entao /pagina-inventada devolvia 200 com a
   tela de erro: para o buscador, um soft 404, que convida a indexar lixo.

   Para isto funcionar as reescritas curinga saem do vercel.json. Quem
   garante as rotas de verdade sao os arquivos estaticos deste gerador, e
   e por isso que rodar "--verificar" antes de publicar deixou de ser
   higiene e passou a ser obrigatorio. */

function paginaDeErro() {
  return {
    pasta: '',
    arquivo: '404.html',
    url: SITE + '/404',
    titulo: 'Página não encontrada | Estúdio MABE',
    tituloSocial: 'Página não encontrada | Estúdio MABE',
    descricao: 'O endereço que você procurou não existe mais ou foi digitado com algum engano. O mobiliário e os projetos continuam no site.',
    imagem: SITE + '/images/og/home.jpg',
    tipo: 'website',
    locale: 'pt_BR',
    altPt: SITE + '/',
    altEn: SITE + '/en',
    semIndexacao: true
  };
}

/* As paginas de secao: Mobiliario, Sobre, Contato e as outras.

   Elas nunca entraram neste gerador, entao quem nao executa JavaScript
   recebia nas 19 o titulo, a descricao e o canonical da home. Canonical
   e instrucao, nao dica: dizia ao buscador que todas eram copia da
   inicial. E o og:title, que o JavaScript nunca corrige, fazia qualquer
   uma delas chegar no WhatsApp com a previa da home.

   A home em portugues fica de fora: ela e o proprio index.html. */

function paginasDasSecoes() {
  const bloco = fonte.slice(fonte.indexOf('const ROTAS = {'), fonte.indexOf('const ROTAS_EN'));
  const pt = {};
  for (const m of bloco.matchAll(/(\w+):\s*\{\s*url:\s*'([^']+)',\s*titulo:\s*'([^']*)',\s*\n?\s*desc:\s*'([^']*)'/g))
    pt[m[1]] = { url: m[2], titulo: m[3], desc: m[4] };

  const blocoEn = fonte.slice(fonte.indexOf('const ROTAS_EN'), fonte.indexOf('};', fonte.indexOf('const ROTAS_EN')));
  const urlEn = {};
  for (const m of blocoEn.matchAll(/(\w+):\s*'([^']+)'/g)) urlEn[m[1]] = m[2];

  const rotasEn = JSON.parse(fs.readFileSync(path.join(RAIZ, 'en.json'), 'utf8')).rotas || {};

  if (!Object.keys(pt).length) throw new Error('nao li a tabela ROTAS do index.html');

  const saida = [];
  for (const [id, r] of Object.entries(pt)) {
    const parEn = urlEn[id];
    if (!parEn) throw new Error('a rota "' + id + '" nao tem equivalente em ingles');
    const textoEn = rotasEn[id];
    if (!textoEn) throw new Error('a rota "' + id + '" nao esta no en.json');

    /* Itens Decorativos sem nenhuma peca nao pede indexacao, nem no HTML
       cru: 51 palavras e um aviso de "em breve" nao sustentam um endereco
       no indice. Sai do dado, entao volta sozinha quando a lista encher. */
    const vazia = id === 'decorativos' && objetosDe('decors').length === 0;

    /* a home em portugues ja e o index.html; as demais ganham pasta propria */
    if (r.url !== '/') saida.push({
      pasta: r.url.replace(/^\//, ''),
      url: SITE + r.url,
      titulo: r.titulo,
      tituloSocial: r.titulo,
      descricao: r.desc,
      imagem: SITE + '/images/og/home.jpg',
      tipo: 'website',
      locale: 'pt_BR',
      altPt: SITE + r.url,
      altEn: SITE + parEn,
      semIndexacao: vazia
    });

    saida.push({
      pasta: parEn.replace(/^\//, ''),
      url: SITE + parEn,
      titulo: textoEn.titulo,
      tituloSocial: textoEn.titulo,
      descricao: textoEn.desc,
      imagem: SITE + '/images/og/home.jpg',
      tipo: 'website',
      locale: 'en_US',
      altPt: SITE + r.url,
      altEn: SITE + parEn,
      semIndexacao: vazia
    });
  }
  return saida;
}

function paginasDosProjetos() {
  const saida = [];
  for (const t of objetosDe('trabalhos')) {
    const slug = campo(t, 'slug'), titulo = campo(t, 'titulo'), servico = campo(t, 'servico');
    if (!slug || !titulo) continue;
    for (const idioma of ['pt', 'en']) {
      const ehEn = idioma === 'en';
      const nome = ehEn ? en(titulo) : titulo;
      const linha = ehEn ? en(servico) : servico;
      saida.push({
        pasta: path.join(ehEn ? 'en' : '', 'projeto', slug),
        url: SITE + (ehEn ? '/en' : '') + '/projeto/' + slug,
        titulo: nome + ' | Estúdio MABE',
        tituloSocial: nome,
        descricao: linha + (ehEn
          ? '. A completed project by Estúdio MABE, solid wood furniture in Rio de Janeiro.'
          : '. Projeto realizado pelo Estúdio MABE, mobiliário em madeira maciça no Rio de Janeiro.'),
        imagem: SITE + '/images/og/' + slug + '.jpg',
        tipo: 'article',
        locale: ehEn ? 'en_US' : 'pt_BR',
        altPt: SITE + '/projeto/' + slug,
        altEn: SITE + '/en/projeto/' + slug
      });
    }
  }
  return saida;
}

function paginasDasPecas() {
  const listas = [['products', 'Mobiliário'], ['decors', 'Itens Decorativos'], ['petProducts', 'Linha Pet']];
  const saida = [];
  for (const [lista, secao] of listas) {
    for (const p of objetosDe(lista)) {
      const nome = campo(p, 'name');
      if (!nome) continue;
      const slug = semAcento(nome);
      const detalhe = campo(p, 'mat') || campo(p, 'desc') || '';
      const valor = numero(p, 'price');
      for (const idioma of ['pt', 'en']) {
        const ehEn = idioma === 'en';
        const nomeI = ehEn ? en(nome) : nome;
        const secaoI = ehEn ? en(secao) : secao;
        const detalheI = ehEn ? en(detalhe) : detalhe;
        saida.push({
          pasta: path.join(ehEn ? 'en' : '', 'peca', slug),
          url: SITE + (ehEn ? '/en' : '') + '/peca/' + slug,
          titulo: nomeI + ': ' + secaoI + (ehEn ? ' in solid wood' : ' em madeira maciça') + ' | Estúdio MABE',
          tituloSocial: nomeI,
          descricao: nomeI + ': ' + detalheI + (ehEn
            ? '. An authorial piece by Estúdio MABE, made to order in certified solid wood.'
            : '. Peça autoral do Estúdio MABE, feita sob encomenda em madeira maciça certificada.')
            + (valor ? ' ' + preco(valor) + '.' : ''),
          imagem: SITE + '/images/og/peca-' + slug + '.jpg',
          tipo: 'product',
          locale: ehEn ? 'en_US' : 'pt_BR',
          altPt: SITE + '/peca/' + slug,
          altEn: SITE + '/en/peca/' + slug
        });
      }
    }
  }
  return saida;
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

function montarPagina(p) {
  let h = fonte;
  h = h.replace(/<title>[^<]*<\/title>/, '<title>' + escapar(p.titulo) + '</title>');
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, '$1' + p.url + '$2');
  h = trocarEtiqueta(h, '<meta name="description"', p.descricao);

  h = trocarEtiqueta(h, '<meta property="og:type"', p.tipo);
  h = trocarEtiqueta(h, '<meta property="og:locale"', p.locale);
  h = trocarEtiqueta(h, '<meta property="og:url"', p.url);
  h = trocarEtiqueta(h, '<meta property="og:title"', p.tituloSocial);
  h = trocarEtiqueta(h, '<meta property="og:description"', p.descricao);
  /* o espaco no fim evita casar com og:image:width e og:image:alt */
  h = trocarEtiqueta(h, '<meta property="og:image" ', p.imagem);
  h = trocarEtiqueta(h, '<meta property="og:image:alt"', p.tituloSocial);

  h = trocarEtiqueta(h, '<meta name="twitter:title"', p.tituloSocial);
  h = trocarEtiqueta(h, '<meta name="twitter:description"', p.descricao);
  h = trocarEtiqueta(h, '<meta name="twitter:image"', p.imagem);

  h = h.replace(/(<link rel="alternate" hreflang="pt-BR" id="altPt" href=")[^"]*(")/, '$1' + p.altPt + '$2');
  h = h.replace(/(<link rel="alternate" hreflang="en" id="altEn" href=")[^"]*(")/, '$1' + p.altEn + '$2');

  /* portugues e a versao padrao para quem nao casa com nenhum idioma. Antes
     isto estava preso na home, e dizia ao buscador que a versao padrao de
     qualquer pagina do site era a inicial. */
  /* o teste e se a etiqueta existe, nao se o texto mudou: na pagina /en o
     valor novo e igual ao que ja estava la, e comparar strings acusava
     falha onde nao havia */
  const reDefault = /(<link rel="alternate" hreflang="x-default" id="altDefault" href=")[^"]*(")/;
  if (!reDefault.test(h)) throw new Error('nao achei o x-default com id="altDefault"');
  h = h.replace(reDefault, '$1' + p.altPt + '$2');

  /* o seletor de idioma e um link de verdade: aponta para a outra lingua
     desta pagina, para o robo ter o que seguir sem executar JavaScript */
  const reSeletor = /(<a class="nav-idioma" href=")[^"]*(")/;
  if (!reSeletor.test(h)) throw new Error('nao achei o seletor de idioma');
  /* relativo, pelo mesmo motivo do index.html: um preview nao deve pular
     para o dominio de producao ao trocar de idioma */
  const outro = (p.locale === 'en_US' ? p.altPt : p.altEn).replace(SITE, '');
  h = h.replace(reSeletor, '$1' + outro + '$2');

  /* a pagina de erro nao pode convidar o buscador a indexar; o JavaScript
     tambem faz isso ao abrir, mas o robo que nao executa precisa ler no HTML */
  if (p.semIndexacao) {
    const reRobots = /(<meta name="robots" id="metaRobots" content=")[^"]*(")/;
    if (!reRobots.test(h)) throw new Error('nao achei a etiqueta robots');
    h = h.replace(reRobots, '$1noindex, follow$2');
  }

  return h.replace('<head>', '<head>\n  <!-- Gerado por gerar-compartilhamento.js. Nao edite a mao: rode o script. -->');
}

/* --------------------------------------------------------------- escreve */

const paginas = [paginaDeErro(), ...paginasDasSecoes(), ...paginasDosProjetos(), ...paginasDasPecas()];
let escritos = 0, desatualizados = 0;

for (const p of paginas) {
  const destino = path.join(RAIZ, p.pasta, p.arquivo || 'index.html');
  const conteudo = montarPagina(p);
  const atual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
  if (atual === conteudo) continue;

  const relativo = path.relative(RAIZ, destino).replace(/\\/g, '/');
  if (SO_VERIFICAR) { desatualizados++; console.log('  desatualizado  ' + relativo); continue; }

  if (p.pasta) fs.mkdirSync(path.join(RAIZ, p.pasta), { recursive: true });
  fs.writeFileSync(destino, conteudo);
  escritos++;
  console.log('  escrito  ' + relativo);
}

/* avisa se algum cartao esta faltando */
const faltando = paginas
  .map(p => p.imagem.replace(SITE + '/', ''))
  .filter((v, i, a) => a.indexOf(v) === i)
  .filter(rel => !fs.existsSync(path.join(RAIZ, rel)));
if (faltando.length) {
  console.log('\nATENCAO: cartao nao encontrado para:');
  faltando.forEach(f => console.log('  ' + f));
}

if (SO_VERIFICAR) {
  console.log(desatualizados
    ? '\n' + desatualizados + ' pagina(s) desatualizada(s). Rode: node gerar-compartilhamento.js'
    : '\ntudo atualizado (' + paginas.length + ' paginas).');
  process.exit(desatualizados || faltando.length ? 1 : 0);
}

console.log('\n' + paginas.length + ' paginas, ' + escritos + ' arquivo(s) escrito(s).');
