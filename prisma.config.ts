import "dotenv/config";
import { defineConfig } from "prisma/config";

// This config is used by Prisma CLI commands (db push, migrate, studio).
// The runtime adapter (better-sqlite3) is wired in src/server/db/client.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "file:./dev.db",
  },
});
