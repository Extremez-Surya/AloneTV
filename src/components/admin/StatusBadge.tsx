interface StatusBadgeProps {
  status: 'success' | 'pending' | 'failed' | 'active' | 'inactive' | 'connected' | 'disconnected' | string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, string> = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  connected: 'bg-green-500/10 text-green-400 border-green-500/20',
  disconnected: 'bg-red-500/10 text-red-400 border-red-500/20',
  premium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  free: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  member: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const statusDots: Record<string, string> = {
  success: 'bg-green-500',
  pending: 'bg-yellow-500',
  failed: 'bg-red-500',
  active: 'bg-green-500',
  inactive: 'bg-zinc-500',
  connected: 'bg-green-500',
  disconnected: 'bg-red-500',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = statusStyles[status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  const dot = statusDots[status];
  const sizeClass = size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-3 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider border font-mono ${style} ${sizeClass}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {status}
    </span>
  );
}
