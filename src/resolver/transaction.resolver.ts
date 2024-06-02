import { TransactionStatus, TransactionType } from "@prisma/client";
import prisma from "../PrismaClient";
import { RequestContext } from "../interfaces";
import {
  GetTransactionInput,
  TransactionInput,
  UpdateTransaction,
} from "../interfaces/transaction.interface";
import { decodeToken } from "../utils/token";
import { isDataView } from "util/types";
import { ErrorStatusCode } from "../ErrorConst";

export const transactionResolver = {
  Query: {
    getAllTransaction: async (
      _: any,
      { account_id, status }: GetTransactionInput,
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error("Unauthorise user");
        // return { __typename: "Error", ...ErrorStatusCode[601] };
      }

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
    transactionStats: async (
      _: unknown,
      { account_id }: { account_id: number },
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        const error = new Error(ErrorStatusCode[650].message);
        throw error;
        // return { __typename: "Error", ...ErrorStatusCode[601] };
      }

      const sent = await prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          senderId: account_id,
          status: TransactionStatus.COMPLETED,
        },
      });

      const received = await prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          receiverId: account_id,
          status: TransactionStatus.COMPLETED,
        },
      });

      return {
        total_send: sent._sum.amount || 0,
        total_received: received._sum.amount || 0,
      };
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
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error("Unauthorise user");
        // return { __typename: "Error", ...ErrorStatusCode[601] };
      }

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

        if (
          !account_details ||
          !receiver_account_details ||
          transaction_details.sender === transaction_details.receiver
        ) {
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

        if (
          !account_details ||
          !sender_account_details ||
          transaction_details.sender === transaction_details.receiver
        ) {
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
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error("Unauthorise user");
        // return { __typename: "Error", ...ErrorStatusCode[601] };
      }

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
      const senderAccount = await prisma.account.findFirst({
        where: {
          account_number: parent.senderId,
        },
        include: {
          User: true,
        },
      });

      if (senderAccount) {
        return {
          ...senderAccount,
          id: `Account_${senderAccount.id}`,
          __typename: "PublicAccount",
          User: {
            ...senderAccount.User,
            id: `PublicUser_${senderAccount?.User?.id}`,
            __typename: "PublicUser",
          },
        };
      }

      return null;
    },
    receiver: async (parent: any) => {
      const receiverAccount = await prisma.account.findFirst({
        where: {
          account_number: parent.receiverId,
        },
        include: {
          User: true,
        },
      });

      if (receiverAccount) {
        return {
          ...receiverAccount,
          id: `Account_${receiverAccount.id}`,
          __typename: "PublicAccount",
          User: {
            ...receiverAccount.User,
            id: `PublicUser_${receiverAccount?.User?.id}`,
            __typename: "PublicUser",
          },
        };
      }

      return null;
    },
  },
};
