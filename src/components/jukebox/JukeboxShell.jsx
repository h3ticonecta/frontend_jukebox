export default function JukeboxShell({ header, genreCarousel, children, queuePanel, playerBar }) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {header}
      {genreCarousel}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 flex min-h-0">{children}</div>
        {queuePanel}
      </div>
      {playerBar}
    </div>
  );
}
