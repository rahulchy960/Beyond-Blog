"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckIcon, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/hooks/use-trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getInitials(label: string) {
  const parts = label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return "A";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "A";
}

type AdminAvatarSettingsProps = {
  adminLabel: string;
};

export function AdminAvatarSettings({ adminLabel }: AdminAvatarSettingsProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draftImageUrl, setDraftImageUrl] = useState<string | null>(null);

  const profileQuery = useQuery(trpc.admin.getProfile.queryOptions());
  const profile = profileQuery.data;
  const currentImageUrl = draftImageUrl ?? profile?.imageUrl ?? "";

  const initials = useMemo(() => getInitials(adminLabel), [adminLabel]);

  const updateAvatarMutation = useMutation(
    trpc.admin.updateAvatar.mutationOptions({
      onSuccess: async () => {
        toast.success("Admin display picture updated.");
        await queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() });
        setDraftImageUrl(null);
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return (
    <Card className="surface-panel h-full">
      <CardHeader>
        <CardTitle>Admin Display Picture</CardTitle>
        <CardDescription>
          Set the avatar shown on admin headers across the CMS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="surface-inset flex items-center gap-3 p-3">
          <Avatar size="lg">
            {currentImageUrl ? (
              <AvatarImage src={currentImageUrl} alt={`${adminLabel} avatar`} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{adminLabel}</p>
            <p className="truncate text-xs text-muted-foreground">
              Header avatar preview
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-avatar-url">Image URL</Label>
          <Input
            id="admin-avatar-url"
            value={currentImageUrl}
            onChange={(event) => setDraftImageUrl(event.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={updateAvatarMutation.isPending}
            onClick={() =>
              updateAvatarMutation.mutate({
                imageUrl: currentImageUrl.trim() ? currentImageUrl.trim() : null,
              })
            }
          >
            <CheckIcon className="size-4" />
            Save DP
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={updateAvatarMutation.isPending}
            onClick={() => setDraftImageUrl(profile?.imageUrl ?? "")}
          >
            <ImageIcon className="size-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
