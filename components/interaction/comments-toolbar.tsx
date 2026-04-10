"use client";

import { SearchIcon } from "lucide-react";
import {
  commentStatusOptions,
  interactionTargetOptions,
} from "@/lib/interaction/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CommentsToolbarProps = {
  query: string;
  status: "all" | "PENDING" | "VISIBLE" | "HIDDEN" | "DELETED";
  targetType: "all" | "CONTENT" | "COURSE" | "COURSE_LESSON";
  onQueryChange: (value: string) => void;
  onStatusChange: (value: "all" | "PENDING" | "VISIBLE" | "HIDDEN" | "DELETED") => void;
  onTargetTypeChange: (value: "all" | "CONTENT" | "COURSE" | "COURSE_LESSON") => void;
};

export function CommentsToolbar({
  query,
  status,
  targetType,
  onQueryChange,
  onStatusChange,
  onTargetTypeChange,
}: CommentsToolbarProps) {
  return (
    <div className="toolbar-row">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="pl-10"
          placeholder="Search guest name, email, or comment text"
        />
      </div>

      <Select value={status} onValueChange={(value) => onStatusChange(value as CommentsToolbarProps["status"])}>
        <SelectTrigger className="w-[11.5rem]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {commentStatusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={targetType} onValueChange={(value) => onTargetTypeChange(value as CommentsToolbarProps["targetType"])}>
        <SelectTrigger className="w-[11.5rem]">
          <SelectValue placeholder="Target" />
        </SelectTrigger>
        <SelectContent>
          {interactionTargetOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
