import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL env var is required');
}

export const prisma = new PrismaClient();
