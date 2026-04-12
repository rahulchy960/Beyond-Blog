"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  CheckCircle2Icon,
  Clock3Icon,
  ListChecksIcon,
  TimerResetIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/hooks/use-trpc";
import { QUIZ_STATUS, type QuizQuestionType } from "@/lib/content/enums";
import { RelatedContentSection } from "@/components/discovery/related-content-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GracefulMedia } from "@/components/ui/graceful-media";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type DiscoveryResultItem } from "@/types/discovery";

type PublicQuizAttemptProps = {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    status: "DRAFT" | "PUBLISHED" | "CLOSED";
    isFeatured: boolean;
    showAnswersAfterSubmit: boolean;
    allowMultipleAttempts: boolean;
    timeLimitMinutes: number | null;
    passingScore: number | null;
    canAttempt: boolean;
    coverImage: {
      id: string;
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
    } | null;
    questions: Array<{
      id: string;
      questionText: string;
      questionType: QuizQuestionType;
      points: number;
      explanation: string | null;
      options: Array<{
        id: string;
        optionText: string;
        position: number;
      }>;
    }>;
  };
  relatedItems?: DiscoveryResultItem[];
};

type QuizStage = "intro" | "in_progress" | "result";

type SubmitResult = {
  attemptId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean | null;
  submittedAt: Date;
  showAnswers: boolean;
  timedOut: boolean;
  questionResults: Array<{
    questionId: string;
    questionText: string;
    points: number;
    earnedPoints: number;
    selectedOptionIds: string[];
    correctOptionIds: string[];
    explanation: string | null;
    options: Array<{
      id: string;
      text: string;
    }>;
  }>;
};

function formatSeconds(value: number) {
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function PublicQuizAttempt({ quiz, relatedItems = [] }: PublicQuizAttemptProps) {
  const trpc = useTRPC();
  const [stage, setStage] = useState<QuizStage>("intro");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const imageUrl = quiz.coverImage?.thumbnailUrl ?? quiz.coverImage?.url ?? null;

  const startAttemptMutation = useMutation(
    trpc.quiz.startAttempt.mutationOptions({
      onSuccess: (data) => {
        setAttemptId(data.id);
        setStage("in_progress");
        if (quiz.timeLimitMinutes) {
          setRemainingSeconds(quiz.timeLimitMinutes * 60);
        }
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const submitAttemptMutation = useMutation(
    trpc.quiz.submitAttempt.mutationOptions({
      onSuccess: (data) => {
        setResult(data as SubmitResult);
        setStage("result");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  useEffect(() => {
    if (stage !== "in_progress" || remainingSeconds === null) return;

    const interval = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous === null) return null;
        if (previous <= 1) {
          clearInterval(interval);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, stage]);

  useEffect(() => {
    if (stage !== "in_progress" || !attemptId || remainingSeconds !== 0) return;

    toast.error("Time is up. Submitting your attempt now.");
    submitAttemptMutation.mutate({
      attemptId,
      answers: quiz.questions.map((question) => ({
        questionId: question.id,
        optionIds: answers[question.id] ?? [],
      })).filter((entry) => entry.optionIds.length > 0),
    });
  }, [answers, attemptId, quiz.questions, remainingSeconds, stage, submitAttemptMutation]);

  const answeredCount = useMemo(
    () => quiz.questions.filter((question) => (answers[question.id] ?? []).length > 0).length,
    [answers, quiz.questions],
  );

  const handleSelectOption = (
    questionId: string,
    questionType: QuizQuestionType,
    optionId: string,
  ) => {
    setAnswers((previous) => {
      const selected = previous[questionId] ?? [];

      if (questionType === "SINGLE_CHOICE") {
        return { ...previous, [questionId]: [optionId] };
      }

      const next = selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId];
      return { ...previous, [questionId]: next };
    });
  };

  const submitAttempt = () => {
    if (!attemptId) return;

    const unanswered = quiz.questions.filter((question) => (answers[question.id] ?? []).length === 0);
    if (unanswered.length > 0) {
      toast.error("Please answer every question before submitting.");
      return;
    }

    submitAttemptMutation.mutate({
      attemptId,
      answers: quiz.questions.map((question) => ({
        questionId: question.id,
        optionIds: answers[question.id] ?? [],
      })),
    });
  };

  if (quiz.status === QUIZ_STATUS.CLOSED) {
    return (
      <article className="mx-auto w-full max-w-4xl space-y-6 py-10 md:py-14">
        <Card className="surface-panel-strong">
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            <CardDescription>This quiz is currently closed and not accepting new attempts.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-muted-foreground">
              Check back later for reopened assessments or explore other published quizzes.
            </p>
          </CardContent>
        </Card>
      </article>
    );
  }

  return (
    <article className="mx-auto w-full max-w-5xl space-y-6 py-10 md:space-y-8 md:py-14">
      <header className="space-y-4">
        <p className="meta-kicker">Public Quiz</p>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">{quiz.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <ListChecksIcon className="size-3" />
            {quiz.questions.length} questions
          </Badge>
          {quiz.timeLimitMinutes ? (
            <Badge variant="secondary" className="gap-1">
              <TimerResetIcon className="size-3" />
              {quiz.timeLimitMinutes} min limit
            </Badge>
          ) : null}
          {quiz.passingScore !== null ? (
            <Badge variant="secondary" className="gap-1">
              <Clock3Icon className="size-3" />
              Pass {quiz.passingScore}%
            </Badge>
          ) : null}
        </div>
        {quiz.description ? <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{quiz.description}</p> : null}
      </header>

      {imageUrl ? (
        <div className="surface-reading overflow-hidden p-2">
          <GracefulMedia
            src={imageUrl}
            alt={quiz.coverImage?.altText ?? quiz.title}
            width={1600}
            height={900}
            className="rounded-xl"
            fallbackLabel="Cover unavailable"
          />
        </div>
      ) : null}

      {stage === "intro" ? (
        <Card className="surface-panel">
          <CardHeader>
            <CardTitle>Start Quiz</CardTitle>
            <CardDescription>Guest details are optional. Your score is calculated server-side.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="guestName">Name (optional)</Label>
                <Input id="guestName" value={guestName} onChange={(event) => setGuestName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email (optional)</Label>
                <Input id="guestEmail" type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} />
              </div>
            </div>

            <Button
              onClick={() => startAttemptMutation.mutate({ quizId: quiz.id, guestName, guestEmail })}
              disabled={startAttemptMutation.isPending || !quiz.canAttempt}
            >
              {startAttemptMutation.isPending ? "Starting..." : "Begin Quiz"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {stage === "in_progress" ? (
        <section className="space-y-4">
          <div className="surface-panel flex flex-wrap items-center justify-between gap-3 p-3">
            <p className="text-sm text-muted-foreground">
              Answered {answeredCount} of {quiz.questions.length}
            </p>
            {remainingSeconds !== null ? (
              <Badge variant="secondary" className="gap-1 text-sm">
                <TimerResetIcon className="size-3.5" />
                {formatSeconds(remainingSeconds)}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-3">
            {quiz.questions.map((question, index) => (
              <motion.article
                key={question.id}
                className="surface-reading space-y-4 p-5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Question {index + 1}</Badge>
                    <Badge variant="secondary">{question.points} pts</Badge>
                    <Badge variant="secondary">
                      {question.questionType === "MULTIPLE_CHOICE" ? "Multiple choice" : "Single choice"}
                    </Badge>
                  </div>
                  <p className="text-base leading-7 font-medium">{question.questionText}</p>
                </div>

                <div className="space-y-2">
                  {question.options.map((option) => {
                    const selected = (answers[question.id] ?? []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`focus-ring w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/12 text-foreground"
                            : "border-border/70 bg-background/45 hover:bg-muted/55"
                        }`}
                        onClick={() => handleSelectOption(question.id, question.questionType, option.id)}
                      >
                        <span className="text-sm">{option.optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.article>
            ))}
          </div>

          <Button onClick={submitAttempt} disabled={submitAttemptMutation.isPending}>
            {submitAttemptMutation.isPending ? "Submitting..." : "Submit Quiz"}
          </Button>
        </section>
      ) : null}

      {stage === "result" && result ? (
        <section className="space-y-4">
          <Card className="surface-panel-strong">
            <CardHeader>
              <CardTitle>Quiz Result</CardTitle>
              <CardDescription>
                {result.timedOut ? "Submission exceeded time limit." : "Your attempt has been evaluated."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="surface-inset p-3">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-2xl font-semibold">
                    {result.score} / {result.totalPoints}
                  </p>
                </div>
                <div className="surface-inset p-3">
                  <p className="text-xs text-muted-foreground">Percentage</p>
                  <p className="text-2xl font-semibold">{result.percentage}%</p>
                </div>
                <div className="surface-inset p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-2xl font-semibold">
                    {result.passed === null ? "Completed" : result.passed ? "Passed" : "Not passed"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.showAnswers ? (
            <div className="space-y-3">
              {result.questionResults.map((entry, index) => (
                <article key={entry.questionId} className="surface-reading space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Q{index + 1}</Badge>
                    <Badge variant={entry.earnedPoints > 0 ? "secondary" : "destructive"}>
                      {entry.earnedPoints > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2Icon className="size-3.5" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <XCircleIcon className="size-3.5" />
                          Incorrect
                        </span>
                      )}
                    </Badge>
                  </div>
                  <p className="font-medium">{entry.questionText}</p>
                  <div className="space-y-1.5">
                    {entry.options.map((option) => {
                      const isSelected = entry.selectedOptionIds.includes(option.id);
                      const isCorrect = entry.correctOptionIds.includes(option.id);
                      return (
                        <div key={option.id} className="rounded-md border border-border/70 bg-background/45 px-3 py-2 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{option.text}</span>
                            {isSelected ? <Badge variant="outline">Your answer</Badge> : null}
                            {isCorrect ? <Badge variant="secondary">Correct answer</Badge> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {entry.explanation ? (
                    <p className="text-sm text-muted-foreground">Explanation: {entry.explanation}</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <RelatedContentSection
        items={relatedItems}
        title="Related Assessments & Reads"
        description="Continue with connected quizzes, courses, and editorial content."
      />
    </article>
  );
}
