import { Request } from "express";
import { decodeToken } from "../utils/token";
import prisma from "../PrismaClient";
import generate_account_number from "../utils/generate_account_number";
import { RequestContext } from "../interfaces";

export const accountResolver = {
  Query: {
    getAccountDetails: async (
      _: any,
      { account_number }: { account_number: number },
      { req }: RequestContext
    ) => {
      var user: UserObj;
      if (!req.session.user) {
        const bearer = req.headers.authorization;
        if (!bearer) {
          throw new Error("Unauthorized User!");
        }
        const token = bearer.split(" ")[1] as string;
        user = decodeToken(token);
      } else {
        user = req.session.user;
      }

      const account = await prisma.account.findFirst({
        where: {
          account_number: account_number,
        },
        include: {
          User: true,
        },
      });

      if (!account) {
        throw new Error("Account not found!");
      }
      let tempUser = account.User;
      return { ...account, user: tempUser };
    },
  },
  Mutation: {
    createAnotherAccount: async (_: any, __: any, { req }: RequestContext) => {
      var user: UserObj;
      if (!req.session.user) {
        const bearer = req.headers.authorization;
        if (!bearer) {
          throw new Error("Unauthorized User!");
        }
        const token = bearer.split(" ")[1] as string;
        user = decodeToken(token);
      } else {
        user = req.session.user;
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
  },
};
