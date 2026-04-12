import type { FieldErrors, FieldValues } from "react-hook-form";
import { AlertTriangleIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FormErrorSummaryProps<TFieldValues extends FieldValues> = {
  errors: FieldErrors<TFieldValues>;
  serverError?: string | null;
  className?: string;
};

function collectMessages(value: unknown, messages: string[]) {
  if (!value || typeof value !== "object") {
    return;
  }

  if ("message" in value && typeof value.message === "string" && value.message.trim().length > 0) {
    messages.push(value.message);
  }

  for (const [key, nested] of Object.entries(value)) {
    if (key === "message" || key === "type" || key === "ref") {
      continue;
    }
    collectMessages(nested, messages);
  }
}

export function FormErrorSummary<TFieldValues extends FieldValues>({
  errors,
  serverError,
  className,
}: FormErrorSummaryProps<TFieldValues>) {
  const messages: string[] = [];
  collectMessages(errors, messages);

  const deduped = Array.from(new Set(messages));
  if (serverError) {
    deduped.unshift(serverError);
  }

  if (deduped.length === 0) {
    return null;
  }

  return (
    <Card className={cn("surface-panel border-destructive/35", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <span className="inline-flex size-8 items-center justify-center rounded-md border border-destructive/35 bg-destructive/10">
            <AlertTriangleIcon className="size-4" />
          </span>
          Resolve the following before continuing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm text-destructive/90">
          {deduped.map((message, index) => (
            <li key={`${message}-${index}`} className="leading-6">
              {message}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
