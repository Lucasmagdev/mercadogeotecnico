# Aplicação da logo aprovada — 14/10/2026

A referência aprovada é o símbolo G com perfuração vertical, detalhe laranja e camadas de solo enviado por Lucas. A extração do fundo foi feita com a ferramenta integrada de imagem; não é uma nova proposta de marca. O arquivo raster transparente está em [simbolo-transparente.png](simbolo-transparente.png).

## Aplicações

- Cabeçalho e menu do celular: símbolo com base branca discreta e nome em duas linhas, mantendo espaço para os controles.
- Rodapé: versão maior; grade adaptada para o nome não disputar espaço com as colunas em tablets.
- Login: versão maior com nome branco sobre o painel azul, inclusive no tema claro.
- Navegador: favicon atualizado em ICO, PNG e SVG com imagem incorporada; ícone Apple em 180 × 180 px.
- Compartilhamento geral: imagem PNG de 1200 × 630 px com símbolo, nome e endereço. Os anúncios e empresas mantêm suas próprias imagens de compartilhamento.
- Instagram: avatar de 512 × 512 px com margem branca para recorte circular. A conta não foi alterada.

Arquivos de entrega em [public/brand](../../../public/brand). O componente compartilhado está em [logo.tsx](../../../src/components/logo.tsx). O símbolo não foi esticado nem recolorido; o fundo branco preserva contraste das camadas escuras nos dois temas. Os arquivos SVG/ICO de favicon incorporam raster e não são um vetor mestre da marca.

## Prompt da extração

Ferramenta: `image_gen`, edição da imagem anexada, fundo transparente. As reduções e codificações para web foram feitas com Sharp, sem novas alterações de desenho.

> Edit target: the user's attached approved Mercado Geotécnico symbol. This is faithful production asset extraction, NOT a new logo concept. Remove the surrounding white background and export the same single isolated logo on genuine transparency. Preserve exactly the large blue G silhouette, the vertical blue soil drill with white diagonal gaps and small orange trapezoid cap at the top, and the two charcoal soil strata and lower navy stratum. Preserve the relative positioning, colors, proportions, orientation and recognizable outline. Clean raster compression artifacts and sharpen edges only; do not add or remove any element, text, border, shadow or decoration. Keep the white negative-space channels as transparent cutouts and the original generous separation between shapes. The mark must occupy about 90 percent of a square canvas, centered with all elements fully visible. Output only the isolated approved symbol; no typography and no presentation sheet.

## Verificação

TypeScript, lint dos quatro arquivos alterados e build de produção passaram. A revisão em Chromium conferiu cabeçalho, menu, login e rodapé, temas claro/escuro e larguras de 320, 390, 768, 1280 e 1440 px. A marca carregou em todas; a página inicial não apresentou overflow a partir de 390 px. Em 320 px foi observado overflow na seção preexistente GeoSelos, fora do componente da marca.

Capturas em [qa](../qa), prefixo `marca-`. Não foi necessário alterar banco, autenticação, cotas ou variáveis do servidor.
