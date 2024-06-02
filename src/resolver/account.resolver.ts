import { Request } from "express";
import { decodeToken } from "../utils/token";
import prisma from "../PrismaClient";
import generate_account_number from "../utils/generate_account_number";
import { RequestContext } from "../interfaces";
import { Account, AccountStatus } from "@prisma/client";
import { ErrorStatusCode } from "../ErrorConst";
// import { ErrorStatusCode } from "../ErrorConst";

export const accountResolver = {
  Query: {
    getAccountDetails: async (
      _: any,
      { account_number }: { account_number: number },
      { req, session }: RequestContext
    ) => {
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error("Unauthorise user");
      }

      const account = await prisma.account.findFirst({
        where: {
          account_number: account_number,
          userId: user.id,
          status: AccountStatus.ACTIVE,
        },
      });

      if (!account) {
        throw new Error("Account not found!");
      }
      console.log(account);
      return account;
    },
  },
  Mutation: {
    createAnotherAccount: async (
      _: any,
      __: any,
      { req, session }: RequestContext
    ) => {
      console.log(session);
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error("Unauthorise user");
        // return { __typename: "Error", ...ErrorStatusCode[601] };
      }

      const acc_number = generate_account_number();
      let new_account = await prisma.account.create({
        data: {
          account_number: acc_number,
          balance: 10000,
          userId: user.id,
        },
        include: {
          User: true,
        },
      });

      return new_account;
    },
    deleteAccount: async (
      _: any,
      { account_number }: { account_number: Number },
      { req }: { req: Request }
    ) => {},
    verifyAccount: async (
      _: unknown,
      { account_number }: { account_number: number },
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;

      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error(ErrorStatusCode[650].message);
      }

      const account = await prisma.account.findFirst({
        where: {
          account_number: account_number,
          status: AccountStatus.ACTIVE,
          userId: {
            not: user.id,
          },
        },
      });

      if (!account) {
        return false;
      }

      return true;
    },
  },
};
