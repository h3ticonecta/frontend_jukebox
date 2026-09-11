import { cn } from '../../lib/utils';

export function Skeleton({ className }) {
  return <div className={cn('skeleton-shimmer rounded-md', className)} aria-hidden="true" />;
}

export function GenreCarouselSkeleton({ count = 6 }) {
  return (
    <section className="px-4 py-4 border-b border-border shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="genre-marquee-mask overflow-hidden">
        <div className="flex gap-8 w-max pr-8">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2.5 shrink-0 w-[200px]">
              <Skeleton className="w-[180px] h-[180px] rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AlbumGridSkeleton({ count = 10 }) {
  return (
    <div
      className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 auto-rows-fr"
      style={{
        columnGap: 'var(--browser-grid-gap-x)',
        rowGap: 'var(--browser-grid-gap-y)',
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="w-full aspect-square rounded-lg" />
      ))}
    </div>
  );
}

export function TrackListSkeleton({ count = 8 }) {
  return (
    <ul className="space-y-1" style={{ padding: 'var(--browser-scroll-pad)' }}>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="flex items-center gap-2 p-2 min-h-[48px]">
          <Skeleton className="h-3 w-5 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4 max-w-[200px]" />
            <Skeleton className="h-3 w-1/2 max-w-[120px]" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </li>
      ))}
    </ul>
  );
}
