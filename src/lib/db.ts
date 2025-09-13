import { z } from "zod";

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
export class Database {
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

// Helper to get database instance from Cloudflare binding
export function getDatabase(env: { DB: D1Database }): Database {
  return new Database(env.DB);
}
