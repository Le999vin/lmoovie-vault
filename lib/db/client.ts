import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const globalForDb = global as unknown as { pool?: Pool; db?: ReturnType<typeof drizzle<typeof schema>> };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your environment to use the database.");
}

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });

export const db = globalForDb.db ?? drizzle(pool, { schema });
export { pool };

if (!globalForDb.pool) {
  globalForDb.pool = pool;
  globalForDb.db = db;
}

export type DbClient = typeof db;
