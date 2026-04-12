import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { defaultSeoSettings, mergeSeoSettings } from "@/lib/seo/config";

function isMissingSiteSettingTableError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code === "P2021") {
    return true;
  }

  if (error.code === "P2010") {
    return String(error.message).includes("SiteSetting");
  }

  return false;
}

export async function getServerSeoSettings() {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { singletonKey: "SITE_SETTINGS" },
      select: {
        siteTitle: true,
        siteSubtitle: true,
        socialLinks: true,
      },
    });

    if (!setting) {
      return defaultSeoSettings;
    }

    return mergeSeoSettings({
      siteTitle: setting.siteTitle,
      siteSubtitle: setting.siteSubtitle,
      socialLinks: setting.socialLinks,
    });
  } catch (error) {
    if (isMissingSiteSettingTableError(error)) {
      return defaultSeoSettings;
    }

    throw error;
  }
}
