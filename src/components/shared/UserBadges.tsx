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

  if (cs2Wins != null && cs2Wins > 0 && !compact) {
    badges.push(
      <span
        key="wins"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cs-green/15 text-cs-green"
        title={`${cs2Wins.toLocaleString()} competitive wins`}
      >
        {cs2Wins.toLocaleString()}W
      </span>
    );
  }

  if (faceitLevel != null && faceitLevel > 0) {
    badges.push(
      <span
        key="faceit"
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-cs-gold/15 text-cs-gold"
        title={`FACEIT Level ${faceitLevel}`}
      >
        LVL{faceitLevel}
      </span>
    );
  }

  if (ownsCs2 === true && !compact) {
    badges.push(
      <span key="owns" title="Owns CS2">
        <CheckCircle className="h-3.5 w-3.5 text-cs-green" />
      </span>
    );
  }

  if (profileVisibility != null && profileVisibility !== 3 && !compact) {
    badges.push(
      <span key="private" title="Private profile">
        <Lock className="h-3 w-3 text-muted-foreground/50" />
      </span>
    );
  }

  if (badges.length === 0) return null;

  return <span className="inline-flex items-center gap-1">{badges}</span>;
}
