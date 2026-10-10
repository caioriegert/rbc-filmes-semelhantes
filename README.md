# 🎬 RBC Filmes Semelhantes

Sistema de recomendação de filmes baseado em **Raciocínio Baseado em Casos (RBC)**. O usuário escolhe um filme que já assistiu e o sistema retorna os **5 filmes mais similares** da base, com o percentual de similaridade.

## Como funciona

Cada filme é um *caso*. Ao selecionar um filme (a *consulta*), o sistema calcula a similaridade global com todos os outros casos por meio de uma **média ponderada das similaridades locais**:

| Atributo            | Similaridade local          | Peso |
|---------------------|-----------------------------|:----:|
| `genres`            | Jaccard                     | 5    |
| `keywords`          | Jaccard                     | 4    |
| `vote_average`      | Numérica normalizada        | 3    |
| `runtime`           | Numérica normalizada        | 2    |
| `popularity`        | Numérica normalizada        | 2    |
| `release_year`      | Numérica normalizada        | 2    |
| `original_language` | Exata (igual = 1, senão 0)  | 1    |

- **Jaccard:** `|A ∩ B| / |A ∪ B|`
- **Numérica:** `1 − |v1 − v2| / (máx − mín)`
- **Global:** `Σ(peso × sim_local) / Σ(pesos)`

## Estrutura

```
├── index.html            # Interface
├── style.css             # Estilos
├── script.js             # Lógica do RBC (similaridades e recomendação)
├── movies.json           # Base de casos (71 filmes)
└── gerarJson/
    ├── tabela_filmes.xlsx  # Dados brutos dos filmes
    ├── gerar_json.py       # Converte o Excel em movies.json
    └── update_posters.py   # Adiciona URLs dos pôsteres via API do TMDB
```

## Como executar

Como o `script.js` carrega o `movies.json` via `fetch`, é preciso servir os arquivos por um servidor local:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Regerando a base de dados (opcional)

```bash
cd gerarJson
pip install pandas openpyxl requests
python3 gerar_json.py        # gera movies.json a partir do Excel
python3 update_posters.py    # adiciona os pôsteres (requer chave da API do TMDB)
mv movies.json ..            # move para a raiz do projeto
```

## Tecnologias

- HTML, CSS e JavaScript (sem frameworks)
- Python (pandas) para preparação dos dados
- [TMDB API](https://www.themoviedb.org/documentation/api) para os pôsteres

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
