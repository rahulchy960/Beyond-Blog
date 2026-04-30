import "server-only";
import { appRouter } from "@/server/api/root";
import { createPublicTRPCContext, createTRPCContext } from "@/server/api/trpc";

export type AppRouterCaller = ReturnType<typeof appRouter.createCaller>;

export function makeNonSerializableCaller(caller: AppRouterCaller): AppRouterCaller {
  return new Proxy(caller, {
    get(target, property, receiver) {
      if (property === "toJSON") {
        return undefined;
      }

      return Reflect.get(target, property, receiver);
    },
  });
}

export async function getServerCaller() {
  const ctx = await createTRPCContext();
  return makeNonSerializableCaller(appRouter.createCaller(ctx));
}

export async function getPublicServerCaller() {
  const ctx = await createPublicTRPCContext();
  return makeNonSerializableCaller(appRouter.createCaller(ctx));
}
