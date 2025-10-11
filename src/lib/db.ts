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

// Types for our database entities
export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

// Define types based on Prisma schema
export type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  credits: number;
  welcomeCreditsGiven: boolean;
};

export type Job = {
  id: string;
  userId: string | null;
  originalUrl: string;
  outputUrl: string | null;
  status: JobStatus;
  createdAt: Date;
};

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
  async createJob(id: string, userId: string | null, originalUrl: string): Promise<Job> {
    return await prisma.job.create({
      data: {
        id,
        userId: userId as any,
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

  // User creation and synchronization
  async createOrUpdateUser(userData: {
    id: string;
    email: string;
    name?: string;
    image?: string;
    emailVerified?: boolean;
  }): Promise<User> {
    return await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        email: userData.email,
        name: userData.name,
        image: userData.image,
        emailVerified: userData.emailVerified ?? false,
      },
      create: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        emailVerified: userData.emailVerified ?? false,
        credits: 0, // Will be set to 1 by welcome credits logic
      },
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

  async markWelcomeCreditsGiven(userId: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        welcomeCreditsGiven: true
      }
    });
  }

  // Atomic transaction for welcome credits
  async giveWelcomeCreditsAtomically(userId: string, creditAmount: number = 1): Promise<User> {
    return await prisma.$transaction(async (tx: any) => {
      // First, check if user exists and hasn't received welcome credits
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.welcomeCreditsGiven) {
        throw new Error('Welcome credits already given');
      }

      // Atomically add credits and mark as given
      return await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            increment: creditAmount
          },
          welcomeCreditsGiven: true
        }
      });
    });
  }

  // Generic transaction wrapper
  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return await prisma.$transaction(fn);
  }
}

// Helper to get database instance
export function getDatabase(): DatabaseHelper {
  return new DatabaseHelper();
}
