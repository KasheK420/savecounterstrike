import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "text-cs-orange",
}: StatCardProps) {
  return (
    <div className="cs-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-heading">
          {title}
        </span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="cs-stat-number text-2xl font-heading text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
