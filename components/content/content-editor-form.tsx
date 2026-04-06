"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, SendHorizonalIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CategorySelector } from "@/components/content/category-selector";
import { ContentStatusBadge } from "@/components/content/content-status-badge";
import { SeoFields } from "@/components/content/seo-fields";
import { SlugInput } from "@/components/content/slug-input";
import { TagSelector } from "@/components/content/tag-selector";
import { TiptapEditor } from "@/components/content/tiptap-editor";
import { useTRPC } from "@/hooks/use-trpc";
import { PUBLISH_STATUS, type ContentType, type PublishStatus } from "@/lib/content/enums";
import { contentTypeMeta, publishStatusOptions } from "@/lib/content/constants";
import { emptyRichTextDocument } from "@/lib/content/rich-text";
import { createContentInputSchema } from "@/lib/content/schemas";
import { slugifyText } from "@/lib/content/slug";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const editorFormSchema = createContentInputSchema.extend({
  categoryId: z.string().optional().nullable(),
});

type EditorFormValues = z.infer<typeof editorFormSchema>;

type ContentEditorFormProps = {
  mode: "create" | "edit";
  type: ContentType;
  contentId?: string;
};

function getDefaultValues(type: ContentType): EditorFormValues {
  return {
    title: "",
    slug: "",
    summary: "",
    bodyJson: emptyRichTextDocument,
    type,
    coverImageUrl: "",
    categoryId: null,
    tagNames: [],
    isFeatured: false,
    seoTitle: "",
    seoDescription: "",
    publishStatus: PUBLISH_STATUS.DRAFT,
  };
}

export function ContentEditorForm({ mode, type, contentId }: ContentEditorFormProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const contentMeta = contentTypeMeta[type];
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const form = useForm<EditorFormValues>({
    resolver: zodResolver(editorFormSchema),
    defaultValues: getDefaultValues(type),
  });

  const categoriesQuery = useQuery(trpc.content.listCategories.queryOptions());
  const tagsQuery = useQuery(trpc.content.listTags.queryOptions({}));
  const contentQuery = useQuery(
    trpc.content.getById.queryOptions(
      { id: contentId ?? "" },
      {
        enabled: Boolean(contentId),
      },
    ),
  );

  useEffect(() => {
    if (!contentQuery.data) {
      return;
    }

    form.reset({
      title: contentQuery.data.title,
      slug: contentQuery.data.slug,
      summary: contentQuery.data.summary ?? "",
      bodyJson: contentQuery.data.bodyJson as EditorFormValues["bodyJson"],
      type: contentQuery.data.type,
      coverImageUrl: contentQuery.data.coverImageUrl ?? "",
      categoryId: contentQuery.data.categoryId,
      tagNames: contentQuery.data.tagNames,
      isFeatured: contentQuery.data.isFeatured,
      seoTitle: contentQuery.data.seoTitle ?? "",
      seoDescription: contentQuery.data.seoDescription ?? "",
      publishStatus: contentQuery.data.publishStatus,
    });
  }, [contentQuery.data, form]);

  const titleValue = useWatch({ control: form.control, name: "title" }) ?? "";
  const slugValue = useWatch({ control: form.control, name: "slug" }) ?? "";
  const bodyJsonValue = useWatch({ control: form.control, name: "bodyJson" });
  const seoTitleValue = useWatch({ control: form.control, name: "seoTitle" }) ?? "";
  const seoDescriptionValue = useWatch({ control: form.control, name: "seoDescription" }) ?? "";
  const publishStatusValue =
    useWatch({ control: form.control, name: "publishStatus" }) ?? PUBLISH_STATUS.DRAFT;
  const isFeaturedValue = useWatch({ control: form.control, name: "isFeatured" }) ?? false;
  const categoryIdValue = useWatch({ control: form.control, name: "categoryId" }) ?? "none";
  const tagNamesValue = useWatch({ control: form.control, name: "tagNames" }) ?? [];

  useEffect(() => {
    if (slugManuallyEdited) {
      return;
    }

    const generatedSlug = slugifyText(titleValue);
    form.setValue("slug", generatedSlug, { shouldValidate: true });
  }, [form, slugManuallyEdited, titleValue]);

  const createMutation = useMutation(
    trpc.content.create.mutationOptions({
      onSuccess: async (data) => {
        toast.success(`${contentMeta.singular} created.`);
        await queryClient.invalidateQueries({ queryKey: trpc.content.pathKey() });
        await queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() });
        router.push(`${contentMeta.adminBasePath}/${data.id}/edit`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateMutation = useMutation(
    trpc.content.update.mutationOptions({
      onSuccess: async () => {
        toast.success(`${contentMeta.singular} updated.`);
        await queryClient.invalidateQueries({ queryKey: trpc.content.pathKey() });
        await queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() });
        router.refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const editorTitle = mode === "create" ? `New ${contentMeta.singular}` : `Edit ${contentMeta.singular}`;

  const saveDraft = () => {
    form.setValue("publishStatus", PUBLISH_STATUS.DRAFT, { shouldValidate: true });
    form.handleSubmit(onSubmit)();
  };

  const publish = () => {
    form.setValue("publishStatus", PUBLISH_STATUS.PUBLISHED, { shouldValidate: true });
    form.handleSubmit(onSubmit)();
  };

  const onSubmit = (values: EditorFormValues) => {
    const payload = {
      ...values,
      categoryId: values.categoryId && values.categoryId !== "none" ? values.categoryId : null,
      coverImageUrl: values.coverImageUrl?.trim() ? values.coverImageUrl.trim() : null,
      summary: values.summary?.trim() ? values.summary.trim() : null,
      seoTitle: values.seoTitle?.trim() ? values.seoTitle.trim() : null,
      seoDescription: values.seoDescription?.trim() ? values.seoDescription.trim() : null,
      slug: slugifyText(values.slug),
      type,
    };

    if (mode === "create") {
      createMutation.mutate(payload);
      return;
    }

    if (!contentId) {
      toast.error("Missing content ID.");
      return;
    }

    updateMutation.mutate({
      id: contentId,
      ...payload,
    });
  };

  const availableCategories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const availableTags = useMemo(() => tagsQuery.data ?? [], [tagsQuery.data]);

  if (mode === "edit" && contentQuery.isPending) {
    return <div className="surface-panel rounded-xl p-6 text-sm">Loading...</div>;
  }

  if (mode === "edit" && contentQuery.error) {
    return (
      <div className="surface-panel rounded-xl border-destructive/50 p-6 text-sm text-destructive">
        {contentQuery.error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={editorTitle}
        description={`Draft, publish, and maintain ${contentMeta.plural.toLowerCase()} in a consistent editorial workflow.`}
        currentLabel={editorTitle}
        actions={
          <>
            <Link
              href={contentMeta.adminBasePath}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              <ArrowLeftIcon className="size-4" />
              Back to {contentMeta.plural}
            </Link>
            {mode === "edit" ? <ContentStatusBadge status={publishStatusValue} /> : null}
          </>
        }
      />

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-6 lg:grid-cols-[1fr_330px]"
      >
        <AnimatedPageWrapper className="space-y-6">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>{editorTitle}</CardTitle>
              <CardDescription>
                Draft, publish, and archive entries using one consistent editorial workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder={`${contentMeta.singular} title`}
                  {...form.register("title")}
                />
                {form.formState.errors.title ? (
                  <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                ) : null}
              </div>

              <SlugInput
                value={slugValue}
                onChange={(value) => {
                  setSlugManuallyEdited(true);
                  form.setValue("slug", slugifyText(value), { shouldValidate: true });
                }}
                onRegenerate={() => {
                  setSlugManuallyEdited(false);
                  form.setValue("slug", slugifyText(form.getValues("title")), {
                    shouldValidate: true,
                  });
                }}
              />
              {form.formState.errors.slug ? (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  rows={4}
                  placeholder="Short summary shown in listings and previews."
                  {...form.register("summary")}
                />
              </div>

              <div className="space-y-2">
                <Label>Content Body</Label>
                <TiptapEditor
                  value={bodyJsonValue as EditorFormValues["bodyJson"]}
                  onChange={(value) =>
                    form.setValue("bodyJson", value as EditorFormValues["bodyJson"], {
                      shouldValidate: true,
                    })
                  }
                />
                {form.formState.errors.bodyJson ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.bodyJson.message as string}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <SeoFields
                seoTitle={seoTitleValue}
                seoDescription={seoDescriptionValue}
                onSeoTitleChange={(value) => form.setValue("seoTitle", value)}
                onSeoDescriptionChange={(value) => form.setValue("seoDescription", value)}
                showHeader={false}
              />
            </CardContent>
          </Card>
        </AnimatedPageWrapper>

        <AnimatedPageWrapper delay={0.04} className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Publish</CardTitle>
              <CardDescription>Control status and visibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={publishStatusValue}
                  onValueChange={(value) =>
                    form.setValue("publishStatus", (value ?? PUBLISH_STATUS.DRAFT) as PublishStatus, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {publishStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                <Label htmlFor="featuredToggle">Featured</Label>
                <Switch
                  id="featuredToggle"
                  checked={isFeaturedValue}
                  onCheckedChange={(checked) => form.setValue("isFeatured", checked)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={saveDraft}
                >
                  <SaveIcon className="size-4" />
                  Save Draft
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={publish}
                >
                  <SendHorizonalIcon className="size-4" />
                  Publish
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  placeholder="https://..."
                  {...form.register("coverImageUrl")}
                />
              </div>

              <CategorySelector
                categories={availableCategories}
                value={categoryIdValue}
                onValueChange={(value) => form.setValue("categoryId", value)}
              />

              <TagSelector
                value={tagNamesValue}
                availableTags={availableTags}
                onChange={(next) => form.setValue("tagNames", next, { shouldValidate: true })}
              />
            </CardContent>
          </Card>
        </AnimatedPageWrapper>
      </form>
    </div>
  );
}
