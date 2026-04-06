import { WandSparklesIcon } from "lucide-react";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SlugInputProps = {
  value: string;
  onChange: (nextValue: string) => void;
  onRegenerate: () => void;
};

export function SlugInput({ value, onChange, onRegenerate }: SlugInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="slug">Slug</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="slug"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="my-content-slug"
        />
        <button
          type="button"
          onClick={onRegenerate}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <WandSparklesIcon className="size-4" />
          Regenerate
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Use lowercase letters, numbers, and hyphens.</p>
    </div>
  );
}
