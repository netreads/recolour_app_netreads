import { PrismaClient, User, Job, JobStatus } from '@prisma/client';

// Initialize Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Test database connection
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
});

// Types for our database entities
export type { User, Job, JobStatus };

// Database helper functions using Prisma
export class DatabaseHelper {
  // User operations
  async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  // Job operations
  async createJob(id: string, userId: string, originalUrl: string): Promise<Job> {
    return await prisma.job.create({
      data: {
        id,
        userId,
        originalUrl,
        status: 'PENDING'
      }
    });
  }

  async getJobById(id: string): Promise<Job | null> {
    return await prisma.job.findUnique({
      where: { id }
    });
  }

  async updateJob(id: string, updates: Partial<Pick<Job, 'outputUrl' | 'status'>>): Promise<Job> {
    return await prisma.job.update({
      where: { id },
      data: updates
    });
  }

  async getJobsByUserId(userId: string): Promise<Job[]> {
    return await prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Credit operations
  async deductCredits(userId: string, amount: number): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount
        }
      }
    });
  }

  async addCredits(userId: string, amount: number): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount
        }
      }
    });
  }
}

// Helper to get database instance
export function getDatabase(): DatabaseHelper {
  return new DatabaseHelper();
}
