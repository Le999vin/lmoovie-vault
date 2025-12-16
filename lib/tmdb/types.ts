export type TMDBGenre = {
  id: number;
  name: string;
};

export type TMDBMovie = {
  id: number;
  title: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  genre_ids?: number[];
  vote_average?: number;
  runtime?: number | null;
};

export type TMDBMovieDetails = TMDBMovie & {
  genres?: TMDBGenre[];
  runtime?: number | null;
  homepage?: string | null;
  status?: string;
  tagline?: string | null;
  imdb_id?: string | null;
  spoken_languages?: { english_name: string; iso_639_1: string }[];
  production_countries?: { name: string; iso_3166_1: string }[];
};

export type TMDBSearchResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TMDBMovie[];
};
