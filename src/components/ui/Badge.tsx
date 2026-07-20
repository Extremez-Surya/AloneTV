interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium' | 'new' | 'hd' | '4k';
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-white/5 text-zinc-300 border border-white/10',
    premium: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/20',
    new: 'bg-green-500/10 text-green-400 border border-green-500/20',
    hd: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    '4k': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
}
