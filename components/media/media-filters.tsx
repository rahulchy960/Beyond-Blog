"use client";

import { SearchIcon } from "lucide-react";
import { MEDIA_TYPE, type MediaType } from "@/lib/content/enums";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type MediaFiltersProps = {
  type: "all" | MediaType;
  query: string;
  onTypeChange: (value: "all" | MediaType) => void;
  onQueryChange: (value: string) => void;
};

export function MediaFilters({ type, query, onTypeChange, onQueryChange }: MediaFiltersProps) {
  return (
    <div className="toolbar-row">
      <Select value={type} onValueChange={(value) => onTypeChange((value ?? "all") as "all" | MediaType)}>
        <SelectTrigger className="w-[12rem]">
          <SelectValue placeholder="Media type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All media types</SelectItem>
          <SelectItem value={MEDIA_TYPE.IMAGE}>Images</SelectItem>
          <SelectItem value={MEDIA_TYPE.FILE}>Files</SelectItem>
          <SelectItem value={MEDIA_TYPE.VIDEO}>Videos</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by filename, title, alt text"
          className="pl-10"
        />
      </div>
    </div>
  );
}
