
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/core";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ImageIcon,
  PlusIcon,
  SaveIcon,
  SendHorizonalIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import { MediaPreview } from "@/components/media/media-preview";
import { SeoFields } from "@/components/content/seo-fields";
import { SlugInput } from "@/components/content/slug-input";
import { TiptapEditor } from "@/components/content/tiptap-editor";
import { useTRPC } from "@/hooks/use-trpc";
import { courseDifficultyLabels, courseDifficultyOptions, courseLessonTypeLabels, courseLessonTypeOptions, courseStatusOptions } from "@/lib/course/constants";
import { createCourseInputSchema } from "@/lib/course/schemas";
import {
  COURSE_LESSON_ITEM_TYPE,
  COURSE_STATUS,
  MEDIA_TYPE,
  type CourseDifficultyLevel,
  type CourseLessonItemType,
  type CourseStatus,
  type MediaType,
} from "@/lib/content/enums";
import { emptyRichTextDocument, normalizeRichTextDocument } from "@/lib/content/rich-text";
import { slugifyText } from "@/lib/content/slug";
import { toUserErrorMessage } from "@/lib/errors/client";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormErrorSummary } from "@/components/ui/form-error-summary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EditorPageSkeleton } from "@/components/ui/loading-skeletons";
import { PageHeader } from "@/components/ui/page-header";
import { RetryPanel } from "@/components/ui/retry-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const courseFormSchema = createCourseInputSchema;

type CourseFormValues = z.input<typeof courseFormSchema>;

type CourseEditorFormProps = {
  mode: "create" | "edit";
  courseId?: string;
};

type PickerMedia = {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  title: string | null;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
};

type LessonDraft = {
  id?: string;
  sectionId: string | null;
  title: string;
  slug: string;
  summary: string;
  itemType: CourseLessonItemType;
  bodyJson: JSONContent;
  mediaAssetId: string | null;
  media: PickerMedia | null;
  externalUrl: string;
  durationMinutes: string;
  isPreview: boolean;
  isPublished: boolean;
};

function getDefaultCourseValues(): CourseFormValues {
  return {
    title: "",
    slug: "",
    summary: "",
    descriptionJson: emptyRichTextDocument,
    coverImageId: null,
    difficultyLevel: null,
    estimatedDurationMinutes: null,
    isFeatured: false,
    seoTitle: "",
    seoDescription: "",
    status: COURSE_STATUS.DRAFT,
  };
}

function getEmptyLessonDraft(sectionId: string | null = null): LessonDraft {
  return {
    sectionId,
    title: "",
    slug: "",
    summary: "",
    itemType: COURSE_LESSON_ITEM_TYPE.RICH_TEXT,
    bodyJson: emptyRichTextDocument,
    mediaAssetId: null,
    media: null,
    externalUrl: "",
    durationMinutes: "",
    isPreview: false,
    isPublished: false,
  };
}

function allowedMediaTypesForLesson(itemType: CourseLessonItemType): MediaType[] {
  if (itemType === COURSE_LESSON_ITEM_TYPE.IMAGE) return [MEDIA_TYPE.IMAGE];
  if (itemType === COURSE_LESSON_ITEM_TYPE.VIDEO) return [MEDIA_TYPE.VIDEO];
  if (itemType === COURSE_LESSON_ITEM_TYPE.RESOURCE) return [MEDIA_TYPE.FILE];
  return [MEDIA_TYPE.IMAGE, MEDIA_TYPE.VIDEO, MEDIA_TYPE.FILE];
}

function moveInArray<T>(items: T[], fromIndex: number, toIndex: number) {
  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

export function CourseEditorForm({ mode, courseId }: CourseEditorFormProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverMedia, setCoverMedia] = useState<PickerMedia | null>(null);

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [sectionDialogMode, setSectionDialogMode] = useState<"create" | "edit">("create");
  const [sectionDraftId, setSectionDraftId] = useState<string | null>(null);
  const [sectionDraftTitle, setSectionDraftTitle] = useState("");
  const [sectionDraftDescription, setSectionDraftDescription] = useState("");

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonDialogMode, setLessonDialogMode] = useState<"create" | "edit">("create");
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(getEmptyLessonDraft());
  const [lessonMediaPickerOpen, setLessonMediaPickerOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: getDefaultCourseValues(),
  });

  const courseQuery = useQuery(
    trpc.course.getById.queryOptions(
      { id: courseId ?? "" },
      { enabled: Boolean(courseId) },
    ),
  );

  useEffect(() => {
    if (!courseQuery.data) return;

    form.reset({
      title: courseQuery.data.title,
      slug: courseQuery.data.slug,
      summary: courseQuery.data.summary ?? "",
      descriptionJson: (courseQuery.data.descriptionJson as JSONContent) ?? emptyRichTextDocument,
      coverImageId: courseQuery.data.coverImageId ?? null,
      difficultyLevel: courseQuery.data.difficultyLevel,
      estimatedDurationMinutes: courseQuery.data.estimatedDurationMinutes,
      isFeatured: courseQuery.data.isFeatured,
      seoTitle: courseQuery.data.seoTitle ?? "",
      seoDescription: courseQuery.data.seoDescription ?? "",
      status: courseQuery.data.status,
    });
  }, [courseQuery.data, form]);

  const invalidateCourseQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.course.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() }),
    ]);
  };

  const onMutationError = (error: unknown, fallback = "Unable to save course changes.") => {
    const message = toUserErrorMessage(error, fallback);
    setSubmitError(message);
    toast.error(message);
  };

  const createMutation = useMutation(
    trpc.course.create.mutationOptions({
      onSuccess: async (data) => {
        setSubmitError(null);
        toast.success("Course created.");
        await invalidateCourseQueries();
        router.push(`/admin/courses/${data.id}/edit`);
      },
      onError: (error) => onMutationError(error, "Unable to create course."),
    }),
  );

  const updateMutation = useMutation(
    trpc.course.update.mutationOptions({
      onSuccess: async () => {
        setSubmitError(null);
        toast.success("Course updated.");
        await invalidateCourseQueries();
        router.refresh();
      },
      onError: (error) => onMutationError(error, "Unable to update course."),
    }),
  );

  const createSectionMutation = useMutation(
    trpc.course.createSection.mutationOptions({
      onSuccess: async () => {
        setSubmitError(null);
        toast.success("Section added.");
        setSectionDialogOpen(false);
        setSectionDraftTitle("");
        setSectionDraftDescription("");
        await invalidateCourseQueries();
      },
      onError: (error) => onMutationError(error, "Unable to add section."),
    }),
  );

  const updateSectionMutation = useMutation(
    trpc.course.updateSection.mutationOptions({
      onSuccess: async () => {
        setSubmitError(null);
        toast.success("Section updated.");
        setSectionDialogOpen(false);
        await invalidateCourseQueries();
      },
      onError: (error) => onMutationError(error, "Unable to update section."),
    }),
  );

  const deleteSectionMutation = useMutation(
    trpc.course.deleteSection.mutationOptions({
      onSuccess: async () => {
        setSubmitError(null);
        toast.success("Section deleted.");
        await invalidateCourseQueries();
      },
      onError: (error) => onMutationError(error, "Unable to delete section."),
    }),
  );

  const reorderSectionsMutation = useMutation(
    trpc.course.reorderSections.mutationOptions({
      onSuccess: invalidateCourseQueries,
      onError: (error) => onMutationError(error, "Unable to reorder sections."),
    }),
  );

  const createLessonMutation = useMutation(
    trpc.course.createLesson.mutationOptions({
      onSuccess: async () => {
        setSubmitError(null);
        toast.success("Lesson added.");
        setLessonDialogOpen(false);
        setLessonDraft(getEmptyLessonDraft());
        await invalidateCourseQueries();
      },
      onError: (error) => onMutationError(error, "Unable to add lesson."),
    }),
  );

  const updateLessonMutation = useMutation(
    trpc.course.updateLesson.mutationOptions({
      onSuccess: async () => {
        setSubmitError(null);
        toast.success("Lesson updated.");
        setLessonDialogOpen(false);
        setLessonDraft(getEmptyLessonDraft());
        await invalidateCourseQueries();
      },
      onError: (error) => onMutationError(error, "Unable to update lesson."),
    }),
  );

  const deleteLessonMutation = useMutation(
    trpc.course.deleteLesson.mutationOptions({
      onSuccess: async () => {
        setSubmitError(null);
        toast.success("Lesson deleted.");
        await invalidateCourseQueries();
      },
      onError: (error) => onMutationError(error, "Unable to delete lesson."),
    }),
  );

  const reorderLessonsMutation = useMutation(
    trpc.course.reorderLessons.mutationOptions({
      onSuccess: invalidateCourseQueries,
      onError: (error) => onMutationError(error, "Unable to reorder lessons."),
    }),
  );

  const titleValue = useWatch({ control: form.control, name: "title" }) ?? "";
  const slugValue = useWatch({ control: form.control, name: "slug" }) ?? "";
  const descriptionJsonValue = useWatch({ control: form.control, name: "descriptionJson" });
  const seoTitleValue = useWatch({ control: form.control, name: "seoTitle" }) ?? "";
  const seoDescriptionValue = useWatch({ control: form.control, name: "seoDescription" }) ?? "";
  const statusValue = useWatch({ control: form.control, name: "status" }) ?? COURSE_STATUS.DRAFT;
  const featuredValue = useWatch({ control: form.control, name: "isFeatured" }) ?? false;
  const difficultyValue = useWatch({ control: form.control, name: "difficultyLevel" }) ?? "none";
  const estimatedDurationValue = useWatch({ control: form.control, name: "estimatedDurationMinutes" });
  const coverImageIdValue = useWatch({ control: form.control, name: "coverImageId" });

  useEffect(() => {
    if (slugManuallyEdited) return;
    form.setValue("slug", slugifyText(titleValue), { shouldValidate: true });
  }, [form, slugManuallyEdited, titleValue]);

  const courseData = courseQuery.data;
  const sections = courseData?.sections ?? [];
  const unsectionedLessons = courseData?.lessons ?? [];

  const selectedCover = useMemo(() => {
    if (coverMedia && coverMedia.id === coverImageIdValue) return coverMedia;
    if (!courseData?.coverImage || courseData.coverImage.id !== coverImageIdValue) return null;

    return {
      id: courseData.coverImage.id,
      type: MEDIA_TYPE.IMAGE,
      url: courseData.coverImage.url,
      thumbnailUrl: courseData.coverImage.thumbnailUrl,
      altText: courseData.coverImage.altText,
      title: courseData.coverImage.title,
      originalFilename: courseData.coverImage.originalFilename,
      mimeType: courseData.coverImage.mimeType,
      sizeBytes: courseData.coverImage.sizeBytes,
    } satisfies PickerMedia;
  }, [coverMedia, coverImageIdValue, courseData]);

  const onSubmit = (values: CourseFormValues) => {
    setSubmitError(null);
    const payload = {
      ...values,
      slug: slugifyText(values.slug),
      summary: values.summary?.trim() ? values.summary.trim() : null,
      seoTitle: values.seoTitle?.trim() ? values.seoTitle.trim() : null,
      seoDescription: values.seoDescription?.trim() ? values.seoDescription.trim() : null,
      coverImageId: values.coverImageId?.trim() ? values.coverImageId : null,
      difficultyLevel: values.difficultyLevel,
      estimatedDurationMinutes: values.estimatedDurationMinutes ?? null,
      descriptionJson: values.descriptionJson,
    };

    if (mode === "create") {
      createMutation.mutate(payload);
      return;
    }

    if (!courseId) {
      const message = "Missing course id.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    updateMutation.mutate({ id: courseId, ...payload });
  };

  const saveDraft = () => {
    form.setValue("status", COURSE_STATUS.DRAFT, { shouldValidate: true });
    form.handleSubmit(onSubmit)();
  };

  const publish = () => {
    form.setValue("status", COURSE_STATUS.PUBLISHED, { shouldValidate: true });
    form.handleSubmit(onSubmit)();
  };

  const openCreateSectionDialog = () => {
    setSectionDialogMode("create");
    setSectionDraftId(null);
    setSectionDraftTitle("");
    setSectionDraftDescription("");
    setSectionDialogOpen(true);
  };

  const openEditSectionDialog = (section: { id: string; title: string; description: string | null }) => {
    setSectionDialogMode("edit");
    setSectionDraftId(section.id);
    setSectionDraftTitle(section.title);
    setSectionDraftDescription(section.description ?? "");
    setSectionDialogOpen(true);
  };

  const moveSection = (sectionId: string, direction: "up" | "down") => {
    if (!courseData) return;
    const currentIndex = sections.findIndex((section) => section.id === sectionId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = moveInArray(sections, currentIndex, targetIndex);
    reorderSectionsMutation.mutate({
      courseId: courseData.id,
      sectionIds: reordered.map((section) => section.id),
    });
  };

  const openCreateLessonDialog = (sectionId: string | null) => {
    setLessonDialogMode("create");
    setLessonDraft(getEmptyLessonDraft(sectionId));
    setLessonDialogOpen(true);
  };

  const openEditLessonDialog = (lesson: {
    id: string;
    sectionId: string | null;
    title: string;
    slug: string | null;
    summary: string | null;
    itemType: CourseLessonItemType;
    bodyJson: JSONContent | null;
    mediaAssetId: string | null;
    mediaAsset: PickerMedia | null;
    externalUrl: string | null;
    durationMinutes: number | null;
    isPreview: boolean;
    publishedAt: Date | null;
  }) => {
    setLessonDialogMode("edit");
    setLessonDraft({
      id: lesson.id,
      sectionId: lesson.sectionId,
      title: lesson.title,
      slug: lesson.slug ?? "",
      summary: lesson.summary ?? "",
      itemType: lesson.itemType,
      bodyJson: (lesson.bodyJson as JSONContent) ?? emptyRichTextDocument,
      mediaAssetId: lesson.mediaAssetId,
      media: lesson.mediaAsset,
      externalUrl: lesson.externalUrl ?? "",
      durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : "",
      isPreview: lesson.isPreview,
      isPublished: Boolean(lesson.publishedAt),
    });
    setLessonDialogOpen(true);
  };

  const moveLesson = (
    lessons: Array<{ id: string }>,
    lessonId: string,
    sectionId: string | null,
    direction: "up" | "down",
  ) => {
    const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= lessons.length || !courseData) return;

    const reordered = moveInArray(lessons, currentIndex, targetIndex);
    reorderLessonsMutation.mutate({
      courseId: courseData.id,
      sectionId,
      lessonIds: reordered.map((lesson) => lesson.id),
    });
  };

  const saveSection = () => {
    if (!courseData) return;
    if (!sectionDraftTitle.trim()) {
      toast.error("Section title is required.");
      return;
    }

    if (sectionDialogMode === "create") {
      createSectionMutation.mutate({
        courseId: courseData.id,
        title: sectionDraftTitle,
        description: sectionDraftDescription || null,
      });
      return;
    }

    if (!sectionDraftId) return;
    updateSectionMutation.mutate({
      id: sectionDraftId,
      title: sectionDraftTitle,
      description: sectionDraftDescription || null,
    });
  };

  const saveLesson = () => {
    if (!courseData) return;

    const normalizedLessonBody =
      lessonDraft.itemType === COURSE_LESSON_ITEM_TYPE.RICH_TEXT
        ? (normalizeRichTextDocument(lessonDraft.bodyJson) as {
            type: string;
            content?: unknown[];
          })
        : null;

    const payload = {
      courseId: courseData.id,
      sectionId: lessonDraft.sectionId,
      title: lessonDraft.title,
      slug: lessonDraft.slug.trim() ? slugifyText(lessonDraft.slug) : null,
      summary: lessonDraft.summary.trim() ? lessonDraft.summary : null,
      itemType: lessonDraft.itemType,
      bodyJson: normalizedLessonBody,
      mediaAssetId: lessonDraft.mediaAssetId,
      externalUrl: lessonDraft.externalUrl.trim() ? lessonDraft.externalUrl.trim() : null,
      durationMinutes: lessonDraft.durationMinutes.trim() ? Number(lessonDraft.durationMinutes.trim()) : null,
      isPreview: lessonDraft.isPreview,
      isPublished: lessonDraft.isPublished,
    };

    if (!payload.title.trim()) {
      toast.error("Lesson title is required.");
      return;
    }

    if (lessonDialogMode === "create") {
      createLessonMutation.mutate(payload);
      return;
    }

    if (!lessonDraft.id) return;
    updateLessonMutation.mutate({ id: lessonDraft.id, ...payload });
  };

  const isSavingCourse = createMutation.isPending || updateMutation.isPending;

  if (mode === "edit" && courseQuery.isPending) {
    return <EditorPageSkeleton />;
  }

  if (mode === "edit" && courseQuery.isError) {
    return (
      <RetryPanel
        title="Unable to load course editor"
        error={courseQuery.error}
        onRetry={() => courseQuery.refetch()}
        retryLabel="Reload course"
      />
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title={mode === "create" ? "New Course" : "Edit Course"}
        description="Build a polished course experience with metadata, modules, and lesson sequencing."
        actions={
          <>
            <Link href="/admin/courses" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
              <ArrowLeftIcon className="size-4" />
              Back to Courses
            </Link>
            {mode === "edit" ? <Badge variant="secondary">{statusValue.toLowerCase()}</Badge> : null}
          </>
        }
      />

      <FormErrorSummary errors={form.formState.errors} serverError={submitError} />
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Course Metadata</CardTitle>
              <CardDescription>Define discoverability, course framing, and SEO context before arranging modules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="course-title">Title</Label>
                <Input id="course-title" placeholder="Course title" {...form.register("title")} />
              </div>

              <SlugInput
                value={slugValue}
                onChange={(value) => {
                  setSlugManuallyEdited(true);
                  form.setValue("slug", slugifyText(value), { shouldValidate: true });
                }}
                onRegenerate={() => {
                  setSlugManuallyEdited(false);
                  form.setValue("slug", slugifyText(form.getValues("title")), { shouldValidate: true });
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="course-summary">Summary</Label>
                <Textarea id="course-summary" rows={4} {...form.register("summary")} />
              </div>

              <div className="space-y-2">
                <Label>Course Description</Label>
                <TiptapEditor
                  value={(descriptionJsonValue as JSONContent) ?? emptyRichTextDocument}
                  onChange={(value) => form.setValue("descriptionJson", value as CourseFormValues["descriptionJson"], { shouldValidate: true })}
                />
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
                titleFallback={titleValue}
                descriptionFallback={form.getValues("summary") ?? ""}
                showHeader={false}
              />
            </CardContent>
          </Card>

          {mode === "edit" && courseData ? (
            <Card className="surface-panel">
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>Course Structure</CardTitle>
                  <CardDescription>Compose modules and lessons in the order visitors will read them.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={openCreateSectionDialog}>
                    <PlusIcon className="size-4" />
                    Add Section
                  </Button>
                  <Button type="button" size="sm" onClick={() => openCreateLessonDialog(null)}>
                    <PlusIcon className="size-4" />
                    Add Lesson
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sections.map((section, sectionIndex) => (
                  <div key={section.id} className="surface-inset space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium">{section.title}</p>
                        {section.description ? <p className="text-sm text-muted-foreground">{section.description}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button type="button" variant="ghost" size="icon-sm" disabled={sectionIndex === 0 || reorderSectionsMutation.isPending} onClick={() => moveSection(section.id, "up")}><ChevronUpIcon className="size-4" /></Button>
                        <Button type="button" variant="ghost" size="icon-sm" disabled={sectionIndex === sections.length - 1 || reorderSectionsMutation.isPending} onClick={() => moveSection(section.id, "down")}><ChevronDownIcon className="size-4" /></Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openEditSectionDialog(section)}>Edit</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => openCreateLessonDialog(section.id)}>Add Lesson</Button>
                        <Button type="button" variant="destructive" size="sm" onClick={() => { if (!window.confirm("Delete this section? Lessons become unsectioned.")) return; deleteSectionMutation.mutate({ id: section.id }); }}><Trash2Icon className="size-4" /></Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {section.lessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No lessons in this section yet.</p>
                      ) : (
                        section.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/65 px-3 py-2">
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-sm font-medium">{lesson.title}</p>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline">{courseLessonTypeLabels[lesson.itemType]}</Badge>
                                {lesson.isPreview ? <Badge variant="secondary">Preview</Badge> : null}
                                {lesson.publishedAt ? <Badge>Live</Badge> : <Badge variant="secondary">Draft</Badge>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button type="button" variant="ghost" size="icon-sm" disabled={lessonIndex === 0 || reorderLessonsMutation.isPending} onClick={() => moveLesson(section.lessons, lesson.id, section.id, "up")}><ChevronUpIcon className="size-4" /></Button>
                              <Button type="button" variant="ghost" size="icon-sm" disabled={lessonIndex === section.lessons.length - 1 || reorderLessonsMutation.isPending} onClick={() => moveLesson(section.lessons, lesson.id, section.id, "down")}><ChevronDownIcon className="size-4" /></Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => openEditLessonDialog(lesson)}>Edit</Button>
                              <Button type="button" variant="destructive" size="sm" onClick={() => { if (!window.confirm("Delete this lesson?")) return; deleteLessonMutation.mutate({ id: lesson.id }); }}><Trash2Icon className="size-4" /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}

                <div className="surface-inset space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">Unsectioned Lessons</p>
                      <p className="text-sm text-muted-foreground">Lessons that are not assigned to a section.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => openCreateLessonDialog(null)}>
                      <PlusIcon className="size-4" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {unsectionedLessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No unsectioned lessons.</p>
                    ) : (
                      unsectionedLessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/65 px-3 py-2">
                          <div className="min-w-0 space-y-0.5">
                            <p className="truncate text-sm font-medium">{lesson.title}</p>
                            <Badge variant="outline">{courseLessonTypeLabels[lesson.itemType]}</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="ghost" size="icon-sm" disabled={lessonIndex === 0 || reorderLessonsMutation.isPending} onClick={() => moveLesson(unsectionedLessons, lesson.id, null, "up")}><ChevronUpIcon className="size-4" /></Button>
                            <Button type="button" variant="ghost" size="icon-sm" disabled={lessonIndex === unsectionedLessons.length - 1 || reorderLessonsMutation.isPending} onClick={() => moveLesson(unsectionedLessons, lesson.id, null, "down")}><ChevronDownIcon className="size-4" /></Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditLessonDialog(lesson)}>Edit</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
              <CardDescription>Control discovery and visibility of this course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusValue} onValueChange={(value) => form.setValue("status", (value ?? COURSE_STATUS.DRAFT) as CourseStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{courseStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficultyValue ?? "none"} onValueChange={(value) => form.setValue("difficultyLevel", (value === "none" ? null : value) as CourseDifficultyLevel | null)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {courseDifficultyOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated-duration">Estimated Duration (minutes)</Label>
                <Input id="estimated-duration" type="number" value={estimatedDurationValue ?? ""} onChange={(event) => form.setValue("estimatedDurationMinutes", event.target.value ? Number(event.target.value) : null, { shouldValidate: true })} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                <Label htmlFor="featured-course">Featured</Label>
                <Switch id="featured-course" checked={featuredValue} onCheckedChange={(value) => form.setValue("isFeatured", value)} />
              </div>

              {difficultyValue && difficultyValue !== "none" ? <p className="text-xs text-muted-foreground">Difficulty: {courseDifficultyLabels[difficultyValue]}</p> : null}

              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" disabled={isSavingCourse} onClick={saveDraft}><SaveIcon className="size-4" />Save Draft</Button>
                <Button type="button" disabled={isSavingCourse} onClick={publish}><SendHorizonalIcon className="size-4" />Publish Course</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
              <CardDescription>Set a strong visual preview for course discovery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MediaPreview media={selectedCover} compact />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCoverPickerOpen(true)}><ImageIcon className="size-4" />Select Media</Button>
                {selectedCover ? <Button type="button" variant="ghost" size="sm" onClick={() => { setCoverMedia(null); form.setValue("coverImageId", null, { shouldDirty: true, shouldValidate: true }); }}>Remove</Button> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sectionDialogMode === "create" ? "Add section" : "Edit section"}</DialogTitle>
            <DialogDescription>Use sections to group lessons into clear modules.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="section-title">Section title</Label>
              <Input id="section-title" value={sectionDraftTitle} onChange={(event) => setSectionDraftTitle(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section-description">Description</Label>
              <Textarea id="section-description" value={sectionDraftDescription} rows={3} onChange={(event) => setSectionDraftDescription(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSection} disabled={createSectionMutation.isPending || updateSectionMutation.isPending}>Save section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{lessonDialogMode === "create" ? "Add lesson" : "Edit lesson"}</DialogTitle>
            <DialogDescription>Configure lesson type, content, and media.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-3">
              <div className="space-y-1.5"><Label htmlFor="lesson-title">Title</Label><Input id="lesson-title" value={lessonDraft.title} onChange={(event) => setLessonDraft((current) => ({ ...current, title: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label htmlFor="lesson-slug">Slug</Label><Input id="lesson-slug" value={lessonDraft.slug} onChange={(event) => setLessonDraft((current) => ({ ...current, slug: event.target.value }))} /></div>
              <div className="space-y-1.5"><Label htmlFor="lesson-summary">Summary</Label><Textarea id="lesson-summary" rows={3} value={lessonDraft.summary} onChange={(event) => setLessonDraft((current) => ({ ...current, summary: event.target.value }))} /></div>

              <div className="space-y-1.5">
                <Label>Lesson type</Label>
                <Select value={lessonDraft.itemType} onValueChange={(value) => setLessonDraft((current) => ({ ...current, itemType: (value ?? COURSE_LESSON_ITEM_TYPE.RICH_TEXT) as CourseLessonItemType, media: null, mediaAssetId: null }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{courseLessonTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {lessonDraft.itemType === COURSE_LESSON_ITEM_TYPE.RICH_TEXT ? (
                <div className="space-y-1.5">
                  <Label>Lesson body</Label>
                  <TiptapEditor value={lessonDraft.bodyJson} onChange={(value) => setLessonDraft((current) => ({ ...current, bodyJson: value }))} />
                </div>
              ) : null}

              <div className="space-y-1.5"><Label htmlFor="lesson-external-url">External URL</Label><Input id="lesson-external-url" value={lessonDraft.externalUrl} onChange={(event) => setLessonDraft((current) => ({ ...current, externalUrl: event.target.value }))} /></div>
            </div>

            <div className="space-y-4">
              <div className="surface-inset space-y-3 p-3">
                <p className="text-sm font-medium">Attached media</p>
                <MediaPreview media={lessonDraft.media} compact />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setLessonMediaPickerOpen(true)}>Choose media</Button>
                  {lessonDraft.media ? <Button type="button" size="sm" variant="ghost" onClick={() => setLessonDraft((current) => ({ ...current, media: null, mediaAssetId: null }))}>Remove</Button> : null}
                </div>
              </div>

              <div className="surface-inset space-y-3 p-3">
                <div className="space-y-1.5"><Label htmlFor="lesson-duration">Duration (minutes)</Label><Input id="lesson-duration" type="number" value={lessonDraft.durationMinutes} onChange={(event) => setLessonDraft((current) => ({ ...current, durationMinutes: event.target.value }))} /></div>
                <div className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2"><Label htmlFor="lesson-preview">Preview</Label><Switch id="lesson-preview" checked={lessonDraft.isPreview} onCheckedChange={(value) => setLessonDraft((current) => ({ ...current, isPreview: value }))} /></div>
                <div className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2"><Label htmlFor="lesson-published">Published</Label><Switch id="lesson-published" checked={lessonDraft.isPublished} onCheckedChange={(value) => setLessonDraft((current) => ({ ...current, isPublished: value }))} /></div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveLesson} disabled={createLessonMutation.isPending || updateLessonMutation.isPending}>Save lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        selectedMediaId={coverImageIdValue ?? null}
        types={[MEDIA_TYPE.IMAGE]}
        title="Select course cover image"
        description="Pick a reusable image from the media library for the course hero."
        onSelect={(media) => {
          setCoverMedia(media);
          form.setValue("coverImageId", media.id, { shouldDirty: true, shouldValidate: true });
        }}
      />

      <MediaPickerDialog
        open={lessonMediaPickerOpen}
        onOpenChange={setLessonMediaPickerOpen}
        selectedMediaId={lessonDraft.mediaAssetId}
        types={allowedMediaTypesForLesson(lessonDraft.itemType)}
        title="Select lesson media"
        description="Attach a media asset to this lesson."
        onSelect={(media) => setLessonDraft((current) => ({ ...current, media, mediaAssetId: media.id }))}
      />
    </div>
  );
}

