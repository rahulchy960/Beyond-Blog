"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  PlusIcon,
  SaveIcon,
  SendHorizonalIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import { MediaPreview } from "@/components/media/media-preview";
import { SeoFields } from "@/components/content/seo-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormErrorSummary } from "@/components/ui/form-error-summary";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/loading-skeletons";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { RetryPanel } from "@/components/ui/retry-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/hooks/use-trpc";
import {
  MEDIA_TYPE,
  QUIZ_QUESTION_TYPE,
  QUIZ_STATUS,
  type MediaType,
  type QuizQuestionType,
  type QuizStatus,
} from "@/lib/content/enums";
import { slugifyText } from "@/lib/content/slug";
import { toUserErrorMessage } from "@/lib/errors/client";
import {
  quizQuestionTypeLabels,
  quizQuestionTypeOptions,
  quizStatusOptions,
} from "@/lib/quiz/constants";
import { createQuizInputSchema } from "@/lib/quiz/schemas";
import { buttonVariants } from "@/lib/ui/button-variants";

const quizFormSchema = createQuizInputSchema;
type QuizFormInput = z.input<typeof quizFormSchema>;
type QuizFormValues = z.output<typeof quizFormSchema>;

type QuizBuilderProps = {
  mode: "create" | "edit";
  quizId?: string;
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

type QuestionDraft = {
  id?: string;
  questionText: string;
  questionType: QuizQuestionType;
  explanation: string;
  points: string;
};

type OptionDraft = {
  id?: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
};

function toQuizWriteInput(values: QuizFormValues): QuizFormInput {
  return {
    title: values.title,
    slug: values.slug,
    description: values.description ?? "",
    status: values.status,
    isFeatured: values.isFeatured,
    showAnswersAfterSubmit: values.showAnswersAfterSubmit,
    allowMultipleAttempts: values.allowMultipleAttempts,
    timeLimitMinutes: values.timeLimitMinutes ?? null,
    passingScore: values.passingScore ?? null,
    coverImageId: values.coverImageId ?? null,
    seoTitle: values.seoTitle ?? "",
    seoDescription: values.seoDescription ?? "",
    contentId: values.contentId ?? null,
    courseId: values.courseId ?? null,
    courseLessonId: values.courseLessonId ?? null,
  };
}

function getDefaultValues(): QuizFormInput {
  return {
    title: "",
    slug: "",
    description: "",
    status: QUIZ_STATUS.DRAFT,
    isFeatured: false,
    showAnswersAfterSubmit: true,
    allowMultipleAttempts: true,
    timeLimitMinutes: null,
    passingScore: null,
    coverImageId: null,
    seoTitle: "",
    seoDescription: "",
    contentId: null,
    courseId: null,
    courseLessonId: null,
  };
}

function getLinkType(values: Pick<QuizFormValues, "contentId" | "courseId" | "courseLessonId">) {
  if (values.courseLessonId) return "lesson";
  if (values.courseId) return "course";
  if (values.contentId) return "content";
  return "none";
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function QuizBuilder({ mode, quizId }: QuizBuilderProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [selectedCoverMedia, setSelectedCoverMedia] = useState<PickerMedia | null>(null);

  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft>({
    questionText: "",
    questionType: QUIZ_QUESTION_TYPE.SINGLE_CHOICE,
    explanation: "",
    points: "1",
  });

  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [optionDraft, setOptionDraft] = useState<OptionDraft>({
    questionId: "",
    optionText: "",
    isCorrect: false,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<QuizFormInput, unknown, QuizFormValues>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: getDefaultValues(),
  });

  const quizQuery = useQuery(
    trpc.quiz.getById.queryOptions(
      { id: quizId ?? "" },
      { enabled: mode === "edit" && Boolean(quizId) },
    ),
  );

  const linkTargetsQuery = useQuery(trpc.quiz.listLinkTargets.queryOptions());

  const attemptsQuery = useQuery(
    trpc.quiz.listAttempts.queryOptions(
      { quizId: quizId ?? "", limit: 10 },
      { enabled: mode === "edit" && Boolean(quizId) },
    ),
  );

  const analyticsQuery = useQuery(
    trpc.quiz.analytics.queryOptions(
      { quizId: quizId ?? "" },
      { enabled: mode === "edit" && Boolean(quizId) },
    ),
  );

  const invalidate = async () => {
    setSubmitError(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.quiz.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() }),
    ]);
  };

  const onMutationError = (error: unknown, fallback = "Unable to save quiz changes.") => {
    const message = toUserErrorMessage(error, fallback);
    setSubmitError(message);
    toast.error(message);
  };

  const createMutation = useMutation(
    trpc.quiz.create.mutationOptions({
      onSuccess: async (data) => {
        toast.success("Quiz created.");
        await invalidate();
        router.push(`/admin/quizzes/${data.id}/edit`);
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const updateMutation = useMutation(
    trpc.quiz.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Quiz updated.");
        await invalidate();
        router.refresh();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const publishMutation = useMutation(
    trpc.quiz.publish.mutationOptions({
      onSuccess: async () => {
        toast.success("Quiz published.");
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const draftMutation = useMutation(
    trpc.quiz.moveToDraft.mutationOptions({
      onSuccess: async () => {
        toast.success("Quiz moved to draft.");
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const closeMutation = useMutation(
    trpc.quiz.closeQuiz.mutationOptions({
      onSuccess: async () => {
        toast.success("Quiz closed.");
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const createQuestionMutation = useMutation(
    trpc.quiz.createQuestion.mutationOptions({
      onSuccess: async () => {
        toast.success("Question added.");
        setQuestionDialogOpen(false);
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const updateQuestionMutation = useMutation(
    trpc.quiz.updateQuestion.mutationOptions({
      onSuccess: async () => {
        toast.success("Question updated.");
        setQuestionDialogOpen(false);
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const deleteQuestionMutation = useMutation(
    trpc.quiz.deleteQuestion.mutationOptions({
      onSuccess: async () => {
        toast.success("Question deleted.");
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const reorderQuestionsMutation = useMutation(
    trpc.quiz.reorderQuestions.mutationOptions({
      onSuccess: invalidate,
      onError: (error) => onMutationError(error),
    }),
  );

  const createOptionMutation = useMutation(
    trpc.quiz.createOption.mutationOptions({
      onSuccess: async () => {
        toast.success("Option added.");
        setOptionDialogOpen(false);
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const updateOptionMutation = useMutation(
    trpc.quiz.updateOption.mutationOptions({
      onSuccess: async () => {
        toast.success("Option updated.");
        setOptionDialogOpen(false);
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const deleteOptionMutation = useMutation(
    trpc.quiz.deleteOption.mutationOptions({
      onSuccess: async () => {
        toast.success("Option deleted.");
        await invalidate();
      },
      onError: (error) => onMutationError(error),
    }),
  );

  const reorderOptionsMutation = useMutation(
    trpc.quiz.reorderOptions.mutationOptions({
      onSuccess: invalidate,
      onError: (error) => onMutationError(error),
    }),
  );

  useEffect(() => {
    if (!quizQuery.data) return;

    form.reset({
      title: quizQuery.data.title,
      slug: quizQuery.data.slug,
      description: quizQuery.data.description ?? "",
      status: quizQuery.data.status,
      isFeatured: quizQuery.data.isFeatured,
      showAnswersAfterSubmit: quizQuery.data.showAnswersAfterSubmit,
      allowMultipleAttempts: quizQuery.data.allowMultipleAttempts,
      timeLimitMinutes: quizQuery.data.timeLimitMinutes,
      passingScore: quizQuery.data.passingScore,
      coverImageId: quizQuery.data.coverImageId,
      seoTitle: quizQuery.data.seoTitle ?? "",
      seoDescription: quizQuery.data.seoDescription ?? "",
      contentId: quizQuery.data.contentId,
      courseId: quizQuery.data.courseId,
      courseLessonId: quizQuery.data.courseLessonId,
    });

  }, [form, quizQuery.data]);

  const watchedTitle = asString(useWatch({ control: form.control, name: "title" }));
  const watchedDescription = asString(useWatch({ control: form.control, name: "description" }));
  const watchedSlug = useWatch({ control: form.control, name: "slug" }) ?? "";
  const watchedSeoTitle = asString(useWatch({ control: form.control, name: "seoTitle" }));
  const watchedSeoDescription = asString(useWatch({ control: form.control, name: "seoDescription" }));
  const watchedStatus = useWatch({ control: form.control, name: "status" }) ?? QUIZ_STATUS.DRAFT;
  const watchedContentId = useWatch({ control: form.control, name: "contentId" }) ?? null;
  const watchedCourseId = useWatch({ control: form.control, name: "courseId" }) ?? null;
  const watchedCourseLessonId = useWatch({ control: form.control, name: "courseLessonId" }) ?? null;
  const watchedCoverImageId = useWatch({ control: form.control, name: "coverImageId" }) ?? null;
  const watchedTimeLimitMinutes = useWatch({ control: form.control, name: "timeLimitMinutes" }) ?? null;
  const watchedPassingScore = useWatch({ control: form.control, name: "passingScore" }) ?? null;
  const watchedShowAnswersAfterSubmit = useWatch({
    control: form.control,
    name: "showAnswersAfterSubmit",
  });
  const watchedAllowMultipleAttempts = useWatch({
    control: form.control,
    name: "allowMultipleAttempts",
  });
  const watchedIsFeatured = useWatch({ control: form.control, name: "isFeatured" });

  const linkType = getLinkType({
    contentId: watchedContentId,
    courseId: watchedCourseId,
    courseLessonId: watchedCourseLessonId,
  });

  useEffect(() => {
    if (!slugManuallyEdited) {
      form.setValue("slug", slugifyText(watchedTitle), { shouldValidate: true });
    }
  }, [form, slugManuallyEdited, watchedTitle]);

  const quiz = quizQuery.data;

  const handleSave = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = toQuizWriteInput(values);
    if (mode === "create") {
      await createMutation.mutateAsync(payload);
      return;
    }

    if (!quizId) return;
    await updateMutation.mutateAsync({
      ...payload,
      id: quizId,
    });
  });

  const openCreateQuestionDialog = () => {
    setQuestionDraft({
      questionText: "",
      questionType: QUIZ_QUESTION_TYPE.SINGLE_CHOICE,
      explanation: "",
      points: "1",
    });
    setQuestionDialogOpen(true);
  };

  const openEditQuestionDialog = (question: NonNullable<typeof quiz>["questions"][number]) => {
    setQuestionDraft({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      explanation: question.explanation ?? "",
      points: String(question.points),
    });
    setQuestionDialogOpen(true);
  };

  const submitQuestionDraft = async () => {
    if (!quizId) return;
    const payload = {
      quizId,
      questionText: questionDraft.questionText,
      questionType: questionDraft.questionType,
      explanation: questionDraft.explanation,
      points: Number(questionDraft.points || 1),
    };

    if (questionDraft.id) {
      await updateQuestionMutation.mutateAsync({
        id: questionDraft.id,
        ...payload,
      });
      return;
    }

    await createQuestionMutation.mutateAsync(payload);
  };

  const openCreateOptionDialog = (questionId: string) => {
    setOptionDraft({
      questionId,
      optionText: "",
      isCorrect: false,
    });
    setOptionDialogOpen(true);
  };

  const openEditOptionDialog = (
    questionId: string,
    option: { id: string; optionText: string; isCorrect: boolean },
  ) => {
    setOptionDraft({
      id: option.id,
      questionId,
      optionText: option.optionText,
      isCorrect: option.isCorrect,
    });
    setOptionDialogOpen(true);
  };

  const submitOptionDraft = async () => {
    const payload = {
      questionId: optionDraft.questionId,
      optionText: optionDraft.optionText,
      isCorrect: optionDraft.isCorrect,
    };

    if (optionDraft.id) {
      await updateOptionMutation.mutateAsync({
        id: optionDraft.id,
        ...payload,
      });
      return;
    }

    await createOptionMutation.mutateAsync(payload);
  };

  const moveQuestion = async (questionId: string, direction: "up" | "down") => {
    if (!quizId || !quiz) return;
    const ids = quiz.questions.map((question) => question.id);
    const index = ids.findIndex((id) => id === questionId);
    if (index < 0) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= ids.length) return;

    const nextIds = [...ids];
    [nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]];
    await reorderQuestionsMutation.mutateAsync({ quizId, questionIds: nextIds });
  };

  const moveOption = async (
    questionId: string,
    optionId: string,
    direction: "up" | "down",
  ) => {
    if (!quiz) return;
    const question = quiz.questions.find((entry) => entry.id === questionId);
    if (!question) return;
    const ids = question.options.map((option) => option.id);
    const index = ids.findIndex((id) => id === optionId);
    if (index < 0) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= ids.length) return;

    const nextIds = [...ids];
    [nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]];
    await reorderOptionsMutation.mutateAsync({ questionId, optionIds: nextIds });
  };

  const renderLinkValueOptions = () => {
    if (!linkTargetsQuery.data) return null;

    if (linkType === "content") {
      return linkTargetsQuery.data.contents.map((content) => (
        <SelectItem key={content.id} value={content.id}>
          {content.title}
        </SelectItem>
      ));
    }

    if (linkType === "course") {
      return linkTargetsQuery.data.courses.map((course) => (
        <SelectItem key={course.id} value={course.id}>
          {course.title}
        </SelectItem>
      ));
    }

    if (linkType === "lesson") {
      return linkTargetsQuery.data.lessons.map((lesson) => (
        <SelectItem key={lesson.id} value={lesson.id}>
          {lesson.course.title} - {lesson.title}
        </SelectItem>
      ));
    }

    return null;
  };

  const currentLinkValue =
    linkType === "content"
      ? watchedContentId
      : linkType === "course"
        ? watchedCourseId
      : linkType === "lesson"
          ? watchedCourseLessonId
          : null;

  const coverMedia =
    selectedCoverMedia ??
    (
      quiz?.coverImage && watchedCoverImageId === quiz.coverImage.id
        ? {
            id: quiz.coverImage.id,
            type: MEDIA_TYPE.IMAGE,
            url: quiz.coverImage.url,
            thumbnailUrl: quiz.coverImage.thumbnailUrl,
            altText: quiz.coverImage.altText,
            title: null,
            originalFilename: null,
            mimeType: "image/*",
            sizeBytes: 0,
          }
        : null
    );

  return (
    <div className="space-y-8">
      <FormErrorSummary errors={form.formState.errors} serverError={submitError} />
      <PageHeader
        title={mode === "create" ? "New Quiz" : "Edit Quiz"}
        description="Author polished public quizzes with structured questions, scoring logic, and attempt controls."
        actions={
          <>
            <Link href="/admin/quizzes" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ArrowLeftIcon className="size-4" />
              Back to quizzes
            </Link>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              <SaveIcon className="size-4" />
              Save
            </Button>
            {mode === "edit" && quizId ? (
              <>
                <Button variant="outline" size="sm" onClick={() => draftMutation.mutate({ id: quizId })}>
                  Move to Draft
                </Button>
                <Button variant="outline" size="sm" onClick={() => closeMutation.mutate({ id: quizId })}>
                  Close
                </Button>
                <Button size="sm" onClick={() => publishMutation.mutate({ id: quizId })}>
                  <SendHorizonalIcon className="size-4" />
                  Publish
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Quiz Metadata</CardTitle>
              <CardDescription>Title, slug, visibility, and scoring behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="quizTitle">Title</Label>
                  <Input id="quizTitle" {...form.register("title")} placeholder="Advanced React Patterns Quiz" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quizSlug">Slug</Label>
                  <Input
                    id="quizSlug"
                    value={watchedSlug}
                    onChange={(event) => {
                      setSlugManuallyEdited(true);
                      form.setValue("slug", slugifyText(event.target.value), { shouldValidate: true });
                    }}
                    placeholder="advanced-react-patterns-quiz"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={watchedStatus}
                    onValueChange={(value) => form.setValue("status", value as QuizStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {quizStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quizDescription">Description</Label>
                <Textarea id="quizDescription" rows={4} {...form.register("description")} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={600}
                    value={watchedTimeLimitMinutes ?? ""}
                    onChange={(event) =>
                      form.setValue(
                        "timeLimitMinutes",
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={watchedPassingScore ?? ""}
                    onChange={(event) =>
                      form.setValue(
                        "passingScore",
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <Label htmlFor="showAnswers">Show answers</Label>
                  <Switch
                    id="showAnswers"
                    checked={watchedShowAnswersAfterSubmit ?? false}
                    onCheckedChange={(value) => form.setValue("showAnswersAfterSubmit", value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <Label htmlFor="allowAttempts">Multiple attempts</Label>
                  <Switch
                    id="allowAttempts"
                    checked={watchedAllowMultipleAttempts ?? false}
                    onCheckedChange={(value) => form.setValue("allowMultipleAttempts", value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <Label htmlFor="isFeatured">Featured</Label>
                  <Switch
                    id="isFeatured"
                    checked={watchedIsFeatured ?? false}
                    onCheckedChange={(value) => form.setValue("isFeatured", value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Presentation & Linking</CardTitle>
              <CardDescription>Cover image, SEO text, and optional content/course linkage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Cover Image</Label>
                {coverMedia ? (
                  <div className="space-y-2">
                    <MediaPreview media={coverMedia} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCoverPickerOpen(true)}>
                        Change image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCoverMedia(null);
                          form.setValue("coverImageId", null);
                        }}
                      >
                        Remove image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setCoverPickerOpen(true)}>
                    Select image
                  </Button>
                )}
              </div>

              <SeoFields
                seoTitle={watchedSeoTitle}
                seoDescription={watchedSeoDescription}
                onSeoTitleChange={(value) => form.setValue("seoTitle", value)}
                onSeoDescriptionChange={(value) => form.setValue("seoDescription", value)}
                titleFallback={watchedTitle}
                descriptionFallback={watchedDescription}
                showHeader={false}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Linked target type</Label>
                  <Select
                    value={linkType}
                    onValueChange={(value) => {
                      form.setValue("contentId", null);
                      form.setValue("courseId", null);
                      form.setValue("courseLessonId", null);
                      if (value === "none") {
                        return;
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No linked target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No link</SelectItem>
                      <SelectItem value="content">Content entry</SelectItem>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="lesson">Course lesson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Linked target</Label>
                  <Select
                    value={currentLinkValue ?? "none"}
                    onValueChange={(value) => {
                      if (linkType === "content") {
                        form.setValue("contentId", value === "none" ? null : value);
                      } else if (linkType === "course") {
                        form.setValue("courseId", value === "none" ? null : value);
                      } else if (linkType === "lesson") {
                        form.setValue("courseLessonId", value === "none" ? null : value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {renderLinkValueOptions()}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {mode === "edit" && quizId ? (
            <Card className="surface-panel">
              <CardHeader>
                <CardTitle>Attempts & Results</CardTitle>
                <CardDescription>Recent submissions and score distribution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsQuery.isPending ? (
                  <TableSkeleton rows={4} />
                ) : analyticsQuery.isError ? (
                  <RetryPanel
                    title="Unable to load analytics"
                    error={analyticsQuery.error}
                    onRetry={() => analyticsQuery.refetch()}
                  />
                ) : analyticsQuery.data ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="surface-inset p-3">
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="text-xl font-semibold">{analyticsQuery.data.summary.submittedAttempts}</p>
                    </div>
                    <div className="surface-inset p-3">
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                      <p className="text-xl font-semibold">{analyticsQuery.data.summary.averagePercent.toFixed(0)}%</p>
                    </div>
                    <div className="surface-inset p-3">
                      <p className="text-xs text-muted-foreground">Passed</p>
                      <p className="text-xl font-semibold">{analyticsQuery.data.summary.passedCount}</p>
                    </div>
                  </div>
                ) : null}

                {attemptsQuery.data?.items.length ? (
                  <div className="space-y-2">
                    {attemptsQuery.data.items.map((attempt) => (
                      <div key={attempt.id} className="surface-inset flex items-center justify-between gap-2 p-3">
                        <div>
                          <p className="text-sm font-medium">{attempt.guestName || "Guest visitor"}</p>
                          <p className="text-xs text-muted-foreground">{attempt.guestEmail || "No email provided"}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-medium">
                            {attempt.score ?? 0} / {attempt.totalPoints ?? 0}
                          </p>
                          <p className="text-muted-foreground">
                            {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "In progress"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No attempts yet"
                    description="Attempt metrics will appear once the quiz is published and visitors submit answers."
                  />
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="surface-panel-strong">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Question Builder</CardTitle>
                <CardDescription>Author questions, options, answer keys, and points.</CardDescription>
              </div>
              {mode === "edit" && quizId ? (
                <Button size="sm" onClick={openCreateQuestionDialog}>
                  <PlusIcon className="size-4" />
                  Add Question
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mode === "create" ? (
              <EmptyState
                title="Save quiz metadata first"
                description="Create the quiz to unlock full question and option authoring tools."
              />
            ) : quizQuery.isPending ? (
              <TableSkeleton rows={6} />
            ) : quizQuery.isError ? (
              <RetryPanel
                title="Unable to load quiz builder"
                error={quizQuery.error}
                onRetry={() => quizQuery.refetch()}
              />
            ) : !quiz ? (
              <EmptyState title="Quiz not found" description="This quiz may have been removed." />
            ) : quiz.questions.length === 0 ? (
              <EmptyState
                title="No questions yet"
                description="Add your first question to begin building the answer flow."
              />
            ) : (
              <div className="space-y-3">
                {quiz.questions.map((question, index) => (
                  <article key={question.id} className="surface-inset space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          <Badge variant="secondary">{quizQuestionTypeLabels[question.questionType]}</Badge>
                          <Badge variant="secondary">{question.points} pts</Badge>
                        </div>
                        <p className="text-sm font-medium leading-7">{question.questionText}</p>
                        {question.explanation ? (
                          <p className="text-xs text-muted-foreground">Explanation: {question.explanation}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => moveQuestion(question.id, "up")}>
                          <ArrowUpIcon className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => moveQuestion(question.id, "down")}>
                          <ArrowDownIcon className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => openEditQuestionDialog(question)}>
                          <SaveIcon className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => deleteQuestionMutation.mutate({ id: question.id })}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option.id} className="rounded-md border border-border/70 bg-background/45 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{option.optionText}</span>
                              {option.isCorrect ? <Badge variant="secondary">Correct</Badge> : null}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon-xs" onClick={() => moveOption(question.id, option.id, "up")}>
                                <ArrowUpIcon className="size-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-xs" onClick={() => moveOption(question.id, option.id, "down")}>
                                <ArrowDownIcon className="size-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon-xs" onClick={() => openEditOptionDialog(question.id, option)}>
                                <SaveIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => deleteOptionMutation.mutate({ id: option.id })}
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => openCreateOptionDialog(question.id)}>
                      <PlusIcon className="size-4" />
                      Add Option
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MediaPickerDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        types={[MEDIA_TYPE.IMAGE]}
        title="Select quiz cover image"
        onSelect={(media) => {
          setSelectedCoverMedia(media);
          form.setValue("coverImageId", media.id, { shouldValidate: true });
        }}
      />

      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{questionDraft.id ? "Edit question" : "Add question"}</DialogTitle>
            <DialogDescription>Define question prompt, type, scoring points, and explanation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Question text</Label>
              <Textarea
                rows={4}
                value={questionDraft.questionText}
                onChange={(event) => setQuestionDraft((prev) => ({ ...prev, questionText: event.target.value }))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Question type</Label>
                <Select
                  value={questionDraft.questionType}
                  onValueChange={(value) => setQuestionDraft((prev) => ({ ...prev, questionType: value as QuizQuestionType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Question type" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizQuestionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={questionDraft.points}
                  onChange={(event) => setQuestionDraft((prev) => ({ ...prev, points: event.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Explanation (optional)</Label>
              <Textarea
                rows={3}
                value={questionDraft.explanation}
                onChange={(event) => setQuestionDraft((prev) => ({ ...prev, explanation: event.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitQuestionDraft}
              disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending || !questionDraft.questionText.trim()}
            >
              {questionDraft.id ? "Update Question" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{optionDraft.id ? "Edit option" : "Add option"}</DialogTitle>
            <DialogDescription>Define option text and whether this option is correct.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Option text</Label>
              <Input
                value={optionDraft.optionText}
                onChange={(event) => setOptionDraft((prev) => ({ ...prev, optionText: event.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
              <Label htmlFor="isCorrectOption">Mark as correct</Label>
              <Switch
                id="isCorrectOption"
                checked={optionDraft.isCorrect}
                onCheckedChange={(value) => setOptionDraft((prev) => ({ ...prev, isCorrect: value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitOptionDraft}
              disabled={createOptionMutation.isPending || updateOptionMutation.isPending || !optionDraft.optionText.trim()}
            >
              {optionDraft.id ? "Update Option" : "Add Option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

