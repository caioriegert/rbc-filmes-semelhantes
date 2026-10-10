# Opa jonathan! Esse script lê o Excel com os filmes e transforma os dados de dentro do arquivo em JSON.
# Após executar esse scripto você deve executar o script update_posters.py para adicionar as URLs dos pôsteres dos filmes.
# em seguida deve mover o arquivo movies.json para a pasta raiz do projeto, onde está o index.html e o script.js, para que a interface funcione.

import pandas as pd
import ast
import json
import sys
from datetime import datetime

def preparar_dados_para_json(caminho_excel='tabela_filmes.xlsx'):
    print("🔄 Carregando o arquivo Excel...")
    
    try:
        df = pd.read_excel(caminho_excel, engine='openpyxl')
    except ImportError:
        print("Erro: O pacote 'openpyxl' não está instalado.")
        print("Instale com o comando: pip install openpyxl")
        sys.exit(1)
    except FileNotFoundError:
        print(f"Erro: Arquivo '{caminho_excel}' não encontrado!")
        sys.exit(1)
    except Exception as e:
        print(f"Erro ao ler o Excel: {e}")
        sys.exit(1)

    print(f"✅ Arquivo carregado com {len(df)} linhas.")

    # Converter colunas genres e keywords
    def parse_lista(coluna):
        if pd.isna(coluna):
            return []
        try:
            lista = ast.literal_eval(str(coluna))
            if isinstance(lista, list):
                return [item.get('name', str(item)) if isinstance(item, dict) else str(item) for item in lista]
            return []
        except:
            return []

    print("🔄 Processando gêneros e palavras-chave...")
    df['genres_list'] = df['genres'].apply(parse_lista)
    df['keywords_list'] = df['keywords'].apply(parse_lista)

    df['release_date'] = pd.to_datetime(df['release_date'], errors='coerce')
    df['release_year'] = df['release_date'].dt.year.astype('Int64')

    colunas_essenciais = ['runtime', 'vote_average', 'popularity', 'release_year', 'original_language']
    df = df.dropna(subset=colunas_essenciais)
    df = df.reset_index(drop=True)

    print(f"✅ Após limpeza: {len(df)} filmes válidos.")

    def converter_para_json(valor):
        if pd.isna(valor):
            return None
        if isinstance(valor, (pd.Timestamp, datetime)):
            return valor.year if hasattr(valor, 'year') else int(valor)
        if isinstance(valor, (int, float)):
            return float(valor) if isinstance(valor, float) else int(valor)
        return str(valor)

    colunas = [
        'id', 'title', 'genres_list', 'keywords_list', 'runtime',
        'vote_average', 'popularity', 'original_language', 'release_year'
    ]

    df_final = df[colunas].copy()

    for col in df_final.columns:
        if col not in ['genres_list', 'keywords_list']:
            df_final[col] = df_final[col].apply(converter_para_json)

    movies_list = df_final.to_dict('records')

    with open('movies.json', 'w', encoding='utf-8') as f:
        json.dump(movies_list, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Sucesso! Arquivo 'movies.json' gerado com {len(movies_list)} filmes.")
    print("   Agora você pode usar a interface HTML.")

    print("\n📋 Exemplo dos 2 primeiros filmes:")
    for movie in movies_list[:2]:
        print(f"   • {movie['title']} ({movie.get('release_year')}) | "
              f"Gêneros: {len(movie['genres_list'])} | Nota: {movie.get('vote_average')}")

if __name__ == "__main__":
    preparar_dados_para_json()