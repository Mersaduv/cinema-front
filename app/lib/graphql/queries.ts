const RESPONSIVE_IMAGE_FIELDS = /* GraphQL */ `
  original
  blur
  src
  srcset_string
  width
  height
  mime_type
  srcset {
    url
    width
    descriptor
  }
`;

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

const MOVIE_CAST_FIELDS = /* GraphQL */ `
  cast {
    character_name
    order
    person {
      slug
      name
      profile_url
      profile_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
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
`;

/** SEO / OpenGraph — minimal payload for generateMetadata. */
export const GET_MOVIE_META = /* GraphQL */ `
  query GetMovieMeta($slug: String!) {
    movie(slug: $slug) {
      title
      meta_title
      meta_description
      synopsis
      poster_url
      poster_image {
        src
        original
      }
    }
  }
`;

/** Above-the-fold detail — hero, synopsis, crew highlights; no cast/reviews. */
export const GET_MOVIE_CRITICAL = /* GraphQL */ `
  query GetMovieCritical($slug: String!) {
    movie(slug: $slug) {
      id
      slug
      title
      original_title
      synopsis
      release_year
      duration_seconds
      age_rating
      meta_title
      meta_description
      content_warnings
      quality_badges
      poster_url
      backdrop_url
      poster_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      backdrop_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
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
    }
  }
`;

/** Deferred cast/crew — client fetch after first paint. */
export const GET_MOVIE_PEOPLE = /* GraphQL */ `
  query GetMoviePeople($slug: String!) {
    movie(slug: $slug) {
      id
      ${MOVIE_CAST_FIELDS}
      details {
        actors {
          name
          character
          profile_url
          profile_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
        }
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
      meta_title
      meta_description
      content_warnings
      quality_badges
      poster_url
      backdrop_url
      poster_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      backdrop_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
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
          profile_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
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
          profile_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
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

export const GET_MOVIE_PREVIEW = /* GraphQL */ `
  query GetMoviePreview($slug: String!, $token: String!) {
    moviePreview(slug: $slug, token: $token) {
      id
      slug
      title
      original_title
      synopsis
      release_year
      duration_seconds
      age_rating
      meta_title
      meta_description
      content_warnings
      quality_badges
      poster_url
      backdrop_url
      poster_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      backdrop_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
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
          profile_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
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
          profile_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
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
    }
  }
`;

export const WATCH_MOVIE = /* GraphQL */ `
  query WatchMovie($slug: String!) {
    watchMovie(slug: $slug) {
      hls_url
      dash_url
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
          poster_url
          backdrop_url
          poster_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
          backdrop_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
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

const SERIES_CAST_FIELDS = /* GraphQL */ `
  cast {
    name
    slug
    character_name
    profile_url
    profile_image {
      ${RESPONSIVE_IMAGE_FIELDS}
    }
    order
  }
  crew {
    name
    slug
    job
    department
    profile_url
    profile_image {
      ${RESPONSIVE_IMAGE_FIELDS}
    }
  }
`;

/** SEO / OpenGraph — minimal payload for generateMetadata. */
export const GET_SERIES_META = /* GraphQL */ `
  query GetSeriesMeta($slug: String!) {
    seriesOverview(slug: $slug) {
      title
      meta_title
      meta_description
      synopsis
      poster_url
      poster_image {
        src
        original
      }
    }
  }
`;

/** Above-the-fold series detail — no cast/reviews. */
export const GET_SERIES_OVERVIEW_CRITICAL = /* GraphQL */ `
  query GetSeriesOverviewCritical($slug: String!) {
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
      poster_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      backdrop_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      trailer_url
      age_rating
      meta_title
      meta_description
      content_warnings
      quality_badges
      has_subtitle
      has_dubbed
      total_seasons
      seasons {
        id
        season_number
        title
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
      }
      cached_avg_rating
    }
  }
`;

/** Deferred cast/crew for series detail. */
export const GET_SERIES_PEOPLE = /* GraphQL */ `
  query GetSeriesPeople($slug: String!) {
    seriesOverview(slug: $slug) {
      id
      ${SERIES_CAST_FIELDS}
      details {
        actors {
          name
          character
          profile_url
          profile_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
        }
      }
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
      poster_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      backdrop_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      trailer_url
      age_rating
      meta_title
      meta_description
      content_warnings
      quality_badges
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
        profile_image {
          ${RESPONSIVE_IMAGE_FIELDS}
        }
        order
      }
      crew {
        name
        slug
        job
        department
        profile_url
        profile_image {
          ${RESPONSIVE_IMAGE_FIELDS}
        }
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
          profile_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
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

export const GET_SERIES_OVERVIEW_PREVIEW = /* GraphQL */ `
  query GetSeriesOverviewPreview($slug: String!, $token: String!) {
    seriesOverviewPreview(slug: $slug, token: $token) {
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
      poster_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      backdrop_image {
        ${RESPONSIVE_IMAGE_FIELDS}
      }
      trailer_url
      age_rating
      meta_title
      meta_description
      content_warnings
      quality_badges
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
        profile_image {
          ${RESPONSIVE_IMAGE_FIELDS}
        }
        order
      }
      crew {
        name
        slug
        job
        department
        profile_url
        profile_image {
          ${RESPONSIVE_IMAGE_FIELDS}
        }
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
          profile_image {
            ${RESPONSIVE_IMAGE_FIELDS}
          }
        }
        gallery
      }
      cached_avg_rating
    }
  }
`;

export const WATCH_EPISODE = /* GraphQL */ `
  query WatchEpisode($seriesSlug: String!, $season: Int!, $episode: Int!) {
    watchEpisode(seriesSlug: $seriesSlug, season: $season, episode: $episode) {
      hls_url
      video_url
      embed_url
      source_method
      dash_url
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
