# Prompts Higgsfield — Estúdio MABE

Prompts prontos para gerar os vídeos do site em [higgsfield.ai](https://higgsfield.ai).
Os prompts estão em inglês (os modelos de vídeo respondem melhor), com a explicação em português.

**Identidade a preservar em todos os vídeos:**
- Madeira maciça brasileira (freijó, tauari, ipê) — veios visíveis, tom mel/âmbar
- Luz natural quente e lateral, sombras suaves, atmosfera de ateliê
- Paleta neutra: off-white `#e8e6e1`, tons de madeira, preto `#111110`, toque dourado discreto
- Movimento de câmera LENTO e contemplativo (nada de cortes rápidos)
- Sem texto, sem logo, sem rostos em close (evita problema de uncanny valley)

---

## 1. `videos/hero.mp4` — Hero da home

**Onde aparece:** coluna direita do topo do site, ao lado do título "Design que dialoga com seu ambiente".

**Prompt:**

> Ultra-realistic cinematic 3D render, slow dolly shot gliding past a handcrafted solid wood nightstand with two drawers, honey-toned Brazilian freijó wood with visible grain, standing in a minimalist room with warm off-white walls (#e8e6e1), soft directional morning light from a side window casting long gentle shadows, dust particles floating in the light beam, shallow depth of field, photorealistic textures, 8k detail, slow contemplative camera movement, seamless loop, no people, no text.

**Configurações sugeridas:** 16:9 · 1080p · 8–10 s · motion "dolly slow" (ou equivalente) · loop.

---

## 2. `videos/atelie.mp4` — Seção "O ateliê em movimento"

**Onde aparece:** faixa cinematográfica escura no meio da home, com o título "A madeira, em seu tempo." por cima (o site aplica um escurecimento de 45% — pode gerar o vídeo um pouco mais claro).

**Prompt:**

> Ultra-realistic cinematic 3D animation inside an artisan woodworking studio at golden hour, slow panning shot across a workbench with wood shavings, a hand plane sliding along a solid walnut board revealing fresh grain, warm amber light through tall windows, floating sawdust particles glowing in light rays, dark moody atmosphere with deep shadows, photorealistic wood textures, macro details of wood grain, 8k, slow cinematic camera, seamless loop, no visible faces, no text.

**Configurações sugeridas:** 16:9 · 1080p · 8–12 s · loop · atmosfera mais escura (a seção é preta).

---

## 3. Extras (opcionais, para redes sociais ou páginas futuras)

**Produto girando (para páginas de peça):**

> Ultra-realistic 3D turntable animation of a handcrafted solid wood TV console with sliding doors, Brazilian freijó wood, floating on a seamless warm off-white studio background (#e8e6e1), soft studio lighting with gentle reflections, slow 360-degree rotation, photorealistic wood grain and joinery details, 8k, seamless loop, no text.

**Detalhe de encaixe (Reels/bastidores):**

> Extreme macro shot, ultra-realistic 3D animation of a traditional dovetail joint sliding together in slow motion, solid walnut and tauari wood, visible grain and fibers, warm workshop lighting, shallow depth of field, dust particles, photorealistic, 8k, slow motion, seamless loop.

---

## Depois de gerar

1. Baixe os MP4 do Higgsfield.
2. Renomeie para `hero.mp4` e `atelie.mp4`.
3. Coloque na pasta `videos/` do projeto.
4. Ao publicar na Hostinger, envie a pasta `videos/` inteira para `public_html`.
5. Se o vídeo ficar pesado (acima de ~8 MB), comprima em [handbrake.fr](https://handbrake.fr) (preset "Web") antes de subir.

O site detecta os arquivos automaticamente: com vídeo, ele aparece com fade-in suave; sem vídeo, o fallback (fotos/fundo escuro) continua no lugar.
