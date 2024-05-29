import { TransactionStatus, TransactionType } from "@prisma/client";
import prisma from "../PrismaClient";
import { RequestContext } from "../interfaces";
import {
  GetTransactionInput,
  TransactionInput,
  UpdateTransaction,
} from "../interfaces/transaction.interface";
import { decodeToken } from "../utils/token";

export const transactionResolver = {
  Query: {
    getAllTransaction: async (
      _: any,
      { account_id, status }: GetTransactionInput,
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;

      if (!authorization) {
        throw new Error("Unauthorized User!");
      }
      const token = authorization.split(" ")[1];

      const user = decodeToken(token);

      const account_exist = await prisma.account.findFirst({
        where: {
          account_number: account_id,
          userId: user.id,
        },
      });

      if (!account_exist) {
        throw new Error("Invalid Request!");
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            {
              senderId: account_id,
            },
            {
              receiverId: account_id,
            },
          ],
          status: status,
        },
      });

      return transactions;
    },
  },
  Mutation: {
    createTransaction: async (
      _: any,
      { transaction_details }: TransactionInput,
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;
      // const
      if (!authorization) {
        throw new Error("Unauthorized User!");
      }
      const token = authorization.split(" ")[1];

      const user = decodeToken(token);

      let transaction;
      if (transaction_details.type === TransactionType.NORMAL) {
        // Normal Sending money logic
        const account_details = await prisma.account.findFirst({
          where: {
            account_number: transaction_details.sender,
            userId: user.id,
          },
        });

        const receiver_account_details = await prisma.account.findFirst({
          where: {
            account_number: transaction_details.receiver,
          },
        });

        if (!account_details || !receiver_account_details) {
          throw new Error("Invalid Details");
        }

        if (account_details.balance - transaction_details.amount < 0) {
          throw new Error("Insufficient funds!");
        }

        await prisma.account.update({
          where: {
            account_number: transaction_details.sender,
          },
          data: {
            balance: account_details.balance - transaction_details.amount,
          },
        });

        transaction = await prisma.transaction.create({
          data: {
            sender: {
              connect: {
                account_number: transaction_details.sender,
              },
            },
            receiver: {
              connect: {
                account_number: transaction_details.receiver,
              },
            },
            status: TransactionStatus.COMPLETED,
            amount: transaction_details.amount,
            description: transaction_details.description,
            type: transaction_details.type,
          },
        });
      } else {
        // Requesting money from another account logic
        const account_details = await prisma.account.findFirst({
          where: {
            account_number: transaction_details.receiver,
            userId: user.id,
          },
        });

        const sender_account_details = await prisma.account.findFirst({
          where: {
            account_number: transaction_details.sender,
          },
        });

        if (!account_details || !sender_account_details) {
          throw new Error("Invalid details!");
        }

        transaction = await prisma.transaction.create({
          data: {
            sender: {
              connect: {
                account_number: transaction_details.sender,
              },
            },
            receiver: {
              connect: {
                account_number: transaction_details.receiver,
              },
            },
            status: TransactionStatus.PENDING,
            amount: transaction_details.amount,
            description: transaction_details.description,
            type: transaction_details.type,
          },
        });
      }
      return transaction;
    },
    updateTransaction: async (
      _: any,
      { transaction_id, status }: UpdateTransaction,
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;
      // const
      if (!authorization) {
        throw new Error("Unauthorized User!");
      }
      const token = authorization.split(" ")[1];

      const user = decodeToken(token);

      const account = await prisma.account.findFirst({
        where: {
          userId: user.id,
        },
      });

      let updatedTransaction;

      if (status === TransactionStatus.COMPLETED) {
        const transaction = await prisma.transaction.findFirst({
          where: {
            id: transaction_id,
            type: TransactionType.REQUEST,
          },
        });

        if (!transaction || !account) {
          throw new Error("Unable to find transaction or user account.");
        }

        if (account.balance - transaction.amount < 0) {
          throw new Error("Insufficient funds!");
        }

        prisma.$transaction(async (prisma) => {
          await prisma.account.update({
            where: {
              account_number: account.account_number,
            },
            data: {
              balance: account.balance - transaction.amount,
            },
          });

          updatedTransaction = await prisma.transaction.update({
            where: {
              id: transaction_id,
            },
            data: {
              status: status,
            },
          });
        });
      } else {
        const transaction = await prisma.transaction.findFirst({
          where: {
            id: transaction_id,
            type: TransactionType.NORMAL,
          },
        });

        if (!transaction || !account) {
          throw new Error("Unable to find transaction or user account.");
        }

        updatedTransaction = prisma.transaction.update({
          where: {
            id: transaction_id,
          },
          data: {
            status: status,
          },
        });
      }

      return updatedTransaction;
    },
  },
  Transaction: {
    sender: async (parent: any) => {
      return prisma.account.findFirst({
        where: {
          account_number: parent.senderId,
        },
        include: {
          User: true,
        },
      });
    },
    receiver: async (parent: any) => {
      return prisma.account.findFirst({
        where: {
          account_number: parent.receiverId,
        },
        include: {
          User: true,
        },
      });
    },
  },
};
