import { useState } from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/tests/utils";
import { LikeButton } from "@/components/interaction/like-button";

function LikeButtonHarness() {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <LikeButton
      liked={liked}
      likesCount={count}
      onToggle={() => {
        setLiked((value) => !value);
        setCount((value) => value + 1);
      }}
    />
  );
}

describe("LikeButton", () => {
  it("updates aria state and count on toggle", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LikeButtonHarness />);

    const button = screen.getByRole("button", { name: "Like this post" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    expect(screen.getByRole("button", { name: "Unlike this post" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("1 Like")).toBeInTheDocument();
  });
});
