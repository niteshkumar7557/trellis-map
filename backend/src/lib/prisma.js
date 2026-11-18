import { PrismaClient } from "@prisma/client";

// One shared Prisma client so we do not exhaust the database connection pool
export const prisma = new PrismaClient();
