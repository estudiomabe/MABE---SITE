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
  return m[1].match(/\{[^{}]*\}/g) || [];
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
          ? '. A completed project by Estúdio MABE, authorial cabinetmaking in Rio de Janeiro.'
          : '. Projeto realizado pelo Estúdio MABE, marcenaria autoral no Rio de Janeiro.'),
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

  return h.replace('<head>', '<head>\n  <!-- Gerado por gerar-compartilhamento.js. Nao edite a mao: rode o script. -->');
}

/* --------------------------------------------------------------- escreve */

const paginas = [...paginasDosProjetos(), ...paginasDasPecas()];
let escritos = 0, desatualizados = 0;

for (const p of paginas) {
  const destino = path.join(RAIZ, p.pasta, 'index.html');
  const conteudo = montarPagina(p);
  const atual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : null;
  if (atual === conteudo) continue;

  const relativo = path.relative(RAIZ, destino).replace(/\\/g, '/');
  if (SO_VERIFICAR) { desatualizados++; console.log('  desatualizado  ' + relativo); continue; }

  fs.mkdirSync(path.join(RAIZ, p.pasta), { recursive: true });
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
