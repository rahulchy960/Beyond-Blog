import { expect, test } from "@playwright/test";

test.describe("Public flows", () => {
  test("homepage renders and sign-up is disabled", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/sign-up");
    await expect(page).toHaveURL(/\/sign-in$/);
    await expect(page.getByText("Admin Sign-In")).toBeVisible();
  });

  test("article supports like and comment interactions", async ({ page }) => {
    const articleSlug = process.env.E2E_ARTICLE_SLUG;
    test.skip(!articleSlug, "Set E2E_ARTICLE_SLUG to run article interaction flow.");

    await page.goto(`/articles/${articleSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const likeButton = page.getByRole("button", {
      name: /Like this post|Unlike this post/,
    });
    await expect(likeButton).toBeVisible();
    const initialLikeLabel = (await likeButton.getAttribute("aria-label")) ?? "";
    await likeButton.click();
    await expect(likeButton).not.toHaveAttribute("aria-label", initialLikeLabel);

    const commentBody = page.getByLabel("Comment");
    await page.getByLabel("Name").fill("E2E Visitor");
    await commentBody.fill("Strong article. This was posted from Playwright.");
    await page.getByRole("button", { name: "Post Comment" }).click();
    await expect(commentBody).toHaveValue("");
  });

  test("quiz can be completed from start to result", async ({ page }) => {
    const quizSlug = process.env.E2E_QUIZ_SLUG;
    test.skip(!quizSlug, "Set E2E_QUIZ_SLUG to run public quiz flow.");

    await page.goto(`/quizzes/${quizSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByRole("button", { name: "Begin Quiz" }).click();
    await expect(page.getByText("Question 1")).toBeVisible();

    await page.locator("button.focus-ring").first().click();
    await page.getByRole("button", { name: "Submit Quiz" }).click();

    await expect(page.getByText("Quiz Result")).toBeVisible();
    await expect(page.getByText(/%/)).toBeVisible();
  });
});
