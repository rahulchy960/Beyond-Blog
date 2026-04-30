import { vi } from "vitest";

export type MockClerkSession = {
  userId: string | null;
  sessionId: string | null;
};

const defaultSession: MockClerkSession = {
  userId: null,
  sessionId: null,
};

export function createAuthMock(initial: MockClerkSession = defaultSession) {
  let current = initial;

  const auth = vi.fn(async () => current);

  return {
    auth,
    setSession(next: MockClerkSession) {
      current = next;
    },
  };
}

export function createCurrentUserMock() {
  return vi.fn(async () => null);
}
