"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MailIcon, PhoneIcon, SaveIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import { MediaPreview } from "@/components/media/media-preview";
import { useTRPC } from "@/hooks/use-trpc";
import { adminProfileSettingsInputSchema } from "@/lib/profile/schemas";
import { MEDIA_TYPE } from "@/lib/content/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";

type ProfileFormValues = z.infer<typeof adminProfileSettingsInputSchema>;

function hasValue(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

export function AdminProfileSettingsForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedProfileMedia, setPickedProfileMedia] = useState<{
    id: string;
    type: "IMAGE";
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    title: string | null;
    originalFilename: string | null;
    mimeType: string;
    sizeBytes: number;
  } | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(adminProfileSettingsInputSchema),
    defaultValues: {
      displayName: "",
      slug: "",
      designation: "",
      bio: "",
      address: "",
      email: "",
      phone: "",
      experience: "",
      education: "",
      profileImageId: null,
      linkedinUrl: "",
      githubUrl: "",
      twitterUrl: "",
      websiteUrl: "",
      copyrightText: "",
    },
  });

  const profileQuery = useQuery(trpc.profile.getSettings.queryOptions());

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    form.reset({
      displayName: profileQuery.data.displayName ?? "",
      slug: profileQuery.data.slug ?? "",
      designation: profileQuery.data.designation ?? "",
      bio: profileQuery.data.bio ?? "",
      address: profileQuery.data.address ?? "",
      email: profileQuery.data.email ?? "",
      phone: profileQuery.data.phone ?? "",
      experience: profileQuery.data.experience ?? "",
      education: profileQuery.data.education ?? "",
      profileImageId: profileQuery.data.profileImageId,
      linkedinUrl: profileQuery.data.linkedinUrl ?? "",
      githubUrl: profileQuery.data.githubUrl ?? "",
      twitterUrl: profileQuery.data.twitterUrl ?? "",
      websiteUrl: profileQuery.data.websiteUrl ?? "",
      copyrightText: profileQuery.data.copyrightText ?? "",
    });
  }, [form, profileQuery.data]);

  const updateMutation = useMutation(
    trpc.profile.updateSettings.mutationOptions({
      onSuccess: async () => {
        toast.success("Profile and footer settings updated.");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.profile.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.public.pathKey() }),
        ]);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const values = useWatch({ control: form.control });
  let selectedProfileMedia: {
    id: string;
    type: "IMAGE";
    url: string;
    thumbnailUrl: string | null;
    altText: string | null;
    title: string | null;
    originalFilename: string | null;
    mimeType: string;
    sizeBytes: number;
  } | null = null;

  if (pickedProfileMedia && pickedProfileMedia.id === values.profileImageId) {
    selectedProfileMedia = pickedProfileMedia;
  } else if (profileQuery.data?.profileImage && profileQuery.data.profileImage.id === values.profileImageId) {
    selectedProfileMedia = {
      id: profileQuery.data.profileImage.id,
      type: "IMAGE",
      url: profileQuery.data.profileImage.url,
      thumbnailUrl: profileQuery.data.profileImage.thumbnailUrl,
      altText: profileQuery.data.profileImage.altText,
      title: profileQuery.data.profileImage.altText,
      originalFilename: null,
      mimeType: "image/*",
      sizeBytes: 0,
    };
  }

  const links = useMemo(
    () => [
      { label: "LinkedIn", href: values.linkedinUrl },
      { label: "GitHub", href: values.githubUrl },
      { label: "Twitter", href: values.twitterUrl },
      { label: "Website", href: values.websiteUrl },
    ].filter((link) => hasValue(link.href)),
    [values.githubUrl, values.linkedinUrl, values.twitterUrl, values.websiteUrl],
  );

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate({
      ...data,
      profileImageId: data.profileImageId ?? null,
    });
  };

  if (profileQuery.isPending) {
    return <div className="surface-panel rounded-xl p-6 text-sm">Loading profile settings...</div>;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Profile & Footer Settings"
        description="Manage your author identity. Saving this profile makes it the featured footer profile."
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[1fr_25rem]">
        <div className="space-y-6">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>Primary details shown in the public footer and profile areas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Display name</Label>
                <Input id="displayName" {...form.register("displayName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Author slug</Label>
                <Input id="slug" {...form.register("slug")} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="designation">Designation</Label>
                <Input id="designation" {...form.register("designation")} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea id="bio" rows={4} {...form.register("bio")} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={3} {...form.register("address")} />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Contact & Professional Blocks</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...form.register("email")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="experience">Experience</Label>
                <Textarea id="experience" rows={4} {...form.register("experience")} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="education">Education</Label>
                <Textarea id="education" rows={4} {...form.register("education")} />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Links & Copyright</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input id="linkedinUrl" {...form.register("linkedinUrl")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input id="githubUrl" {...form.register("githubUrl")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="twitterUrl">Twitter URL</Label>
                <Input id="twitterUrl" {...form.register("twitterUrl")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input id="websiteUrl" {...form.register("websiteUrl")} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="copyrightText">Copyright text</Label>
                <Input id="copyrightText" {...form.register("copyrightText")} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Profile Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MediaPreview media={selectedProfileMedia} compact />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  Select from media
                </Button>
                {selectedProfileMedia ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPickedProfileMedia(null);
                      form.setValue("profileImageId", null, { shouldValidate: true });
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader>
              <CardTitle>Footer Preview</CardTitle>
              <CardDescription>Only populated fields will appear on the public footer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {hasValue(values.displayName) ? <p className="font-medium">{values.displayName}</p> : null}
              {hasValue(values.designation) ? <p className="text-muted-foreground">{values.designation}</p> : null}
              {hasValue(values.bio) ? <p className="leading-7 text-muted-foreground">{values.bio}</p> : null}
              {hasValue(values.email) ? (
                <p className="inline-flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="size-3.5" />
                  {values.email}
                </p>
              ) : null}
              {hasValue(values.phone) ? (
                <p className="inline-flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon className="size-3.5" />
                  {values.phone}
                </p>
              ) : null}
              {links.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {links.map((link) => (
                    <span key={link.label} className="rounded-full border border-border/70 px-2.5 py-1 text-xs">
                      {link.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateMutation.isPending} className="w-full">
            <SaveIcon className="size-4" />
            Save Profile Settings
          </Button>
        </div>
      </form>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedMediaId={values.profileImageId ?? null}
        types={[MEDIA_TYPE.IMAGE]}
        title="Select profile image"
        description="Choose an image from your media library to represent the admin profile."
        onSelect={(media) => {
          setPickedProfileMedia({ ...media, type: "IMAGE" });
          form.setValue("profileImageId", media.id, { shouldDirty: true, shouldValidate: true });
        }}
      />
    </div>
  );
}
