import "server-only";

import { cookies } from "next/headers";

export type User = { id: string; name: string };

/**
 * TEMPORARY dev auth until Clerk is provisioned (spec §12).
 * In development everyone is "dev-user"; in production nobody is signed in,
 * so LLM Run/Submit stays locked until real auth lands.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (process.env.NODE_ENV !== "development") return null;
  // Lets you simulate several users locally by setting this cookie.
  const devUser = (await cookies()).get("arena_dev_user")?.value;
  return devUser ? { id: devUser, name: devUser } : { id: "dev-user", name: "Dev User" };
}
