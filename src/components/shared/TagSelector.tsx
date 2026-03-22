"use client";

import { TAGS, getTagColors } from "@/lib/tags";

interface TagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}

export function TagSelector({
  selected,
  onChange,
  max = 5,
}: TagSelectorProps) {
  function toggle(tagId: string) {
    if (selected.includes(tagId)) {
      onChange(selected.filter((t) => t !== tagId));
    } else if (selected.length < max) {
      onChange([...selected, tagId]);
    }
  }

  // Group by category
  const categories = TAGS.reduce(
    (acc, tag) => {
      if (!acc[tag.category]) acc[tag.category] = [];
      acc[tag.category].push(tag);
      return acc;
    },
    {} as Record<string, typeof TAGS>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          Tags{" "}
          <span className="text-muted-foreground font-normal">
            ({selected.length}/{max})
          </span>
        </label>
      </div>
      <div className="space-y-2">
        {Object.entries(categories).map(([category, tags]) => (
          <div key={category} className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-muted-foreground/50 w-16 shrink-0 uppercase tracking-wider">
              {category}
            </span>
            {tags.map((tag) => {
              const isSelected = selected.includes(tag.id);
              const colors = getTagColors(tag.color);
              const disabled = !isSelected && selected.length >= max;

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  disabled={disabled}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                    isSelected
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : "bg-muted/20 text-muted-foreground/60 border-border/20 hover:border-border/40"
                  } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
