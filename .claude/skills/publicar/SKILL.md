---
name: publicar
description: Sequencia para publicar qualquer alteracao no site do Estudio MABE (index.html, en.json, imagens, vercel.json) com checagem antes do commit e conferencia no ar depois do push. Use sempre que for fazer commit e push neste repositorio, e para trocar um texto do site junto com a traducao em ingles.
---

# Publicar uma alteração no site

Cada push em `master` vai ao ar sozinho em menos de um minuto. Não existe etapa de build que pegue erro: o que entra no commit é o que o visitante recebe. Cada passo abaixo já falhou pelo menos uma vez, quase sempre em silêncio.

Só publique o que o Mateus pediu ou aprovou.

## 1. Trocar texto

Para mudar uma frase, use o script. Ele troca no `index.html` e no `en.json` ao mesmo tempo:

```bash
node .claude/skills/publicar/scripts/trocar-texto.js "texto atual" "texto novo" "new text"
```

- O primeiro argumento é o texto **como está no arquivo**, com `&nbsp;` onde houver.
- O terceiro é a tradução, também com `&nbsp;` onde um termo não pode quebrar. Sem ele, a tradução antiga fica e o script avisa.
- Se o texto é parte de uma frase maior do dicionário, a chave da frase é atualizada e a tradução dela fica para revisar à mão.
- Recusa travessão. Recusa texto que aparece mais de uma vez, a não ser com `--todas`.

Por que não editar o `en.json` direto:

- **A chave do dicionário é o texto exato do DOM.** `traduzirArvore()` procura o nó de texto inteiro em `textos`. Mudou o português no HTML e não mudou a chave, a frase aparece em português no site em inglês, sem erro nenhum.
- **`&nbsp;` no HTML vira outro caractere no DOM.** A chave precisa ter o mesmo espaço preso, escrito `\u00a0` no `en.json`. É assim que a assinatura da home não quebra linha no meio de "madeira maciça".
- **O arquivo usa recuo de um espaço.** `JSON.parse` seguido de `JSON.stringify(..., 2)` reformata tudo: uma palavra vira um diff de 650 linhas. O script reescreve só a linha da chave.

Barra invertida não chega inteira ao arquivo. Num heredoc de shell, `'\n'` já chegou como quebra de linha real dentro de aspas e quebrou o JavaScript. E mesmo pela ferramenta de escrita, `\u` seguido de quatro dígitos chega convertido no próprio caractere: o espaço preso vira um caractere invisível no código. Em código, monte caractere especial com `String.fromCharCode(...)`: 160 para o espaço preso, 8212 para o travessão, 92 para a própria barra. Depois de escrever, procure o caractere literal no arquivo antes de confiar.

## 2. Regerar as páginas

```bash
node gerar-compartilhamento.js
```

Obrigatório sempre que `index.html` ou `en.json` mudar. As 42 páginas em `mobiliario/`, `peca/`, `projeto/`, `en/` e o `404.html` são cópias inteiras do `index.html`. Esquecer este passo faz essas rotas servirem o site antigo, e a página abre normal.

## 3. Checar

```bash
node .claude/skills/publicar/scripts/checar.js
```

Sintaxe dos scripts inline, JSON-LD, travessões, `en.json` válido e com o recuo certo, `vercel.json`, e as páginas geradas em dia. Não siga com falha.

## 4. Ver no navegador

Suba o preview `mabe-site` (de `.claude/launch.json`) e confira em **320, 375 e 1280 px**: sem rolagem lateral, nada cortado, nos dois idiomas quando um texto mudou.

Se mexeu em formulário, carrinho, link ou rota, **exercite**: preencha, clique, leia a URL que sai. Para o WhatsApp, intercepte `window.open` e leia o parâmetro `text`, sem enviar nada. Ler o código não é teste.

## 5. Commit e push

`git add -A` leva as páginas geradas junto. Mensagem em português, dizendo o que mudou e por quê.

## 6. Conferir no ar

```bash
node .claude/skills/publicar/scripts/no-ar.js
```

Espera o deploy até o `index.html` e o `en.json` do ar ficarem idênticos ao commit. Depois exige cada URL do `sitemap.xml` em 200 e idêntica ao arquivo dela, 404 numa rota inexistente, e nenhum arquivo do `.vercelignore` acessível. Só diga que está publicado depois que ele passar.
