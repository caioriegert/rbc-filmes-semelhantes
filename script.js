let movies = []
let minsMaxs = {};

// Funcao assíncrona para carregar os dados dos filmes do arquivo movies.json
async function carregarDados() {
  try {
    const response = await fetch('movies.json');
    movies = await response.json();

    const select = document.getElementById('filmeSelect');
    
    // Pré-calcula os mínimos e máximos de todos os atributos numéricos UMA ÚNICA VEZ
    // Isso evita recalcular esses valores milhares de vezes durante as recomendações,
    minsMaxs = {
      runtime: { 
        min: Math.min(...movies.map(m => m.runtime)), 
        max: Math.max(...movies.map(m => m.runtime)) 
      },
      vote_average: { 
        min: Math.min(...movies.map(m => m.vote_average)), 
        max: Math.max(...movies.map(m => m.vote_average)) 
      },
      popularity: { 
        min: Math.min(...movies.map(m => m.popularity)), 
        max: Math.max(...movies.map(m => m.popularity)) 
      },
      release_year: { 
        min: Math.min(...movies.map(m => m.release_year)), 
        max: Math.max(...movies.map(m => m.release_year)) 
      }
    };

    // Popula o <select> com todos os títulos dos filmes
    movies.forEach(movie => {
      const option = document.createElement('option');
      option.value = movie.title;
      option.textContent = movie.title;
      select.appendChild(option);
    });

    renderMoviesGrid();
  } catch (error) {
    console.error("Erro ao carregar os dados dos filmes:", error);
  }
}

// Similaridade local

// Calcula a similaridade de 2 listas usando Jaccard
function jaccard(a, b) {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  
  const setA = new Set(a);
  const setB = new Set(b);
  
  const inter = [...setA].filter(x => setB.has(x)).length;
  const uniao = new Set([...setA, ...setB]).size;
  
  return inter / uniao;
}

// Calcula a similaridade numerica 
function similaridadeNumerica(v1, v2, min, max) {
  if (v1 == null || v2 == null || max === min) return 0;
  return 1 - Math.abs(v1 - v2) / (max - min);
}

// Calcula a similaridade exata para valores categóricos
function similaridadeExata(v1, v2) {
  return v1 === v2 ? 1 : 0;
}

// Similaridade global

// Calcula a similaridade global do filme escolhido com os candidatos
function similaridadeGlobal(query, candidato) {
  
  // Define a importância de cada atributo
  const pesos = {
    genres: 5,
    keywords: 4,
    vote_average: 3,
    runtime: 2,
    popularity: 2,
    release_year: 2,
    original_language: 1
  };

  let somaPonderada = 0;
  let somaPesos = 0;

 // Calculo das similaridades locais

  // Genres - Similaridade de Jaccard
  somaPonderada += pesos.genres * jaccard(query.genres_list, candidato.genres_list);
  somaPesos += pesos.genres;

  // Keywords - Similaridade de Jaccard
  somaPonderada += pesos.keywords * jaccard(query.keywords_list, candidato.keywords_list);
  somaPesos += pesos.keywords;

  // Atributos numéricos - Similaridade normalizada
  somaPonderada += pesos.vote_average * similaridadeNumerica(
    query.vote_average, 
    candidato.vote_average, 
    minsMaxs.vote_average.min, 
    minsMaxs.vote_average.max
  );
  somaPesos += pesos.vote_average;

  somaPonderada += pesos.runtime * similaridadeNumerica(
    query.runtime, 
    candidato.runtime, 
    minsMaxs.runtime.min, 
    minsMaxs.runtime.max
  );
  somaPesos += pesos.runtime;

  somaPonderada += pesos.popularity * similaridadeNumerica(
    query.popularity, 
    candidato.popularity, 
    minsMaxs.popularity.min, 
    minsMaxs.popularity.max
  );
  somaPesos += pesos.popularity;

  somaPonderada += pesos.release_year * similaridadeNumerica(
    query.release_year, 
    candidato.release_year, 
    minsMaxs.release_year.min, 
    minsMaxs.release_year.max
  );
  somaPesos += pesos.release_year;

  // Idioma - Similaridade exata
  somaPonderada += pesos.original_language * similaridadeExata(
    query.original_language, 
    candidato.original_language
  );
  somaPesos += pesos.original_language;

  return somaPonderada / somaPesos;
}



// Funcao principal que é chamada quando o usuário seleciona um filme
function recomendar() {
  const titulo = document.getElementById('filmeSelect').value;
  
  if (!titulo) {
    alert("Por favor, selecione um filme!");
    return;
  }

  const query = movies.find(m => m.title === titulo);
  if (!query) return;

  const resultados = [];

  // Calcula similaridade com todos os filmes
  movies.forEach(candidato => {
    if (candidato.title === titulo) return;
    const sim = similaridadeGlobal(query, candidato);


    resultados.push({
      title: candidato.title,
      poster_url: candidato.poster_url,
      similarity: sim
    });
  });

  // Ordena do maior para o menor valor de similaridade
  resultados.sort((a, b) => b.similarity - a.similarity);

  // Pega apenas os 5 mais similares
  const top5 = resultados.slice(0, 5);

  // Mostra os resultados na tela
  const container = document.getElementById('listaRecomendacoes');
  container.innerHTML = '';

  top5.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'recomendacao';
    
    const posterUrl = r.poster_url || 'https://via.placeholder.com/400x600?text=Sem+Imagem';

    div.innerHTML = `
      <div class="recomendacao-poster" style="background-image: url('${posterUrl}')"></div>
      <div class="recomendacao-overlay">
        <span class="recomendacao-rank">${i + 1}</span>
        <div class="recomendacao-title">${r.title}</div>
        <div class="recomendacao-score">${(r.similarity * 100).toFixed(1)}% similaridade</div>
      </div>
    `;
    
    container.appendChild(div);
  });

  document.getElementById('resultado').classList.remove('hidden');
  document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' });
}

// Função para destacar o card do filme selecionado no grid
function handleSelectChange() {
  const titulo = document.getElementById('filmeSelect').value;
  highlightSelectedCard(titulo);
}

function highlightSelectedCard(title) {
  document.querySelectorAll('.movie-card').forEach(card => {
    if (card.dataset.title === title) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
  
  recomendar(); 
}

// Função para renderizar os filmes na tela
function renderMoviesGrid() {
  const grid = document.getElementById('moviesGrid');
  grid.innerHTML = '';

  movies.forEach(movie => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'movie-card';
    card.dataset.title = movie.title;
    card.onclick = () => {
      document.getElementById('filmeSelect').value = movie.title;
      highlightSelectedCard(movie.title);
    };

    const posterUrl = movie.poster_url || 'https://via.placeholder.com/300x450?text=Sem+Imagem';

    card.innerHTML = `
      <div class="movie-poster" style="background-image: url('${posterUrl}')"></div>
      <div class="movie-card-title">${movie.title}</div>
    `;

    grid.appendChild(card);
  });
}

// Iniciar o carregamento dos dados quando a página for carregada
window.onload = carregarDados;