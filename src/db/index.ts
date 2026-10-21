import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/** Null until Neon is provisioned (DATABASE_URL), so the app still runs locally without a DB. */
export const db = process.env.DATABASE_URL ? drizzle(neon(process.env.DATABASE_URL), { schema }) : null;
