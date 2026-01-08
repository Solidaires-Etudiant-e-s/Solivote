import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaMariaDb({
  user: "root",
  password: "my-secret-pw",
  host: "localhost",
  port: 3306,
  database: "dev3",
  connectTimeout: 5000,
});
export const prisma = new PrismaClient({ adapter });
