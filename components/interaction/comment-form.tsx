"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SendHorizonalIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const commentFormSchema = z.object({
  guestName: z.string().trim().min(2).max(80),
  guestEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  guestWebsite: z.string().trim().url().max(2048).optional().or(z.literal("")),
  body: z.string().trim().min(3).max(5000),
  honeypot: z.string().max(0),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;

type CommentFormProps = {
  onSubmit: (values: CommentFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function CommentForm({ onSubmit, isSubmitting }: CommentFormProps) {
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      guestWebsite: "",
      body: "",
      honeypot: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset({
      guestName: values.guestName,
      guestEmail: values.guestEmail ?? "",
      guestWebsite: values.guestWebsite ?? "",
      body: "",
      honeypot: "",
    });
  });

  return (
    <section className="surface-reading space-y-4 p-5 md:p-6">
      <div className="space-y-1.5">
        <p className="meta-kicker">Contribute</p>
        <h3 className="text-xl font-semibold tracking-tight">Add a thoughtful comment</h3>
        <p className="text-sm leading-7 text-muted-foreground">
          Keep feedback specific, concise, and useful for future readers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guestName">Name</Label>
            <Input id="guestName" placeholder="Your name" {...form.register("guestName")} />
            {form.formState.errors.guestName ? (
              <p className="text-xs text-destructive">{form.formState.errors.guestName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email (optional)</Label>
            <Input
              id="guestEmail"
              type="email"
              placeholder="you@example.com"
              {...form.register("guestEmail")}
            />
            {form.formState.errors.guestEmail ? (
              <p className="text-xs text-destructive">{form.formState.errors.guestEmail.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="guestWebsite">Website (optional)</Label>
          <Input
            id="guestWebsite"
            placeholder="https://your-site.com"
            {...form.register("guestWebsite")}
          />
          {form.formState.errors.guestWebsite ? (
            <p className="text-xs text-destructive">{form.formState.errors.guestWebsite.message}</p>
          ) : null}
        </div>

        <div className="hidden">
          <Label htmlFor="company">Company</Label>
          <Input id="company" tabIndex={-1} autoComplete="off" {...form.register("honeypot")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="commentBody">Comment</Label>
          <Textarea
            id="commentBody"
            rows={6}
            placeholder="Write your comment..."
            className="min-h-36 resize-y"
            {...form.register("body")}
          />
          {form.formState.errors.body ? (
            <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Comments may be reviewed before publication.</p>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <SendHorizonalIcon className="size-4" />
                Post Comment
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
