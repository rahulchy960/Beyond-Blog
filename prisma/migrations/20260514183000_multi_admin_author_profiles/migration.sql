-- Convert the former singleton AdminProfile into one public author profile per Clerk admin.
-- Content.authorId now points to AdminProfile, while AdminUser remains the auth/audit identity.

ALTER TABLE "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_role_key";

ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;
ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "experience" TEXT;
ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "socials" JSONB;

UPDATE "AdminProfile" AS profile
SET
  "clerkUserId" = admin."clerkUserId",
  "displayName" = COALESCE(NULLIF(profile."fullName", ''), NULLIF(TRIM(CONCAT_WS(' ', admin."firstName", admin."lastName")), ''), admin."email"),
  "slug" = LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(NULLIF(profile."fullName", ''), NULLIF(TRIM(CONCAT_WS(' ', admin."firstName", admin."lastName")), ''), SPLIT_PART(admin."email", '@', 1), profile."id"),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      ),
      '(^-|-$)',
      '',
      'g'
    )
  ) || '-' || RIGHT(profile."id", 6),
  "experience" = profile."jobs",
  "socials" = JSONB_STRIP_NULLS(
    JSONB_BUILD_OBJECT(
      'linkedinUrl', profile."linkedinUrl",
      'githubUrl', profile."githubUrl",
      'twitterUrl', profile."twitterUrl",
      'websiteUrl', profile."websiteUrl"
    )
  )
FROM "AdminUser" AS admin
WHERE profile."adminUserId" = admin."id";

INSERT INTO "AdminProfile" (
  "id",
  "adminUserId",
  "clerkUserId",
  "displayName",
  "slug",
  "email",
  "createdAt",
  "updatedAt"
)
SELECT
  'profile_' || SUBSTRING(MD5(admin."id" || admin."clerkUserId"), 1, 24),
  admin."id",
  admin."clerkUserId",
  COALESCE(NULLIF(TRIM(CONCAT_WS(' ', admin."firstName", admin."lastName")), ''), admin."email"),
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(NULLIF(TRIM(CONCAT_WS(' ', admin."firstName", admin."lastName")), ''), SPLIT_PART(admin."email", '@', 1), admin."id"),
        '[^a-zA-Z0-9]+',
        '-',
        'g'
      ),
      '(^-|-$)',
      '',
      'g'
    )
  ) || '-' || RIGHT(admin."id", 6),
  admin."email",
  NOW(),
  NOW()
FROM "AdminUser" AS admin
WHERE NOT EXISTS (
  SELECT 1 FROM "AdminProfile" AS profile WHERE profile."adminUserId" = admin."id"
);

UPDATE "AdminProfile"
SET
  "displayName" = COALESCE(NULLIF("displayName", ''), 'Beyond Blog Author'),
  "slug" = COALESCE(NULLIF("slug", ''), 'author-' || RIGHT("id", 6));

DROP INDEX IF EXISTS "AdminProfile_singletonKey_key";
ALTER TABLE "AdminProfile" DROP COLUMN IF EXISTS "singletonKey";
ALTER TABLE "AdminProfile" DROP COLUMN IF EXISTS "fullName";
ALTER TABLE "AdminProfile" DROP COLUMN IF EXISTS "jobs";
ALTER TABLE "AdminProfile" DROP COLUMN IF EXISTS "linkedinUrl";
ALTER TABLE "AdminProfile" DROP COLUMN IF EXISTS "githubUrl";
ALTER TABLE "AdminProfile" DROP COLUMN IF EXISTS "twitterUrl";
ALTER TABLE "AdminProfile" DROP COLUMN IF EXISTS "websiteUrl";

ALTER TABLE "AdminProfile" ALTER COLUMN "clerkUserId" SET NOT NULL;
ALTER TABLE "AdminProfile" ALTER COLUMN "displayName" SET NOT NULL;
ALTER TABLE "AdminProfile" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "AdminProfile_clerkUserId_key" ON "AdminProfile"("clerkUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminProfile_slug_key" ON "AdminProfile"("slug");
CREATE INDEX IF NOT EXISTS "AdminProfile_slug_idx" ON "AdminProfile"("slug");

ALTER TABLE "Content" DROP CONSTRAINT IF EXISTS "Content_authorId_fkey";
ALTER TABLE "Content" ALTER COLUMN "authorId" DROP NOT NULL;
UPDATE "Content" AS content
SET "authorId" = profile."id"
FROM "AdminProfile" AS profile
WHERE content."authorId" = profile."adminUserId";
ALTER TABLE "Content"
  ADD CONSTRAINT "Content_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "authorId" TEXT;
UPDATE "Course" AS course
SET "authorId" = profile."id"
FROM "AdminProfile" AS profile
WHERE course."createdByAdminId" = profile."adminUserId";
CREATE INDEX IF NOT EXISTS "Course_authorId_createdAt_idx" ON "Course"("authorId", "createdAt");
ALTER TABLE "Course"
  ADD CONSTRAINT "Course_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "authorId" TEXT;
UPDATE "Quiz" AS quiz
SET "authorId" = profile."id"
FROM "AdminProfile" AS profile
WHERE quiz."createdByAdminId" = profile."adminUserId";
CREATE INDEX IF NOT EXISTS "Quiz_authorId_createdAt_idx" ON "Quiz"("authorId", "createdAt");
ALTER TABLE "Quiz"
  ADD CONSTRAINT "Quiz_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "featuredFooterProfileId" TEXT;
UPDATE "SiteSetting"
SET "featuredFooterProfileId" = (
  SELECT "id"
  FROM "AdminProfile"
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
)
WHERE "featuredFooterProfileId" IS NULL;
ALTER TABLE "SiteSetting"
  ADD CONSTRAINT "SiteSetting_featuredFooterProfileId_fkey"
  FOREIGN KEY ("featuredFooterProfileId") REFERENCES "AdminProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
