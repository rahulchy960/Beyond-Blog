import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QUIZ_STATUS } from "@/lib/content/enums";
import { renderWithProviders } from "@/tests/utils";

const mocked = vi.hoisted(() => {
  return {
    startAttempt: vi.fn(async () => ({
      id: "attempt_1",
      startedAt: new Date("2026-01-01T00:00:00.000Z"),
    })),
    submitAttempt: vi.fn(async () => ({
      attemptId: "attempt_1",
      score: 1,
      totalPoints: 1,
      percentage: 100,
      passed: true,
      submittedAt: new Date("2026-01-01T00:01:00.000Z"),
      showAnswers: true,
      timedOut: false,
      questionResults: [
        {
          questionId: "q1",
          questionText: "Which option is correct?",
          points: 1,
          earnedPoints: 1,
          selectedOptionIds: ["o1"],
          correctOptionIds: ["o1"],
          explanation: null,
          options: [{ id: "o1", text: "Option A" }],
        },
      ],
    })),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: mocked.toastError,
    success: mocked.toastSuccess,
  },
}));

vi.mock("@/hooks/use-trpc", () => ({
  useTRPC: () => ({
    quiz: {
      startAttempt: {
        mutationOptions: (options: Record<string, unknown>) => ({
          ...options,
          mutationFn: mocked.startAttempt,
        }),
      },
      submitAttempt: {
        mutationOptions: (options: Record<string, unknown>) => ({
          ...options,
          mutationFn: mocked.submitAttempt,
        }),
      },
    },
  }),
}));

vi.mock("@/components/discovery/related-content-section", () => ({
  RelatedContentSection: () => <div data-testid="related-items" />,
}));

import { PublicQuizAttempt } from "@/components/quiz/public-quiz-attempt";

describe("PublicQuizAttempt", () => {
  it("completes a quiz interaction flow", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PublicQuizAttempt
        quiz={{
          id: "quiz_1",
          title: "Quiz Title",
          description: "Quiz Description",
          status: QUIZ_STATUS.PUBLISHED,
          isFeatured: false,
          showAnswersAfterSubmit: true,
          allowMultipleAttempts: true,
          timeLimitMinutes: null,
          passingScore: null,
          canAttempt: true,
          coverImage: null,
          questions: [
            {
              id: "q1",
              questionText: "Which option is correct?",
              questionType: "SINGLE_CHOICE",
              points: 1,
              explanation: null,
              options: [{ id: "o1", optionText: "Option A", position: 10 }],
            },
          ],
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Begin Quiz" }));
    await screen.findByText("Question 1");

    await user.click(screen.getByRole("button", { name: "Option A" }));
    await user.click(screen.getByRole("button", { name: "Submit Quiz" }));

    await waitFor(() => {
      expect(screen.getByText("Quiz Result")).toBeInTheDocument();
    });

    expect(mocked.startAttempt).toHaveBeenCalledTimes(1);
    expect(mocked.submitAttempt).toHaveBeenCalledTimes(1);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
