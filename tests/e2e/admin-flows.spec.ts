import path from "node:path";
import { expect, test } from "@playwright/test";

const storageStatePath = process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE;
const hasAdminSession = Boolean(storageStatePath);

if (hasAdminSession) {
  test.use({
    storageState: path.resolve(storageStatePath as string),
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Admin flows", () => {
  test.beforeEach(() => {
    test.skip(!hasAdminSession, "Set PLAYWRIGHT_ADMIN_STORAGE_STATE to run admin flows.");
  });

  test("signed-in admin can open dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText("Single-admin command center")).toBeVisible();
  });

  test("admin can create and publish an article, then verify it publicly", async ({ page }) => {
    const title = `E2E Article ${Date.now()}`;

    await page.goto("/admin/articles/new");
    await expect(page.getByText("New Article")).toBeVisible();

    await page.locator("#title").fill(title);
    await page.locator("#summary").fill("Article summary created by Playwright E2E.");
    await page.locator(".ProseMirror").first().fill("Body content created in Playwright E2E.");
    await page.getByRole("button", { name: "Publish" }).click();

    await expect(page).toHaveURL(/\/admin\/articles\/.+\/edit/);

    const slug = await page.locator("#slug").inputValue();
    await page.goto(`/articles/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  });

  test("admin can create a course, add a lesson, and publish", async ({ page }) => {
    const courseTitle = `E2E Course ${Date.now()}`;
    const lessonSlug = `intro-${Date.now()}`;

    await page.goto("/admin/courses/new");
    await expect(page.getByText("Course Metadata")).toBeVisible();

    await page.locator("#course-title").fill(courseTitle);
    await page.locator("#course-summary").fill("Playwright-generated course summary.");

    await page.getByRole("button", { name: "Add section" }).click();
    await page.locator("#section-title").fill("Section One");
    await page.getByRole("button", { name: "Save section" }).click();

    await page.getByRole("button", { name: "Add lesson" }).first().click();
    await page.locator("#lesson-title").fill("Lesson One");
    await page.locator("#lesson-slug").fill(lessonSlug);
    await page.locator("#lesson-summary").fill("Lesson summary from Playwright.");
    await page.getByRole("button", { name: "Save lesson" }).click();

    await page.getByRole("button", { name: "Publish Course" }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/.+\/edit/);
  });

  test("admin can register external video media entry", async ({ page }) => {
    const externalUrl = `https://example.com/video/${Date.now()}`;

    await page.goto("/admin/media");
    await page.getByRole("button", { name: "Add external video" }).click();

    await page.locator("#videoTitle").fill("E2E External Video");
    await page.locator("#videoExternalUrl").fill(externalUrl);
    await page.locator("#videoProvider").fill("external");
    await page.getByRole("button", { name: "Create video entry" }).click();

    await expect(page.getByText("Create External Video Entry")).not.toBeVisible();
  });
});
