import { Coins } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CreditToast({ visible, message = '+1 crédito inserido' }) {
  return (
    <div
      className={cn(
        'fixed bottom-24 left-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg',
        'glass-surface border border-primary/40 neon-border-amber shadow-lg',
        'transition-all duration-300 ease-out',
        visible
          ? 'opacity-100 translate-x-0 pointer-events-auto'
          : 'opacity-0 -translate-x-4 pointer-events-none'
      )}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <Coins size={20} className="text-primary shrink-0" />
      <span className="text-sm font-display text-primary neon-glow-amber tracking-wide">{message}</span>
    </div>
  );
}
