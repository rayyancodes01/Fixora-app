import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'rose' | 'amber' | 'cyan' | 'indigo' | 'purple' | 'zinc';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'zinc',
  trend
}) => {
  const colorMap = {
    purple: {
      border: 'border-[#8B5CF6]/30',
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6]',
      badge: 'text-[#8B5CF6] bg-[#8B5CF6]/10',
      glow: 'from-[#8B5CF6]/10 to-transparent'
    },
    emerald: {
      border: 'border-[#22C55E]/20',
      iconBg: 'bg-[#22C55E]/10 text-[#22C55E]',
      badge: 'text-[#22C55E] bg-[#22C55E]/10',
      glow: 'from-[#22C55E]/5 to-transparent'
    },
    rose: {
      border: 'border-[#EF4444]/25',
      iconBg: 'bg-[#EF4444]/15 text-[#EF4444]',
      badge: 'text-[#EF4444] bg-[#EF4444]/10',
      glow: 'from-[#EF4444]/5 to-transparent'
    },
    amber: {
      border: 'border-[#F59E0B]/20',
      iconBg: 'bg-[#F59E0B]/10 text-[#F59E0B]',
      badge: 'text-[#F59E0B] bg-[#F59E0B]/10',
      glow: 'from-[#F59E0B]/5 to-transparent'
    },
    cyan: {
      border: 'border-[#06B6D4]/25',
      iconBg: 'bg-[#06B6D4]/15 text-[#06B6D4]',
      badge: 'text-[#06B6D4] bg-[#06B6D4]/10',
      glow: 'from-[#06B6D4]/10 to-transparent'
    },
    indigo: {
      border: 'border-[#8B5CF6]/25',
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6]',
      badge: 'text-[#8B5CF6] bg-[#8B5CF6]/10',
      glow: 'from-[#8B5CF6]/5 to-transparent'
    },
    zinc: {
      border: 'border-white/[0.06]',
      iconBg: 'bg-[#12121A] text-[#A1A1AA]',
      badge: 'text-[#A1A1AA] bg-[#12121A]',
      glow: 'from-white/[0.02] to-transparent'
    }
  };

  const current = colorMap[variant] || colorMap.zinc;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#0F0F14] border ${current.border} p-5 transition-all duration-200 hover:border-white/20 hover:shadow-lg`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${current.glow} pointer-events-none`} />
      
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#A1A1AA]">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${current.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="relative mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F7] font-mono">
          {value}
        </span>
        {trend && (
          <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${current.badge}`}>
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="relative mt-1 text-[11px] text-[#A1A1AA] font-mono truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

