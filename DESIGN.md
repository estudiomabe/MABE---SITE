# DESIGN.md · Estúdio MABE

As regras visuais do site, escritas para serem seguidas por quem mexe no código, pessoa ou IA. Leia antes de qualquer mudança visual.

**De onde vem.** Tudo aqui sai do manual de marca (2ª edição, outubro de 2026), que fica fora do repositório. Quando os dois discordarem, o manual vence, e este arquivo é corrigido. As poucas regras que não vêm do manual estão marcadas como **[site]**, com o motivo.

**Como ler o estado de cada regra.**
- **[vale]**: o site já cumpre. Não quebre.
- **[pendente]**: é a regra, mas o site ainda não cumpre. Já foi decidido e espera a vez.
- **[a decidir]**: depende de decisão do Mateus. Não aplique por conta própria.

Mudanças neste arquivo passam pela aprovação do Mateus, como qualquer mudança no site.

---

## 1. O princípio

> Na dúvida, o mais simples está certo. (manual, p. 2)

Sistema pequeno de propósito: duas fontes, cinco cores, uma grade. Quando algo não estiver previsto aqui, a resposta quase sempre é usar menos.

**Ousadia num lugar só.** Cada página tem no máximo um elemento memorável, e tudo em volta fica quieto. Antes de acrescentar um efeito, pergunte o que ele diz sobre a peça. Se não diz nada, ele sai. **[site]**

---

## 2. Cores

Cinco cores de marca, e nada além delas. As de apoio existem só para a leitura funcionar.

| Papel | Valor | Variável | Onde entra | Estado |
|---|---|---|---|---|
| Banda | `#E8E6E1` | `--bg` | fundo do site inteiro. "É a cor do site." | **[vale]** |
| Texto | `#000000` | `--ink` | títulos, números de total, botão principal | **[pendente]** hoje `#111110` |
| Corpo | `#2B2925` | `--ink-soft` | corpo de texto | **[vale]** (`#2a2926`, diferença imperceptível) |
| Rótulo | `#5E5B57` | `--muted` | rótulos em caixa alta, legendas, metadados | **[vale]**, ver nota |
| Filete | `#C8A96E` | `--gold` | só fio: separador, fio sob título, marcador | **[pendente]** hoje `#b89a58` |
| Borda | `#D5D1C8` | `--border` | bordas e divisórias | **[pendente]** hoje `#c8c5be` |
| Linha interna | `#EBE8E2` | `--linha` (nova) | linhas internas de tabela | **[pendente]**. A `--gold-lt` atual não é usada e sai |
| Papel | `#FFFFFF` | | nunca como bloco no site; é cor de impresso | **[vale]** |

**Nota sobre o rótulo.** O manual pede `#8A857B`. Sobre o fundo do site ele dá contraste de 2,9:1, abaixo do mínimo de 4,5:1, e a seção de acessibilidade do próprio manual exige contraste. O site usa `#5E5B57`, da mesma família, que passa. **[site]**

**Cor de erro.** `--erro` (`#9A3F2B`) é infraestrutura, como os cinzas de apoio. Só em mensagem de erro de formulário.

### A regra do dourado

> O dourado separa, nunca decora. (manual, p. 6)

- Só como **fio** de 1 px. Nunca fundo, nunca texto, nunca ícone cheio, nunca gradiente.
- **No máximo duas vezes por página.**
- Nunca carrega informação sozinho. Se um dado depende do dourado, falta um rótulo.
- O contorno de foco do teclado em dourado é permitido: é um fio, e ajuda a navegação.

**[pendente]** Cerca de 25 rótulos usam `--gold-texto` como cor de texto, e há fundo dourado no contador do carrinho, nos selos do SketchUp, no hover do aviso de cookies e no ponto ativo dos projetos. Tudo isso passa para `--muted` ou para tinta. A variável `--gold-texto` deixa de existir.

**[a decidir]** O desenho da poltrona em Para Arquitetos é um desenho inteiro em dourado.

### Modo escuro **[site]**

O manual não cobre modo escuro. O site tem um, com tokens próprios em `html[data-tema="escuro"]`. Valem as mesmas regras de uso: dourado só como fio, corpo com contraste de pelo menos 4,5:1. Toda cor nova precisa da versão escura junto.

---

## 3. Tipografia

> Duas fontes, nenhuma terceira. (manual, p. 7)

| Papel | Fonte | Peso | Entreletra | Estado |
|---|---|---|---|---|
| Display (título de página) | Poppins | ExtraLight 200 | −0,02em | **[pendente]** hoje Cormorant Garamond |
| Seção (título de bloco) | Poppins | Light 300 | −0,01em | **[pendente]** hoje Cormorant Garamond |
| Corpo | Inter | Light 300 / Regular 400 | normal | **[vale]** |
| Rótulo | Inter | Medium 500, caixa alta | +0,20em | **[vale]** (hoje varia de 0,16 a 0,24em; padronizar em 0,20) |
| Botão | Inter | Medium 500, caixa alta | +0,16em | **[vale]** |

- **Corpo mínimo de 14 px em tela.** Abaixo disso, reescreva mais curto em vez de diminuir. **[pendente]**: 62 blocos estão abaixo. Rótulos em caixa alta e controles (menu, PT/EN, contador) ficam de fora.
- **Linha de até 70 caracteres** no texto corrido. As páginas institucionais já usam `max-width: 68ch`. **[site]** **[vale]**
- **Poppins só em título, seção e número de total.** Inter em todo o resto, sem exceção.
- **Sem palavra em destaque no título.** Nada de itálico ou cor diferente em uma palavra só: o título inteiro tem o mesmo estilo. O `<em>` continua no HTML dos três títulos que o tinham, porque o dicionário guarda as duas metades como frases separadas. **[vale]** desde 12/10/2026.

A troca de Cormorant para Poppins foi testada em prévia e adiada pelo Mateus. Quando for feita, tipografia, dourado e 14 px vão juntos: um sem o outro fica desencontrado.

---

## 4. Logo

- **Nunca recriar o logo em outra fonte**, nem mudar a proporção entre bloco, palavra e ponto. **[vale]**
- **Nunca em dourado, com sombra, contorno ou relevo.** **[vale]**
- **Respiro**: no mínimo a altura do bloco em todos os lados.
- **Tamanho mínimo em tela: 90 px de largura.** Abaixo disso o "estúdio" some. O logo do menu tem 137 px no celular. **[vale]**
- **Ícones** (aba, iPhone, logo para o Google) usam o logo inteiro, em negativo, até existir o monograma. **[vale]** Em 16 px ele não se lê, e isso está previsto no manual.
- Arquivos oficiais na pasta ID VISUAL MABE, fora do repositório. Gere sempre a partir deles.

---

## 5. Layout e componentes

- **Cantos retos.** Sem `border-radius`, exceto em círculo de verdade: avatar, contador do carrinho, botão do WhatsApp. **[vale]**
- **Sombra só onde algo flutua de verdade**: menu fixo ao rolar, submenu, aviso de cookies, botão do WhatsApp. Nunca como decoração em cartão. **[vale]**
- **Botões.** Principal: fundo `--ink`, texto `--bg`. Secundário: transparente com borda `--border`. Os dois com o mesmo tamanho e a mesma tipografia. O texto do botão diz o que acontece: "Conversar sobre estas peças", não "Enviar". **[vale]**
- **Pontos de quebra**: 900 px e 600 px. Toda mudança visual é conferida em **320, 375 e 1280 px**, sem rolagem lateral.
- **Numeração 01, 02, 03 só para sequência real**, como etapas de um processo. **[site]** **[vale]**: os benefícios de Para Arquitetos deixaram de ser numerados em 12/10/2026.
- **Alvo de toque de 44 px** no celular.

---

## 6. Fotografia

> É o que mais move percepção de alto padrão, mais que o logo, mais que os documentos. (manual, p. 9)

- **Luz** de janela, lateral, a 70º–90º do eixo da câmera. Madeira só mostra veio em luz rasante.
- **Fundo** liso e claro. Sem quadro, tomada, rodapé escuro ou planta.
- **A peça ocupa 60 a 70% do quadro**, mesmo na casa do cliente.
- **Toda peça tem um macro do encaixe.** É a foto que prova o preço.
- **Sombra é estrutura.** Não abrir até sumir.
- **No site**: recorte 4:5, WebP, feito aqui em canvas, o que também descarta EXIF e GPS. O original chega com 2000 px ou mais, nomeado `trabalho-<peça>-<n>.jpg`.
- **Texto alternativo** descreve a peça, a espécie e o momento ("Rack suspenso em peroba do campo, com a mão abrindo a porta sem puxador"), não "foto 1".
- **Nunca** imagem gerada ou editada por IA apresentada como obra real.

---

## 7. Vídeo e movimento **[site]**

O manual ainda não tem padrão de vídeo. Até ter, vale isto:

- **Um momento de movimento por página.** Uma entrada orquestrada vale mais que efeitos espalhados. Movimento que responde a uma ação (abrir, expandir, confirmar) é bem-vindo.
- **Quem pede menos movimento vê a imagem parada.** O site já respeita `prefers-reduced-motion` em 14 pontos. **[vale]** Todo movimento novo faz o mesmo.
- **Vídeo**: hospedado no próprio site (a política de segurança só aceita arquivos do próprio domínio), sem som, com `playsinline`, imagem de capa para enquanto carrega, e versão própria para celular.
- **A filmagem segue as regras da fotografia**: luz lateral, câmera fixa, parede lisa.
- **Nada de efeito tecnológico**: partícula, brilho, distorção, gradiente animado. A madeira é o espetáculo.

---

## 8. Texto na interface

- **"Estúdio MABE"** na primeira menção, com acento. Depois **"MABE"**, sempre em caixa alta, com artigo feminino: "a MABE". Caixa baixa só dentro do logo. **[vale]**
- **Nunca**: Mabe, M.A.B.E., Estudio sem acento, MABE Marcenaria, MABE Móveis. **[vale]**
- **Somos um estúdio**, não uma marcenaria, fábrica ou loja.
- **Evitamos**: produto, planejados, acabamento premium, exclusivo, sofisticado, "transforme seu lar", "o móvel dos seus sonhos", emoji. Usamos: peça, encomenda, encaixe, espécie, madeira maciça, ateliê, projeto, sob medida. **[vale]**
- **Sem travessão**, nos dois idiomas. **[vale]**
- **O teste da frase**: se serviria para qualquer marcenaria, reescreva. A frase só é da MABE quando cita uma peça, uma espécie ou uma decisão de projeto.
- **Nome e endereço de cliente** só com autorização escrita. **[a decidir]**: sete títulos de projeto ainda citam nomes.
- **Inglês**: todo texto novo entra no `en.json` junto. A chave é o texto exato do DOM.

---

## 9. Acessibilidade

- Contraste de pelo menos **4,5:1** para texto, nos dois temas.
- Corpo de no mínimo **14 px** em tela.
- **Foco visível** no teclado em todo elemento clicável.
- Cor nunca carrega informação sozinha.
- Movimento reduzido respeitado.

---

## 10. Pendências em um lugar só

| Item | Estado | Onde está a regra |
|---|---|---|
| Cormorant → Poppins nos títulos | **[pendente]**, adiado | 3 |
| Dourado só como fio (25 rótulos, 5 fundos) | **[pendente]**, adiado | 2 |
| Corpo mínimo de 14 px (62 blocos) | **[pendente]**, adiado | 3 |
| Tokens `--ink`, `--gold`, `--border`, linha interna | **[pendente]** | 2 |
| Entreletra dos rótulos em 0,20em | **[pendente]** | 3 |
| Desenho da poltrona em dourado | **[a decidir]** | 2 |
| Nomes de clientes nos projetos | **[a decidir]** | 8 |
