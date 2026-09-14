export function createLibraryCache() {
  const albumsByGenre = new Map();
  const tracksByAlbum = new Map();

  return {
    getAlbums(genrePath) {
      return albumsByGenre.get(genrePath) ?? null;
    },

    setAlbums(genrePath, entry) {
      if (!genrePath) return;
      albumsByGenre.set(genrePath, entry);
    },

    getTracks(albumPath) {
      return tracksByAlbum.get(albumPath) ?? null;
    },

    setTracks(albumPath, tracks) {
      if (!albumPath) return;
      tracksByAlbum.set(albumPath, tracks);
    },

    clear() {
      albumsByGenre.clear();
      tracksByAlbum.clear();
    },
  };
}
