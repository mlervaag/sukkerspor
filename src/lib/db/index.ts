import { Pool } from "@neondatabase/serverless";
import { drizzle, NeonDatabase } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

let _pool: Pool | null = null;
let _db: NeonDatabase<typeof schema> | null = null;

function getPool() {
    if (!_pool) {
        _pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    }
    return _pool;
}

export function getDb() {
    if (!_db) {
        _db = drizzle(getPool(), { schema });
    }
    return _db;
}

// For backwards compatibility with existing imports
export const db = new Proxy({} as NeonDatabase<typeof schema>, {
    get(_, prop) {
        return (getDb() as any)[prop];
    },
});
