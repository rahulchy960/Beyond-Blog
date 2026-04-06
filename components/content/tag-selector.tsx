"use client";

import { useMemo, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TagOption = {
  id: string;
  name: string;
  slug: string;
};

type TagSelectorProps = {
  value: string[];
  availableTags: TagOption[];
  onChange: (next: string[]) => void;
};

function normalizeTag(value: string) {
  return value.trim();
}

export function TagSelector({ value, availableTags, onChange }: TagSelectorProps) {
  const [tagInput, setTagInput] = useState("");

  const availableSuggestions = useMemo(() => {
    const selected = new Set(value.map((tag) => tag.toLowerCase()));
    return availableTags.filter((tag) => !selected.has(tag.name.toLowerCase()));
  }, [availableTags, value]);

  const addTag = (name: string) => {
    const normalized = normalizeTag(name);
    if (!normalized) {
      return;
    }

    if (value.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      return;
    }

    onChange([...value, normalized]);
    setTagInput("");
  };

  const removeTag = (name: string) => {
    onChange(value.filter((tag) => tag.toLowerCase() !== name.toLowerCase()));
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="tags">Tags</Label>

      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3" />
              <span className="sr-only">Remove {tag}</span>
            </button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          id="tags"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag(tagInput);
            }
          }}
          placeholder="Add tag and press Enter"
        />
        <button
          type="button"
          onClick={() => addTag(tagInput)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <PlusIcon className="size-4" />
          Add
        </button>
      </div>

      {availableSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.slice(0, 12).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag.name)}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2")}
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
