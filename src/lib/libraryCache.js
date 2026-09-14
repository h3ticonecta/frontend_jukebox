import {
  idbClearCatalog,
  idbGetAllAlbums,
  idbGetAllTracks,
  idbGetGenres,
  idbSetAlbums,
  idbSetGenres,
  idbSetTracks,
} from './idbCatalog';

export function createLibraryCache() {
  const albumsByGenre = new Map();
  const tracksByAlbum = new Map();
  let genres = null;

  return {
    getGenres() {
      return genres;
    },

    setGenres(nextGenres) {
      genres = nextGenres;
      idbSetGenres(nextGenres);
    },

    getAlbums(genrePath) {
      return albumsByGenre.get(genrePath) ?? null;
    },

    setAlbums(genrePath, entry) {
      if (!genrePath) return;
      albumsByGenre.set(genrePath, entry);
      idbSetAlbums(genrePath, entry);
    },

    getTracks(albumPath) {
      return tracksByAlbum.get(albumPath) ?? null;
    },

    setTracks(albumPath, tracks) {
      if (!albumPath) return;
      tracksByAlbum.set(albumPath, tracks);
      idbSetTracks(albumPath, tracks);
    },

    async hydrate() {
      const [genresRow, albumRows, trackRows] = await Promise.all([
        idbGetGenres(),
        idbGetAllAlbums(),
        idbGetAllTracks(),
      ]);

      if (genresRow?.genres?.length) {
        genres = genresRow.genres;
      }

      albumRows.forEach(([path, entry]) => {
        if (path && entry) {
          albumsByGenre.set(path, entry);
        }
      });

      trackRows.forEach(([path, tracks]) => {
        if (path && tracks) {
          tracksByAlbum.set(path, tracks);
        }
      });
    },

    async clear({ persist = false } = {}) {
      genres = null;
      albumsByGenre.clear();
      tracksByAlbum.clear();
      if (persist) {
        await idbClearCatalog();
      }
    },
  };
}
