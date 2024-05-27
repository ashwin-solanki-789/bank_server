import { TransactionStatus, TransactionType } from "@prisma/client";
import prisma from "../PrismaClient";
import { RequestContext } from "../interfaces";
import {
  GetTransactionInput,
  TransactionInput,
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

      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            {
              sender: account_id,
            },
            {
              receiver: account_id,
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

      let find_account: number;
      if (transaction_details.type === TransactionType.NORMAL) {
        find_account = transaction_details.sender;
      } else {
        find_account = transaction_details.receiver;
      }

      const account_details = await prisma.account.findFirst({
        where: {
          account_number: find_account,
        },
      });

      if (!account_details) {
        throw new Error("Invalid Details");
      }

      if (account_details.balance - transaction_details.amount < 0) {
        throw new Error("Insufficient funds!");
      }

      const transaction = await prisma.transaction.create({
        data: {
          sender: transaction_details.sender,
          receiver: transaction_details.receiver,
          amount: transaction_details.amount,
          description: transaction_details.description,
          type: transaction_details.type,
        },
      });
    },
  },
};
