"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTRPC } from "@/hooks/use-trpc";

type TagItem = {
  id: string;
  name: string;
  slug: string;
  _count: { contentTags: number };
};

export function AdminTagsScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const tagsQuery = useQuery(
    trpc.discovery.listTagsAdmin.queryOptions({ query: query || undefined, limit: 120 }),
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.discovery.pathKey() });
  };

  const createMutation = useMutation(
    trpc.discovery.createTag.mutationOptions({
      onSuccess: async () => {
        toast.success("Tag created.");
        await invalidate();
        setDialogOpen(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateMutation = useMutation(
    trpc.discovery.updateTag.mutationOptions({
      onSuccess: async () => {
        toast.success("Tag updated.");
        await invalidate();
        setDialogOpen(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.discovery.deleteTag.mutationOptions({
      onSuccess: async () => {
        toast.success("Tag deleted.");
        await invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const items = tagsQuery.data?.items ?? [];
  const usageTotal = items.reduce((sum, item) => sum + item._count.contentTags, 0);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setDialogOpen(true);
  };

  const openEdit = (item: TagItem) => {
    setEditing(item);
    setName(item.name);
    setSlug(item.slug);
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Tag name is required.");
      return;
    }

    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        name: name.trim(),
        slug: slug.trim() || undefined,
      });
      return;
    }

    await createMutation.mutateAsync({
      name: name.trim(),
      slug: slug.trim() || undefined,
    });
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Tags"
        description="Manage editorial tags used for discovery and related content matching."
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4" />
            New tag
          </Button>
        }
      />

      <AnimatedPageWrapper delay={0.03} className="space-y-3">
        <div className="toolbar-row p-3">
          <div className="relative min-w-[14rem] flex-1">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tag by name or slug..."
              className="h-10 pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground">{items.length} tags · {usageTotal} total links</p>
        </div>

        <div className="data-table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                  <TableCell>{item._count.contentTags}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => openEdit(item)}>
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          if (!window.confirm(`Delete "${item.name}"?`)) return;
                          deleteMutation.mutate({ id: item.id });
                        }}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!tagsQuery.isPending && items.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState title="No tags found" description="Create your first tag to improve public discovery." />
            </div>
          ) : null}
        </div>
      </AnimatedPageWrapper>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit tag" : "Create tag"}</DialogTitle>
            <DialogDescription>
              Keep names concise and consistent for cleaner taxonomy navigation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Name</span>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Slug (optional)</span>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Save changes" : "Create tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
