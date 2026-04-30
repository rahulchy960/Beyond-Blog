import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/tests/utils";

const mocked = vi.hoisted(() => {
  const invalidateQueries = vi.fn(async () => undefined);
  const createMutateAsync = vi.fn(async (input: unknown) => {
    void input;
  });
  const updateMutateAsync = vi.fn(async (input: unknown) => {
    void input;
  });
  const deleteMutate = vi.fn((input: unknown) => {
    void input;
  });

  return {
    invalidateQueries,
    createMutateAsync,
    updateMutateAsync,
    deleteMutate,
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: mocked.toastError,
    success: mocked.toastSuccess,
  },
}));

vi.mock("@/hooks/use-trpc", () => ({
  useTRPC: () => ({
    discovery: {
      pathKey: () => ["discovery"],
      listTagsAdmin: {
        queryOptions: () => ({ queryKey: ["discovery", "tags"], queryFn: async () => ({ items: [] }) }),
      },
      createTag: {
        mutationOptions: (options: Record<string, unknown>) => ({ ...options, __kind: "create" }),
      },
      updateTag: {
        mutationOptions: (options: Record<string, unknown>) => ({ ...options, __kind: "update" }),
      },
      deleteTag: {
        mutationOptions: (options: Record<string, unknown>) => ({ ...options, __kind: "delete" }),
      },
    },
  }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");

  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mocked.invalidateQueries,
    }),
    useQuery: () => ({
      data: { items: [] },
      isPending: false,
    }),
    useMutation: (options: { __kind?: string; onSuccess?: () => Promise<void> | void }) => {
      if (options.__kind === "create") {
        return {
          mutateAsync: async (input: unknown) => {
            await mocked.createMutateAsync(input);
            await options.onSuccess?.();
          },
          mutate: vi.fn(),
          isPending: false,
        };
      }

      if (options.__kind === "update") {
        return {
          mutateAsync: async (input: unknown) => {
            await mocked.updateMutateAsync(input);
            await options.onSuccess?.();
          },
          mutate: vi.fn(),
          isPending: false,
        };
      }

      return {
        mutate: (input: unknown) => mocked.deleteMutate(input),
        mutateAsync: vi.fn(),
        isPending: false,
      };
    },
  };
});

import { AdminTagsScreen } from "@/components/discovery/admin-tags-screen";

describe("AdminTagsScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation error when submitting without a name", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminTagsScreen />);

    await user.click(screen.getByRole("button", { name: "New tag" }));
    await user.click(screen.getByRole("button", { name: "Create tag" }));

    expect(mocked.toastError).toHaveBeenCalledWith("Tag name is required.");
  });

  it("calls create mutation with trimmed values", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminTagsScreen />);

    await user.click(screen.getByRole("button", { name: "New tag" }));
    await user.type(screen.getByLabelText("Name"), "  Testing  ");
    await user.type(screen.getByLabelText("Slug (optional)"), "  testing  ");
    await user.click(screen.getByRole("button", { name: "Create tag" }));

    expect(mocked.createMutateAsync).toHaveBeenCalledWith({
      name: "Testing",
      slug: "testing",
    });
  });
});
