const PHASE_LABELS = {
  genres: 'SUCESSOS',
  albums: 'Artistas e bandas',
  tracks: 'Músicas',
  covers: 'Capas (imagens)',
};

export default function PrefetchBanner({ progress }) {
  if (!progress) return null;

  const phaseLabel = PHASE_LABELS[progress.phase] || 'Preparando';
  const hasTotal = progress.total > 0;
  const percent = hasTotal ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;

  return (
    <div className="px-4 py-2 bg-secondary/10 border-b border-secondary/30 shrink-0">
      <div className="flex items-center justify-between gap-3 text-xs text-secondary">
        <p className="truncate">
          Preparando cache offline — <span className="font-semibold">{phaseLabel}</span>
          {progress.label ? ` · ${progress.label}` : ''}
          {hasTotal ? ` (${progress.current}/${progress.total})` : ''}
        </p>
        <span className="font-bold tabular-nums shrink-0">{percent}%</span>
      </div>
      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-secondary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
