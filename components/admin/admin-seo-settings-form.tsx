"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SaveIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/hooks/use-trpc";
import { adminSeoSettingsInputSchema } from "@/lib/seo/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type SeoSettingsFormInput = z.input<typeof adminSeoSettingsInputSchema>;
type SeoSettingsFormOutput = z.output<typeof adminSeoSettingsInputSchema>;

export function AdminSeoSettingsForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<SeoSettingsFormInput, unknown, SeoSettingsFormOutput>({
    resolver: zodResolver(adminSeoSettingsInputSchema),
    defaultValues: {
      siteTitle: "Beyond Blog",
      titleTemplate: "%s | Beyond Blog",
      defaultDescription: "",
      siteUrl: "",
      defaultOgImageUrl: "",
      noIndexSearchPage: true,
      allowIndexing: true,
      twitterHandle: "",
    },
  });

  const settingsQuery = useQuery(trpc.profile.getSeoSettings.queryOptions());

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    form.reset({
      siteTitle: settingsQuery.data.siteTitle,
      titleTemplate: settingsQuery.data.titleTemplate,
      defaultDescription: settingsQuery.data.defaultDescription,
      siteUrl: settingsQuery.data.siteUrl,
      defaultOgImageUrl: settingsQuery.data.defaultOgImageUrl ?? "",
      noIndexSearchPage: settingsQuery.data.noIndexSearchPage,
      allowIndexing: settingsQuery.data.allowIndexing,
      twitterHandle: settingsQuery.data.twitterHandle ?? "",
    });
  }, [form, settingsQuery.data]);

  const updateMutation = useMutation(
    trpc.profile.updateSeoSettings.mutationOptions({
      onSuccess: async () => {
        toast.success("SEO settings updated.");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.profile.pathKey() }),
        ]);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const values = useWatch({ control: form.control });
  const asTrimmed = (value: unknown) =>
    typeof value === "string" ? value.trim() : "";

  const siteTitle = asTrimmed(values.siteTitle) || "Beyond Blog";
  const defaultDescription =
    asTrimmed(values.defaultDescription) ||
    "Editorial publications, courses, and public quizzes.";
  const titleTemplate = asTrimmed(values.titleTemplate);
  const previewTitle = titleTemplate.includes("%s")
    ? titleTemplate.replace("%s", "Sample page")
    : `Sample page | ${siteTitle}`;

  const onSubmit = (data: SeoSettingsFormOutput) => {
    updateMutation.mutate({
      siteTitle: data.siteTitle,
      titleTemplate: data.titleTemplate ?? null,
      defaultDescription: data.defaultDescription ?? null,
      siteUrl: data.siteUrl ?? null,
      defaultOgImageUrl: data.defaultOgImageUrl ?? null,
      noIndexSearchPage: data.noIndexSearchPage,
      allowIndexing: data.allowIndexing,
      twitterHandle: data.twitterHandle ?? null,
    });
  };

  if (settingsQuery.isPending) {
    return <div className="surface-panel rounded-xl p-6 text-sm">Loading SEO settings...</div>;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="SEO & Metadata Settings"
        description="Set global metadata defaults, indexing behavior, and social share fallbacks."
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Site Metadata Defaults</CardTitle>
              <CardDescription>
                These values are used when content-level SEO fields are empty.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="seo-site-title">Site title</Label>
                <Input id="seo-site-title" {...form.register("siteTitle")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-title-template">Title template</Label>
                <Input id="seo-title-template" {...form.register("titleTemplate")} placeholder="%s | Beyond Blog" />
                <p className="text-xs text-muted-foreground">Use `%s` where page title should appear.</p>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="seo-default-description">Default description</Label>
                <Textarea
                  id="seo-default-description"
                  rows={4}
                  {...form.register("defaultDescription")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Canonical & Social</CardTitle>
              <CardDescription>Configure base URL and social preview defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seo-site-url">Site URL</Label>
                <Input id="seo-site-url" {...form.register("siteUrl")} placeholder="https://beyondblog.example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-og-image">Default Open Graph image URL</Label>
                <Input id="seo-og-image" {...form.register("defaultOgImageUrl")} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-twitter">Twitter/X handle</Label>
                <Input id="seo-twitter" {...form.register("twitterHandle")} placeholder="@beyondblog" />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Indexing Rules</CardTitle>
              <CardDescription>Control robots directives for discoverability.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Allow indexing site-wide</p>
                  <p className="text-xs text-muted-foreground">Disabling sets `noindex, nofollow` globally.</p>
                </div>
                <Switch
                  checked={values.allowIndexing ?? true}
                  onCheckedChange={(checked) => form.setValue("allowIndexing", checked)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Noindex search page</p>
                  <p className="text-xs text-muted-foreground">Prevents `/search` result pages from being indexed.</p>
                </div>
                <Switch
                  checked={values.noIndexSearchPage ?? true}
                  onCheckedChange={(checked) => form.setValue("noIndexSearchPage", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Metadata Preview</CardTitle>
              <CardDescription>Approximate search and social preview output.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 rounded-lg border border-border/70 bg-background/60 p-3">
                <p className="truncate text-sm font-semibold">{previewTitle}</p>
                <p className="truncate text-xs text-primary">
                  {(asTrimmed(values.siteUrl) || "https://example.com") + "/sample-page"}
                </p>
                <p className="line-clamp-3 text-xs leading-6 text-muted-foreground">
                  {defaultDescription}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-xs leading-6 text-muted-foreground">
                <p>Fallback order:</p>
                <p>1. Content SEO title/description</p>
                <p>2. Site SEO defaults</p>
                <p>3. Built-in Beyond Blog defaults</p>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateMutation.isPending} className="w-full">
            <SaveIcon className="size-4" />
            Save SEO Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
