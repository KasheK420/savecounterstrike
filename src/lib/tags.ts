export interface TagDefinition {
  id: string;
  label: string;
  color: string;
  category: string;
}

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: "bg-cs-red/10", text: "text-cs-red", border: "border-cs-red/20" },
  orange: { bg: "bg-cs-orange/10", text: "text-cs-orange", border: "border-cs-orange/20" },
  blue: { bg: "bg-cs-blue/10", text: "text-cs-blue", border: "border-cs-blue/20" },
  gold: { bg: "bg-cs-gold/10", text: "text-cs-gold", border: "border-cs-gold/20" },
  green: { bg: "bg-cs-green/10", text: "text-cs-green", border: "border-cs-green/20" },
  purple: { bg: "bg-[#9b59b6]/10", text: "text-[#9b59b6]", border: "border-[#9b59b6]/20" },
  cyan: { bg: "bg-[#00bcd4]/10", text: "text-[#00bcd4]", border: "border-[#00bcd4]/20" },
};

export const TAGS: TagDefinition[] = [
  // Anti-cheat
  { id: "anti-cheat", label: "Anti-Cheat", color: "red", category: "Anti-Cheat" },
  { id: "vac", label: "VAC", color: "red", category: "Anti-Cheat" },
  { id: "overwatch", label: "Overwatch", color: "orange", category: "Anti-Cheat" },
  { id: "cheaters", label: "Cheaters", color: "red", category: "Anti-Cheat" },

  // Gameplay
  { id: "matchmaking", label: "Matchmaking", color: "blue", category: "Gameplay" },
  { id: "competitive", label: "Competitive", color: "blue", category: "Gameplay" },
  { id: "premier", label: "Premier", color: "gold", category: "Gameplay" },
  { id: "casual", label: "Casual", color: "green", category: "Gameplay" },

  // Technical
  { id: "performance", label: "Performance", color: "green", category: "Technical" },
  { id: "bugs", label: "Bugs", color: "orange", category: "Technical" },
  { id: "ui-ux", label: "UI/UX", color: "purple", category: "Technical" },
  { id: "servers", label: "Servers", color: "blue", category: "Technical" },

  // Community & Valve
  { id: "communication", label: "Communication", color: "cyan", category: "Community" },
  { id: "transparency", label: "Transparency", color: "cyan", category: "Community" },
  { id: "community", label: "Community", color: "green", category: "Community" },
  { id: "valve", label: "Valve", color: "red", category: "Community" },

  // Content
  { id: "skins", label: "Skins & Cases", color: "gold", category: "Content" },
  { id: "maps", label: "Maps", color: "green", category: "Content" },
  { id: "esports", label: "Esports", color: "blue", category: "Content" },

  // Meta
  { id: "suggestion", label: "Suggestion", color: "purple", category: "Meta" },
  { id: "rant", label: "Rant", color: "red", category: "Meta" },
  { id: "evidence", label: "Evidence", color: "orange", category: "Meta" },
  { id: "discussion", label: "Discussion", color: "cyan", category: "Meta" },
];

export function getTagById(id: string): TagDefinition | undefined {
  return TAGS.find((t) => t.id === id);
}

export function getTagColors(color: string) {
  return TAG_COLORS[color] || TAG_COLORS.blue;
}
