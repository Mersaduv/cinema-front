/** Catalog — MovieCard only (low complexity). */
export const GET_MOVIES_LIST = /* GraphQL */ `
  query GetMoviesList(
    $page: Int
    $first: Int! = 24
    $genre: String
    $search: String
    $genre_ids: [String!]
    $country_ids: [String!]
    $network_ids: [String!]
    $year: Int
    $min_rating: Float
    $sort_by: String
  ) {
    moviesList(
      page: $page
      first: $first
      genre: $genre
      search: $search
      genre_ids: $genre_ids
      country_ids: $country_ids
      year: $year
      min_rating: $min_rating
      sort_by: $sort_by
    ) {
      data {
        id
        slug
        title
        synopsis
        release_year
        has_subtitle
        has_dubbed_audio
        list_meta {
          poster_url
          backdrop_url
          genres
          rating
        }
      }
      paginatorInfo {
        hasMorePages
        currentPage
        total
      }
    }
  }
`;

export const GET_MOVIE = /* GraphQL */ `
  query GetMovie($slug: String!) {
    movie(slug: $slug) {
      id
      slug
      title
      original_title
      synopsis
      release_year
      duration_seconds
      age_rating
      poster_url
      backdrop_url
      trailer_url
      has_dubbed_audio
      has_subtitle
      genres
      genre_tags {
        id
        slug
        name
      }
      provider_name
      tmdb_id
      details {
        rating
        original_language
        directors
        writers
        genres
        languages
        countries
        network
        runtime_minutes
        actors {
          name
          character
          profile_url
        }
        gallery
      }
      cast {
        character_name
        order
        person {
          slug
          name
          profile_url
        }
      }
      crew {
        job
        department
        person {
          slug
          name
          profile_url
        }
      }
      metadata {
        playback {
          hls_url
          downloads {
            quality
            url
          }
        }
      }
      cached_avg_rating
      reviews(first: 10, sort: NEWEST) {
        reviews {
          id
          user {
            id
            name
            avatar_url
          }
          rating
          body
          created_at
          is_own
        }
        summary {
          total_count
          average_rating
          distribution {
            rating
            count
          }
        }
        paginatorInfo {
          currentPage
          lastPage
          total
        }
        user_review {
          id
          rating
          body
        }
      }
    }
  }
`;

export const WATCH_MOVIE = /* GraphQL */ `
  query WatchMovie($slug: String!) {
    watchMovie(slug: $slug) {
      hls_url
      subtitle_url
      dubbed_audio_url
      audio_tracks {
        name
        language
        type
      }
      downloads {
        quality
        url
      }
    }
  }
`;

/** Catalog — SeriesCard only (low complexity). */
export const GET_SERIES_LIST = /* GraphQL */ `
  query GetSeriesList(
    $page: Int
    $first: Int! = 24
    $search: String
    $genre_ids: [String!]
    $country_ids: [String!]
    $year: Int
    $min_rating: Float
    $sort_by: String
  ) {
    seriesList(
      page: $page
      first: $first
      search: $search
      genre_ids: $genre_ids
      country_ids: $country_ids
      year: $year
      min_rating: $min_rating
      sort_by: $sort_by
    ) {
      data {
        id
        slug
        title
        synopsis
        release_year
        poster_url
        backdrop_url
        status
        number_of_seasons
        number_of_episodes
        has_subtitle
        has_dubbed
        list_meta {
          status_label_fa
          genres
          rating
          detail_backdrop_url
        }
      }
      paginatorInfo {
        hasMorePages
        currentPage
        total
      }
    }
  }
`;

export const GET_CATALOG_FILTER_META = /* GraphQL */ `
  query GetCatalogFilterMeta($kind: String!) {
    catalogFilterMeta(kind: $kind) {
      genres
      countries
      networks
      years
      show_types
      min_rating
      max_rating
    }
  }
`;

/** Detail — single resolver payload (low complexity). */
export const GET_SERIES_OVERVIEW = /* GraphQL */ `
  query GetSeriesOverview($slug: String!) {
    seriesOverview(slug: $slug) {
      id
      slug
      title
      original_title
      synopsis
      release_year
      first_air_date
      last_air_date
      status
      status_label_fa
      episode_runtime_minutes
      number_of_seasons
      number_of_episodes
      network
      provider_name
      genre_tags {
        id
        slug
        name
      }
      poster_url
      backdrop_url
      trailer_url
      age_rating
      has_subtitle
      has_dubbed
      total_seasons
      seasons {
        id
        season_number
        title
      }
      cast {
        name
        slug
        character_name
        profile_url
        order
      }
      crew {
        name
        slug
        job
        department
        profile_url
      }
      details {
        backdrop_url
        rating
        original_language
        creators
        directors
        writers
        genres
        languages
        countries
        network
        actors {
          name
          character
          profile_url
        }
        gallery
      }
      cached_avg_rating
      reviews(first: 10, sort: NEWEST) {
        reviews {
          id
          user {
            id
            name
            avatar_url
          }
          rating
          body
          created_at
          is_own
        }
        summary {
          total_count
          average_rating
          distribution {
            rating
            count
          }
        }
        paginatorInfo {
          currentPage
          lastPage
          total
        }
        user_review {
          id
          rating
          body
        }
      }
    }
  }
`;

export const WATCH_EPISODE = /* GraphQL */ `
  query WatchEpisode($seriesSlug: String!, $season: Int!, $episode: Int!) {
    watchEpisode(seriesSlug: $seriesSlug, season: $season, episode: $episode) {
      hls_url
      subtitle_url
      dubbed_audio_url
      episode {
        episode_number
        title
      }
      series {
        slug
        title
        poster_url
      }
      next_episode {
        episode_number
      }
      prev_episode {
        episode_number
      }
    }
  }
`;
