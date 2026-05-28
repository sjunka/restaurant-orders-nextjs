import path from "path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function createClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const dbPath = path.resolve(dbUrl.replace("file:", ""));
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

// Reuse the same instance across hot-reloads in development so we don't
// exhaust SQLite file handles. In production each process gets one instance.
const globalCache = globalThis as typeof globalThis & { _db?: PrismaClient };

export const db: PrismaClient = globalCache._db ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalCache._db = db;
}
