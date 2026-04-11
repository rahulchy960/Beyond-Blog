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
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/hooks/use-trpc";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { contents: number };
};

export function AdminCategoriesScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  const categoriesQuery = useQuery(
    trpc.discovery.listCategoriesAdmin.queryOptions({ query: query || undefined, limit: 120 }),
  );

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.discovery.pathKey() });
  };

  const createMutation = useMutation(
    trpc.discovery.createCategory.mutationOptions({
      onSuccess: async () => {
        toast.success("Category created.");
        await invalidate();
        setDialogOpen(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateMutation = useMutation(
    trpc.discovery.updateCategory.mutationOptions({
      onSuccess: async () => {
        toast.success("Category updated.");
        await invalidate();
        setDialogOpen(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.discovery.deleteCategory.mutationOptions({
      onSuccess: async () => {
        toast.success("Category deleted.");
        await invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const items = categoriesQuery.data?.items ?? [];
  const usageTotal = items.reduce((sum, item) => sum + item._count.contents, 0);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setDescription("");
    setIsActive(true);
    setSortOrder("0");
    setDialogOpen(true);
  };

  const openEdit = (item: CategoryItem) => {
    setEditing(item);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setIsActive(item.isActive);
    setSortOrder(String(item.sortOrder));
    setDialogOpen(true);
  };

  const payload = {
    name: name.trim(),
    slug: slug.trim() || undefined,
    description: description.trim() || null,
    isActive,
    sortOrder: Number(sortOrder) || 0,
  };

  const submit = async () => {
    if (!payload.name) {
      toast.error("Category name is required.");
      return;
    }

    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        ...payload,
      });
      return;
    }

    await createMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Categories"
        description="Define primary editorial buckets used for browsing and archive navigation."
        actions={
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4" />
            New category
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
              placeholder="Search category by name, slug, or description..."
              className="h-10 pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground">{items.length} categories · {usageTotal} content links</p>
        </div>

        <div className="data-table-shell">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                  <TableCell>{item.isActive ? "Active" : "Hidden"}</TableCell>
                  <TableCell>{item._count.contents}</TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
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
          {!categoriesQuery.isPending && items.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState title="No categories found" description="Create at least one category to organize published content." />
            </div>
          ) : null}
        </div>
      </AnimatedPageWrapper>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Create category"}</DialogTitle>
            <DialogDescription>
              Categories power discovery pages and editorial metadata grouping.
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
            <label className="space-y-1.5">
              <span className="text-sm font-medium">Description</span>
              <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Sort order</span>
                <Input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm font-medium">
                <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                Active category
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
