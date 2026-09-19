import { AsyncLocalStorage } from "node:async_hooks";
import { Prisma, PrismaClient } from "@prisma/client";

export const db = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
});

const txStore = new AsyncLocalStorage<Prisma.TransactionClient>();

export function prisma() {
  return txStore.getStore() ?? db;
}

export async function runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (txStore.getStore()) {
    return fn();
  }

  return db.$transaction((tx) => txStore.run(tx, fn));
}
