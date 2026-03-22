import { getTagById, getTagColors } from "@/lib/tags";

interface TagBadgeProps {
  tagId: string;
  onClick?: () => void;
  active?: boolean;
}

export function TagBadge({ tagId, onClick, active }: TagBadgeProps) {
  const tag = getTagById(tagId);
  if (!tag) return null;

  const colors = getTagColors(tag.color);
  const Component = onClick ? "button" : "span";

  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
        active !== false
          ? `${colors.bg} ${colors.text} ${colors.border}`
          : "bg-muted/30 text-muted-foreground border-border/30"
      } ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      {tag.label}
    </Component>
  );
}

export function TagList({
  tags,
  onTagClick,
}: {
  tags: string[];
  onTagClick?: (tagId: string) => void;
}) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tagId) => (
        <TagBadge
          key={tagId}
          tagId={tagId}
          onClick={onTagClick ? () => onTagClick(tagId) : undefined}
        />
      ))}
    </div>
  );
}
