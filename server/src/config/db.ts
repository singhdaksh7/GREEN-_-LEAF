import { PrismaClient } from '@prisma/client';

// Single shared Prisma client for the whole app (repositories import this,
// never instantiate their own PrismaClient) — this is the standard
// recommended pattern to avoid exhausting MySQL connections under load.
export const prisma = new PrismaClient();

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log('[db] connected to MySQL');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
