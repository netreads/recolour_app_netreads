import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Test database connection
prisma.$connect().catch((error: any) => {
  console.error('Failed to connect to database:', error);
});

// Export JobStatus enum
export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

// Database helper functions using Prisma
export class DatabaseHelper {
  // Job operations
  async createJob(id: string, userId: string | null, originalUrl: string) {
    return await prisma.job.create({
      data: {
        id,
        userId: userId as any,
        originalUrl,
        status: 'PENDING'
      }
    });
  }

  async getJobById(id: string) {
    return await prisma.job.findUnique({
      where: { id }
    });
  }

  async updateJob(id: string, updates: { outputUrl?: string | null; status?: JobStatus }) {
    return await prisma.job.update({
      where: { id },
      data: updates
    });
  }

}

// Helper to get database instance
export function getDatabase(): DatabaseHelper {
  return new DatabaseHelper();
}
