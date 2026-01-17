import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Lazy initialization - Pool and Prisma are created on first use
// This ensures DATABASE_URL is available after dotenv loads
let pool;
let adapter;
let prismaInstance;

function getPrismaClient() {
  if (!prismaInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create a pg Pool instance
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Create the Prisma adapter
    adapter = new PrismaPg(pool);

    // Initialize Prisma Client with the adapter
    prismaInstance = new PrismaClient({
      adapter,
      log: ["error", "warn"],
      transactionOptions: {
        maxWait: 30000,
        timeout: 120000,
      },
    });
  }
  return prismaInstance;
}

// Export a proxy that lazily initializes prisma
export const prisma = new Proxy({}, {
  get(target, prop) {
    const client = getPrismaClient();
    const value = client[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});
