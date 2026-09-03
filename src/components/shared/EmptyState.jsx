import { cn } from '../../lib/utils';

export default function EmptyState({ icon: Icon, message, size = 'md' }) {
  return (
    <div
      className={cn(
        'text-center text-muted-foreground flex flex-col items-center justify-center',
        size === 'sm' ? 'py-8' : 'py-12'
      )}
    >
      <Icon size={size === 'sm' ? 40 : 48} className="mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
