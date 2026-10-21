import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from ".";
import { users } from "./schema";

/**
 * Copies a Clerk user into `users` the first time they produce data, so leaderboards and
 * profiles can join on names. TODO: keep it fresh with Clerk webhooks (user.updated/deleted).
 */
export async function ensureUser(userId: string) {
  if (!db) return;
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (existing.length) return;

  const u = await (await clerkClient()).users.getUser(userId);
  const displayName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null;
  await db
    .insert(users)
    .values({ id: userId, username: u.username, displayName, imageUrl: u.imageUrl })
    .onConflictDoNothing();
}
