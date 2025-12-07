import { defineConfig, env } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  // Path to your schema (relative to where prisma command is run from)
  schema: "./schema.prisma",

  // Where to store migrations
  migrations: {
    path: "./migrations"
  },

  // This replaces `url = env("DATABASE_URL")` from schema.prisma
  datasource: {
    url: env("DATABASE_URL")
  }
});
