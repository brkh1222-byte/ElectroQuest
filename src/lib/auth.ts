import "server-only";

import { auth } from "@clerk/nextjs/server";

export type User = { id: string };

/** The signed-in Clerk user, or null for anonymous visitors (who can still run scratch problems). */
export async function getCurrentUser(): Promise<User | null> {
  const { isAuthenticated, userId } = await auth();
  return isAuthenticated ? { id: userId } : null;
}
