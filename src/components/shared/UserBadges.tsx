import { Gamepad2, Award } from "lucide-react";

interface UserBadgesProps {
  ownsCs2?: boolean | null;
  cs2PlaytimeHours?: number | null;
  cs2Wins?: number | null;
  cs2Kills?: number | null;
  faceitLevel?: number | null;
  profileVisibility?: number | null;
  karma?: number | null;
  hidePlaytime?: boolean | null;
  hideFaceit?: boolean | null;
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
  cs2PlaytimeHours,
  faceitLevel,
  karma,
  hidePlaytime,
  hideFaceit,
  compact = false,
}: UserBadgesProps) {
  const badges: React.ReactNode[] = [];

  if (!hidePlaytime && cs2PlaytimeHours != null && cs2PlaytimeHours > 0) {
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

  if (karma != null && karma !== 0 && !compact) {
    badges.push(
      <span
        key="karma"
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
          karma > 0 ? "bg-cs-gold/15 text-cs-gold" : "bg-cs-red/15 text-cs-red"
        }`}
        title={`${karma} karma`}
      >
        <Award className="h-2.5 w-2.5" />
        {karma}
      </span>
    );
  }

  if (!hideFaceit && faceitLevel != null && faceitLevel > 0) {
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
