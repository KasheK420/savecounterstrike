import { Gamepad2, CheckCircle, Lock } from "lucide-react";

interface UserBadgesProps {
  ownsCs2?: boolean | null;
  cs2PlaytimeHours?: number | null;
  cs2Wins?: number | null;
  cs2Kills?: number | null;
  faceitLevel?: number | null;
  profileVisibility?: number | null;
  compact?: boolean;
}

function getFaceitColor(level: number): string {
  if (level <= 1) return "bg-[#CCC]/15 text-[#CCC]";
  if (level <= 3) return "bg-[#1CE400]/15 text-[#1CE400]";
  if (level <= 6) return "bg-[#FFC800]/15 text-[#FFC800]";
  if (level <= 9) return "bg-[#FF6309]/15 text-[#FF6309]";
  return "bg-[#FF0000]/15 text-[#FF0000]";
}

export function UserBadges({
  ownsCs2,
  cs2PlaytimeHours,
  cs2Wins,
  faceitLevel,
  profileVisibility,
  compact = false,
}: UserBadgesProps) {
  const badges: React.ReactNode[] = [];

  if (cs2PlaytimeHours != null && cs2PlaytimeHours > 0) {
    badges.push(
      <span
        key="playtime"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cs-orange/15 text-cs-orange"
        title={`${cs2PlaytimeHours.toLocaleString()} hours in CS2`}
      >
        <Gamepad2 className="h-2.5 w-2.5" />
        {cs2PlaytimeHours.toLocaleString()}h
      </span>
    );
  }

  if (faceitLevel != null && faceitLevel > 0) {
    badges.push(
      <span
        key="faceit"
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${getFaceitColor(faceitLevel)}`}
        title={`FACEIT Level ${faceitLevel}`}
      >
        FACEIT {faceitLevel}
      </span>
    );
  }

  if (badges.length === 0) return null;

  return <span className="inline-flex items-center gap-1">{badges}</span>;
}
