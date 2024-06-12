import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "@prisma/client";
import prisma from "../PrismaClient";
import { RequestContext } from "../interfaces";
import {
  GetTransactionInput,
  SubscriptionTransactionInterface,
  TransactionInput,
  UpdateTransaction,
  paginationInterface,
} from "../interfaces/transaction.interface";
import { decodeToken } from "../utils/token";
import { isDataView } from "util/types";
import { ErrorStatusCode } from "../ErrorConst";
import { PubSub, withFilter } from "graphql-subscriptions";

const pubsub = new PubSub();

export const transactionResolver = {
  Query: {
    getAllTransaction: async (
      _: any,
      { account_id, status, length }: GetTransactionInput,
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
        orderBy: {
          createdAt: "desc",
        },
        take: length ? length : undefined,
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
      let account_number;
      if (transaction_details.type === TransactionType.NORMAL) {
        // Normal Sending money logic
        const account_details = await prisma.account.findFirst({
          where: {
            account_number: transaction_details.sender,
            userId: user.id,
          },
          include: { User: true },
        });
        account_number = transaction_details.receiver;

        const receiver_account_details = await prisma.account.findFirst({
          where: {
            account_number: transaction_details.receiver,
          },
          include: { User: true },
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

        prisma.$transaction(async () => {
          await prisma.account.update({
            where: {
              account_number: transaction_details.sender,
            },
            data: {
              balance: account_details.balance - transaction_details.amount,
            },
          });

          await prisma.account.update({
            where: {
              account_number: transaction_details.receiver,
            },
            data: {
              balance:
                receiver_account_details.balance + transaction_details.amount,
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
          pubsub.publish("TRANSACTION_SUB", {
            transactionSub: {
              ...transaction,
              sender: account_details,
              receiver: receiver_account_details,
            },
            account_number: transaction.receiverId,
          });
        });
      } else {
        // Requesting money from another account logic
        const account_details = await prisma.account.findFirst({
          where: {
            account_number: transaction_details.receiver,
            userId: user.id,
          },
          include: { User: true },
        });
        account_number = transaction_details.sender;

        const sender_account_details = await prisma.account.findFirst({
          where: {
            account_number: transaction_details.sender,
          },
          include: { User: true },
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

        pubsub.publish("TRANSACTION_SUB", {
          transactionSub: {
            ...transaction,
            sender: sender_account_details,
            receiver: account_details,
          },
          account_number: transaction.senderId,
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
        throw new Error(ErrorStatusCode[650].message);
        // return { __typename: "Error", ...ErrorStatusCode[601] };
      }

      const account = await prisma.account.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        include: { User: true },
      });

      let updatedTransaction;

      if (status === TransactionStatus.COMPLETED) {
        const transaction = await prisma.transaction.findFirst({
          where: {
            id: transaction_id,
            type: "REQUEST",
            status: "PENDING",
          },
        });
        if (!transaction || !account) {
          throw new Error("Unable to find transaction or user account.");
        }

        const recevier_account = await prisma.account.findFirst({
          where: {
            account_number: transaction.receiverId,
            status: "ACTIVE",
          },
          include: { User: true },
        });

        if (!recevier_account) {
          throw new Error("Failed to perform action.");
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

          await prisma.account.update({
            where: {
              account_number: recevier_account.account_number,
            },
            data: {
              balance: recevier_account.balance + transaction.amount,
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

          pubsub.publish("TRANSACTION_SUB", {
            transactionSub: {
              ...updatedTransaction,
            },
            account_number:
              transaction.senderId === account.account_number
                ? transaction.receiverId
                : transaction.senderId,
          });
        });
      } else {
        const transaction = await prisma.transaction.findFirst({
          where: {
            id: transaction_id,
            status: "PENDING",
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
        pubsub.publish("TRANSACTION_SUB", {
          transactionSub: {
            ...updatedTransaction,
          },
          account_number:
            transaction.senderId === account.account_number
              ? transaction.receiverId
              : transaction.senderId,
        });
      }

      return updatedTransaction;
    },
    paginationTransaction: async (
      _: unknown,
      { account_id, length, page_number }: paginationInterface,
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error(ErrorStatusCode[650].message);
        // return { __typename: "Error", ...ErrorStatusCode[601] };
      }

      const account_exisit = await prisma.account.findFirst({
        where: {
          account_number: account_id,
          userId: user.id,
        },
      });

      if (!account_exisit) {
        throw new Error("Account dosenot exisit.");
      }

      const totalCount = await prisma.transaction.count({
        where: {
          OR: [
            {
              senderId: account_id,
            },
            {
              receiverId: account_id,
            },
          ],
        },
      });
      let page_length;
      let offset;
      if (length && page_number) {
        page_length = length;
        offset = length * (page_number - 1);
      } else {
        offset = 0;
      }

      const transaction = await prisma.transaction.findMany({
        where: {
          OR: [
            {
              senderId: account_id,
            },
            {
              receiverId: account_id,
            },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
        take: page_length,
        skip: offset,
      });

      return {
        total: totalCount,
        page_number: length ? page_number : 1,
        Transactions: transaction,
      };
    },
    deleteTransaction: async (
      _: unknown,
      { id, account_id }: { id: string; account_id: number },
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error(ErrorStatusCode[650].message);
        // return { __typename: "Error", ...ErrorStatusCode[601] };
      }

      const account = await prisma.account.findFirst({
        where: {
          account_number: account_id,
          userId: user.id,
          status: "ACTIVE",
        },
      });

      if (!account) {
        throw new Error(ErrorStatusCode[652].message);
      }

      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          OR: [
            {
              senderId: account.account_number,
            },
            {
              receiverId: account.account_number,
            },
          ],
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found!");
      }

      const updatedTransaction = await prisma.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: TransactionStatus.DELETED,
        },
      });

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
  Subscription: {
    transactionSub: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("TRANSACTION_SUB"),
        (
          payload: SubscriptionTransactionInterface,
          { account_number }: { account_number: number }
        ) => {
          return payload.account_number === account_number;
        }
      ),
    },
  },
};
