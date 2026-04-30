import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/tests/utils";
import { CommentForm } from "@/components/interaction/comment-form";

describe("CommentForm", () => {
  it("shows validation and submits valid comments", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);

    renderWithProviders(<CommentForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole("button", { name: "Post Comment" }));
    expect(await screen.findByText(/>=2 characters/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "Rahul");
    await user.type(screen.getByLabelText("Comment"), "Great write-up on testing.");
    await user.click(screen.getByRole("button", { name: "Post Comment" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        guestName: "Rahul",
        body: "Great write-up on testing.",
      }),
    );
  });
});
