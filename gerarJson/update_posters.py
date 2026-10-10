import json
import requests

API_KEY = '33c4eee7567c270f39e6909ffc0302c8'
BASE_URL = 'https://api.themoviedb.org/3'
IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

def get_poster_url(movie_title, release_year):
    search_url = f"{BASE_URL}/search/movie?api_key={API_KEY}&query={movie_title}&year={release_year}"
    response = requests.get(search_url)
    if response.status_code == 200:
        data = response.json()
        if data['results']:
            poster_path = data['results'][0]['poster_path']
            if poster_path:
                return f"{IMAGE_BASE_URL}{poster_path}"
    return None

def update_movies_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        movies = json.load(f)
    
    for movie in movies:
        title = movie['title']
        year = movie['release_year']
        poster_url = get_poster_url(title, year)
        if poster_url:
            movie['poster_url'] = poster_url
        else:
            movie['poster_url'] = 'Poster not found'
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(movies, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    update_movies_json('movies.json')