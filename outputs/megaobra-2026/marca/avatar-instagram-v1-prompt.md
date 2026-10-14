# Mercado Geotécnico — avatar Instagram v1

Data: 14/10/2026.
Status: proposta raster para revisão; não publicada e não aplicada à plataforma.
Modo: edição pela ferramenta integrada image_gen, com referência local explícita.

## Arquivo e proveniência

- PNG: `avatar-instagram-v1.png`.
- Dimensões: 1254 × 1254 px.
- Imagem de referência: `logo-conceito-v1.png`, inspecionada antes da edição.
- Arquivo original gerado: `C:\Users\Lucas\.codex\generated_images\01a13a73-127d-7810-9899-7d90283522e4\exec-650d2510-9cc3-4938-affe-e50c3590c5c9.png`.
- O original foi preservado. A cópia no projeto é idêntica por SHA-256.
- Nenhum recorte, repintura ou outro processamento de imagem foi executado por Python; Python foi usado apenas para medir dimensões, alpha e margem do recorte circular.

## Inspeção e QA

- Símbolo em camadas preserva a direção visual do logo v1; sem texto ou elementos adicionais.
- Branco, azul claro e laranja sobre fundo marinho.
- Canal alpha completamente opaco (255 em todos os pixels).
- Região contrastante do símbolo: x=159–1094, y=339–904.
- Margem mínima calculada até a borda do recorte circular: aproximadamente 127 px (medição por máscara de pixels com componente RGB acima de 130). Nenhuma parte principal do símbolo seria cortada.
- O arquivo foi aberto e inspecionado visualmente após cópia.
- Limitação de conceito raster: o gerador introduz pequenas variações de tom, incluindo no fundo; o fundo é opaco, porém não uniforme pixel a pixel no hexadecimal solicitado. Para a versão definitiva, normalizar cores e geometria em vetor com exportação determinística.
- O nome da marca, a plataforma e contas sociais não foram alterados.

## Prompt final

```text
Use case: precise-object-edit.
Asset type: square Instagram avatar for the existing “Mercado Geotécnico” logo concept.
Input image: the attached local logo is the edit target and sole identity reference.
Primary request: extract and preserve EXACTLY the geometric symbol from the left of the reference logo, remove all wordmark text, and adapt it into ONE square social avatar. Preserve the existing connected angular layered M geometry, proportions, cutouts, gaps, corner shapes and orange connector band; do not invent a new mark.
Color change only: place the symbol on a fully opaque SOLID dark navy background #0A2540. Make the upper large layer solid white #FFFFFF, the lower large layer a solid pale blue #A7D1F2, and preserve the existing middle connected accent band in solid orange #F97316. Flat uniform fills only, with clean crisp antialiased edges.
Composition: square canvas; the symbol alone centered horizontally and vertically; symbol width about 60% of the canvas, with ample equal clear space so the complete symbol survives a circular Instagram crop and reads well at small avatar sizes.
Invariants: the original symbol's identity, silhouette, angular topology and overall proportions must remain unchanged. Keep the orange accent as the same connected middle band. No wordmark.
Avoid: any text or letters outside the original abstract M symbol, new elements, outline circle, border, frame, slogan, watermark, gradient, shadow, 3D, lighting, texture, mockup, extra variants. The navy background must be truly uniform and opaque.
```
