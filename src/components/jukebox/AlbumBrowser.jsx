import { FolderOpen, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import AlbumCard from './AlbumCard';
import EmptyState from '../shared/EmptyState';

export default function AlbumBrowser({ albums, selectedAlbumId, onSelectAlbum }) {
  return (
    <div
      className="flex-1 flex min-h-0"
      style={{
        paddingLeft: 'var(--browser-pad-x)',
        paddingRight: 'var(--browser-pad-x)',
        paddingTop: 'var(--browser-pad-y)',
      }}
    >
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div
          className="flex items-center gap-2"
          style={{
            marginBottom: 'var(--browser-header-mb)',
            paddingLeft: 'var(--browser-scroll-pad)',
            paddingRight: 'var(--browser-scroll-pad)',
          }}
        >
          <Users className="text-secondary shrink-0" size={20} />
          <h2 className="text-sm font-display text-secondary neon-glow-cyan whitespace-nowrap">
            ARTISTAS / BANDAS
          </h2>
          <span className="text-xs text-muted-foreground ml-1">({albums.length})</span>
        </div>

        <div
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
          style={{
            paddingLeft: 'var(--browser-scroll-pad)',
            paddingRight: 'var(--browser-scroll-pad)',
            paddingTop: 'var(--browser-scroll-pad)',
            paddingBottom: 'var(--browser-scroll-bottom)',
          }}
        >
          {albums.length === 0 ? (
            <EmptyState icon={FolderOpen} message="Nenhuma pasta encontrada" />
          ) : (
            <div
              className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-fr"
              style={{
                columnGap: 'var(--browser-grid-gap-x)',
                rowGap: 'var(--browser-grid-gap-y)',
              }}
            >
              {albums.map((album, index) => (
                <div
                  key={album.id}
                  className={cn(
                    'w-full aspect-square rounded-lg relative transition-all duration-200',
                    album.id === selectedAlbumId &&
                      'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_18px_hsl(var(--primary)/0.5)]'
                  )}
                >
                  <AlbumCard
                    gradientClass={album.coverColor}
                    albumName={album.name}
                    artistName={album.countLabel}
                    coverImage={album.cover}
                    size="md"
                    isSelected={album.id === selectedAlbumId}
                    onClick={() => onSelectAlbum(album, index)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
