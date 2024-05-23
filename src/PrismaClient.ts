import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ensureNonNegativeBalance = Prisma.defineExtension({
  model: {
    account: {
      async $beforeCreate(args: any, next: any) {
        if (args.data.balance < 0) {
          throw new Error("Balance cannot be negative");
        }
        return next(args);
      },
      async $beforeUpdate(args: any, next: any) {
        if (args.data.balance !== undefined && args.data.balance < 0) {
          throw new Error("Balance cannot be negative");
        }
        return next(args);
      },
    },
  },
});

prisma.$extends(ensureNonNegativeBalance);

export default prisma;
