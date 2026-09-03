export default function SyncBanner({ needsSync }) {
  if (!needsSync) return null;

  return (
    <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 shrink-0">
      <p className="text-xs text-amber-400">
        Biblioteca ainda não sincronizada. Peça ao administrador para executar a sincronização no painel.
      </p>
    </div>
  );
}
