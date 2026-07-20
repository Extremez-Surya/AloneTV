'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  accentColor?: string;
  icon?: string;
}

export default function StatCard({ label, value, subtitle, trend, accentColor = 'purple', icon }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const targetValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        setDisplayValue(targetValue);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [targetValue]);

  const colorMap: Record<string, string> = {
    purple: 'from-purple-500/20 to-purple-500/5',
    amber: 'from-amber-500/20 to-amber-500/5',
    teal: 'from-teal-500/20 to-teal-500/5',
    green: 'from-green-500/20 to-green-500/5',
    blue: 'from-blue-500/20 to-blue-500/5',
    red: 'from-red-500/20 to-red-500/5',
    pink: 'from-pink-500/20 to-pink-500/5',
  };

  const formatValue = (val: number) => {
    const raw = typeof value === 'string' ? value : '';
    if (raw.includes('$')) return `$${val.toFixed(2)}`;
    if (raw.includes('%')) return `${Math.round(val)}%`;
    if (raw.includes('₹')) return `₹${Math.round(val)}`;
    if (Number.isInteger(targetValue)) return Math.round(val).toString();
    return val.toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/20 transition-all"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[accentColor] || colorMap.purple} rounded-full blur-3xl pointer-events-none`} />
      {icon && (
        <span className="absolute bottom-0 right-0 text-[80px] font-bold text-white/[0.02] pointer-events-none select-none leading-none mr-2 mb-2">
          {icon}
        </span>
      )}
      <div className="relative z-10">
        <p className="text-[10px] uppercase font-mono tracking-widest text-text-muted font-semibold">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-white mt-1.5 font-mono tracking-tight">
          {typeof value === 'number' ? formatValue(displayValue) : value}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {subtitle && <p className="text-[10px] text-text-muted">{subtitle}</p>}
          {trend && (
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              trend.positive ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
            }`}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
