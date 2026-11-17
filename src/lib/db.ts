import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

/** Tagged-template SQL client (parameterized — safe from injection). */
export function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add a Neon/Postgres database (see README).");
  }
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

export * from "./constants";
