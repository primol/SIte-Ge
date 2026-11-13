# Geovanna Louzado | Portfólio Profissional

Site de página única (one-page), em português, com o portfólio profissional de Geovanna Louzado,
graduanda em Psicologia com direcionamento em Neuropsicologia.

Feito em HTML, CSS e JavaScript puros: não há etapa de build. Basta servir a pasta.

## Como ver localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Estrutura

| Caminho | O que é |
| --- | --- |
| `index.html` | Todo o conteúdo do site (seções Início, Sobre mim, Neuropsicologia, Experiências, Formação, Projetos, Contato) |
| `assets/css/style.css` | Visual: paleta azul bebê + branco, tipografia e responsividade |
| `assets/js/threads.js` | Animação inicial: a cabeça com fios emaranhados que se desembaraçam ao rolar |
| `assets/js/main.js` | Menu, revelações ao rolar, linha do tempo e fios decorativos |
| `assets/img/` | Fotos (JPG + WebP), favicon e imagem de compartilhamento (`og.jpg`) |
| `assets/docs/curriculo-geovanna-louzado.pdf` | Arquivo baixado pelos botões "Baixar currículo em PDF" |
| `curriculo.html` | Versão para impressão do currículo, de onde o PDF foi gerado |

## Como editar

- **Textos**: direto no `index.html`. Cada seção tem um comentário de cabeçalho.
- **Foto de perfil**: substitua `assets/img/geovanna-louzado.jpg` e `.webp` (proporção próxima de 4:5).
- **Novo certificado**: na seção Formação, duplique um bloco `<article class="card">` e remova o cartão
  "Espaço reservado" quando não for mais necessário.
- **Currículo**: substitua o PDF em `assets/docs/` mantendo o mesmo nome de arquivo. O PDF atual foi gerado
  a partir de `curriculo.html` (abrir no navegador → Imprimir → Salvar como PDF, A4).
- **Rótulos dos fios** (Memória, Atenção…): bloco `hero__strands` no `index.html`. São cinco fios; para
  mudar a quantidade, ajuste também a lista `COLORS` em `assets/js/threads.js`.

## Pendências do briefing

Itens marcados no HTML com comentários `<!-- PENDENTE: ... -->`:

- Título, tema, data e papel específico na participação em podcast.
- Nomes oficiais dos instrumentos e escalas de rastreio (TEA, TDAH, estresse, ansiedade, depressão, burnout)
  e a denominação exata de "VISC" (não incluída no site).
- Distribuição das atividades (aplicação, correção, interpretação) por instrumento e por clínica.
- Datas finais e status "em andamento" dos estágios na Clínica Escola FMU e no Hospital Dr. Arnaldo.
- Currículo oficial em PDF, para substituir a versão gerada a partir do briefing.

Enquanto a graduação e o registro no CRP não estiverem concluídos, o site usa "graduanda em Psicologia"
e não anuncia serviços psicológicos, conforme o briefing.

## Publicação (GitHub Pages + domínio próprio)

O site é publicado pelo GitHub Pages a partir da branch `gh-pages` e responde em
**https://psicologageovanna.com.br** (arquivo `CNAME` na raiz). Toda alteração precisa chegar à `gh-pages`
para aparecer no ar.

DNS no Registro.br (modo avançado):

| Tipo | Nome | Dados |
| --- | --- | --- |
| A | (vazio) | 185.199.108.153 |
| A | (vazio) | 185.199.109.153 |
| A | (vazio) | 185.199.110.153 |
| A | (vazio) | 185.199.111.153 |
| AAAA | (vazio) | 2606:50c0:8000::153 |
| AAAA | (vazio) | 2606:50c0:8001::153 |
| AAAA | (vazio) | 2606:50c0:8002::153 |
| AAAA | (vazio) | 2606:50c0:8003::153 |
| CNAME | www | primol.github.io |

Depois que o DNS propagar, marque **Enforce HTTPS** em Settings → Pages.

## Acessibilidade e desempenho

- Respeita `prefers-reduced-motion`: sem animação, a cena inicial vira uma ilustração estática.
- Navegação por teclado, link "Pular para o conteúdo", contraste de texto em azul profundo.
- Fontes hospedadas no próprio site (Cormorant Garamond, Manrope e IBM Plex Mono, licença SIL OFL),
  sem requisições a terceiros.
