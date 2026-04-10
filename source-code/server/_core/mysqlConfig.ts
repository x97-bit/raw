import type { ConnectionOptions } from "mysql2/promise";

export function buildMySqlConnectionOptions(databaseUrl: string): ConnectionOptions {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\/+/, "");

  if (!database) {
    throw new Error("DATABASE_URL is missing the database name.");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    database,
    charset: "utf8mb4",
    dateStrings: ["DATE"],
  };
}
