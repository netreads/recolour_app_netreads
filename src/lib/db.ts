import { z } from "zod";
import BetterSqlite3 from "better-sqlite3";

// Simple D1 interface for TypeScript
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta?: unknown }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<{ success: boolean; meta?: unknown }>;
}

// Better-sqlite3 interface wrapper to match D1 interface
class BetterSQLiteWrapper {
  private db: BetterSqlite3.Database;

  constructor(db: BetterSqlite3.Database) {
    this.db = db;
  }

  prepare(query: string) {
    const stmt = this.db.prepare(query);
    return {
      bind: (...values: unknown[]) => ({
        first: async <T = unknown>(): Promise<T | null> => {
          try {
            const result = stmt.get(...values) as T;
            return result || null;
          } catch (error) {
            console.error('Database query error:', error);
            return null;
          }
        },
        all: async <T = unknown>(): Promise<{ results: T[] }> => {
          try {
            const results = stmt.all(...values) as T[];
            return { results };
          } catch (error) {
            console.error('Database query error:', error);
            return { results: [] };
          }
        },
        run: async (): Promise<{ success: boolean; meta?: unknown }> => {
          try {
            const result = stmt.run(...values);
            return { success: true, meta: result };
          } catch (error) {
            console.error('Database query error:', error);
            return { success: false };
          }
        },
      }),
    };
  }

  async exec(query: string): Promise<{ success: boolean; meta?: unknown }> {
    try {
      const result = this.db.exec(query);
      return { success: true, meta: result };
    } catch (error) {
      console.error('Database exec error:', error);
      return { success: false };
    }
  }
}

// Types for our database entities (updated for better-auth)
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  emailVerified: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const JobSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  original_url: z.string(),
  output_url: z.string().nullable(),
  status: z.enum(["pending", "processing", "done", "failed"]),
  created_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type Job = z.infer<typeof JobSchema>;

// Database helper functions for Cloudflare D1
export class DatabaseHelper {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // User operations (updated for better-auth schema)
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.db
      .prepare("SELECT * FROM user WHERE email = ?")
      .bind(email)
      .first<User>();
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.db
      .prepare("SELECT * FROM user WHERE id = ?")
      .bind(id)
      .first<User>();
  }

  // Job operations
  async createJob(id: string, userId: string, originalUrl: string): Promise<Job> {
    const result = await this.db
      .prepare(
        "INSERT INTO jobs (id, user_id, original_url, status) VALUES (?, ?, ?, 'pending') RETURNING *"
      )
      .bind(id, userId, originalUrl)
      .first<Job>();
    
    if (!result) {
      throw new Error("Failed to create job");
    }
    return result;
  }

  async getJobById(id: string): Promise<Job | null> {
    return await this.db
      .prepare("SELECT * FROM jobs WHERE id = ?")
      .bind(id)
      .first<Job>();
  }

  async updateJob(id: string, updates: Partial<Pick<Job, 'output_url' | 'status'>>): Promise<Job> {
    const setParts: string[] = [];
    const values: unknown[] = [];

    if (updates.output_url !== undefined) {
      setParts.push("output_url = ?");
      values.push(updates.output_url);
    }
    if (updates.status !== undefined) {
      setParts.push("status = ?");
      values.push(updates.status);
    }

    values.push(id);

    const result = await this.db
      .prepare(
        `UPDATE jobs SET ${setParts.join(", ")} WHERE id = ? RETURNING *`
      )
      .bind(...values)
      .first<Job>();
    
    if (!result) {
      throw new Error("Failed to update job");
    }
    return result;
  }

  async getJobsByUserId(userId: string): Promise<Job[]> {
    const result = await this.db
      .prepare("SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC")
      .bind(userId)
      .all<Job>();
    
    return result.results || [];
  }
}

// Helper to get database instance - works for both development and production
export function getDatabase(env?: { DB?: D1Database }): DatabaseHelper {
  // In production (Cloudflare), use the D1 database
  if (env?.DB) {
    return new DatabaseHelper(env.DB);
  }
  
  // In development, use better-sqlite3 with the same database as auth
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || "./dev.db";
  const betterDb = new BetterSqlite3(dbPath);
  const wrappedDb = new BetterSQLiteWrapper(betterDb);
  return new DatabaseHelper(wrappedDb as any);
}
