# Site do Estúdio MABE

www.estudiomabe.com.br. Deploy automático na Vercel a cada push em `master`, sem etapa de build.

**Este repositório é público no GitHub.** Tudo o que entra aqui pode ser lido por qualquer pessoa, mesmo o que o `.vercelignore` tira do site. Nada de credencial, dado de cliente que não esteja publicado ou documento interno.

Para publicar qualquer mudança, siga a skill `publicar` em `.claude/skills/publicar/`.

## Como o site é feito

- **Um arquivo só.** `index.html` é o site inteiro: um `<style>`, três `<script>` inline, cada página como `<div class="page">`. A navegação troca a classe `.active` e usa a History API. Não há framework nem dependência: não existe `package.json`.
- **Inglês por dicionário.** Em `/en` o site carrega `en.json`, e `traduzirArvore()` troca cada nó de texto procurando o texto **exato** do DOM em `textos`. A chave é o português. Mudar um texto no `index.html` sem mudar a chave deixa a frase em português no site em inglês.
- **Páginas geradas.** `gerar-compartilhamento.js` copia o `index.html` para cada rota (seções, `/peca/<slug>`, `/projeto/<slug>`, as versões `/en/...` e o `404.html`), trocando título, descrição, canonical, hreflang e Open Graph. Existem porque WhatsApp e redes sociais não executam JavaScript. São cópias: toda mudança em `index.html` ou `en.json` exige rodar o gerador antes do commit.
- **Rotas.** `vercel.json` não tem rewrite coringa. Arquivo estático vence; rota desconhecida cai no `404.html` com status 404 de verdade. Os cabeçalhos de segurança também estão lá, com CSP em `'unsafe-inline'` porque todo o código é inline.
- **Fora do site.** `.vercelignore` lista o que fica no repositório mas não vai ao ar: ferramentas locais (`gerar-*.js`, `gerar-cartoes.html`, `recortar-foto.html`), documentos, `.claude/` e este arquivo.
- **Cartões de compartilhamento.** `images/og/<slug>.jpg`, 1200×630, desenhados em canvas por `gerar-cartoes.html` com o servidor local `gerar-cartoes-servidor.js` (só `127.0.0.1:8801`).

## Convenções

- Sem travessão em texto do site, em nenhum dos dois idiomas.
- Texto de projeto é matéria-prima: reescrever no tom de uma marca autoral de alto valor, sem afirmar nada que a foto ou o briefing não sustentem.
- Fotos chegam no original, com 2000 px ou mais, nomeadas `trabalho-<peça>-<n>.jpg`. O recorte 4:5 e o WebP são feitos aqui, em canvas, o que também descarta EXIF e GPS.
- Telefone, endereço e voz da marca vêm do manual de marca, que fica fora do repositório.
- Toda mudança visual é conferida em 320, 375 e 1280 px antes de publicar.
- `en.json` usa recuo de **um** espaço. Nunca reserializar o arquivo inteiro.
- Commits em português, explicando o porquê.
