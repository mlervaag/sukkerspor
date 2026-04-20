import { Pool } from "@neondatabase/serverless";
import { drizzle, NeonDatabase } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

type Schema = typeof schema;
type Db = NeonDatabase<Schema>;

let _pool: Pool | null = null;
let _db: Db | null = null;

function getPool(): Pool {
    if (!_pool) {
        _pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    }
    return _pool;
}

export function getDb(): Db {
    if (!_db) {
        _db = drizzle(getPool(), { schema });
    }
    return _db;
}

// Lazy-initialized proxy so that importing `db` at module load time
// (e.g. during Next.js build) doesn't require DATABASE_URL.
export const db = new Proxy({} as Db, {
    get(_target, prop: keyof Db) {
        const target = getDb();
        const value = target[prop];
        return typeof value === "function" ? value.bind(target) : value;
    },
});
