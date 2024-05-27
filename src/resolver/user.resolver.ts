import { Request } from "express";
import { RegisterInput, LoginInput } from "../interfaces";
import prisma from "../PrismaClient";
import { generateToken, decodeToken } from "../utils/token";
import bcrypt from "bcrypt";
import { loginInputSchema, registerInputSchema } from "../validation";
import generate_account_number from "../utils/generate_account_number";
import { lstat } from "fs";

export const userResolver = {
  Query: {
    getUser: async (_: any, __: any, { req }: { req: Request }) => {
      const authorization = req.headers.authorization;
      // const
      if (!authorization) {
        throw new Error("Unauthorized User!");
      }
      const token = authorization.split(" ")[1];

      const user = decodeToken(token);

      const isValidUser = await prisma.user.findFirst({
        where: {
          tax_id: user?.tax_id,
          id: user?.id,
        },
        include: {
          accounts: true,
        },
      });

      if (!user || !isValidUser) {
        throw new Error("Unauthorized User!");
      }

      return isValidUser;
    },
  },
  Mutation: {
    login: async (
      _: any,
      { userInput }: { userInput: LoginInput },
      { req }: { req: Request }
    ) => {
      await loginInputSchema.validate(userInput);

      const user = await prisma.user.findFirst({
        where: {
          tax_id: userInput.email,
        },
      });

      if (!user) {
        throw new Error("Invalid tax id or password!");
      }

      const isValidPassword = await bcrypt.compare(
        userInput.password,
        user.password
      );

      if (!isValidPassword) {
        throw new Error("Invalid tax id or password!");
      }

      const token = generateToken(user.email, user.id);
      if (!req.session.user) {
        req.session.user = {
          firstName: user.firstname,
          email: user.email,
          tax_id: user.tax_id,
          id: user.id,
        };
      }
      return {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        tax_id: user.tax_id,
        createdAt: user.createdAt,
        token,
      };
    },
    register: async (
      _: any,
      { registerInput }: { registerInput: RegisterInput },
      { req }: { req: Request }
    ) => {
      // check user input
      await registerInputSchema.validate(registerInput);
      const tax_exists = await prisma.user.findFirst({
        where: {
          tax_id: registerInput.tax_id,
        },
      });

      if (tax_exists) {
        throw new Error("User with tax id already exists");
      }

      const saltRound = parseInt(process.env.HASH_SALT as string);
      const hashedPassword = await bcrypt.hash(
        registerInput.password,
        saltRound
      );

      const user = await prisma.user.create({
        select: {
          firstname: true,
          lastname: true,
          email: true,
          tax_id: true,
          id: true,
          createdAt: true,
        },
        data: {
          firstname: registerInput.firstname,
          lastname: registerInput.lastname,
          email: registerInput.email,
          password: hashedPassword,
          tax_id: registerInput.tax_id,
        },
      });

      const acc_number = generate_account_number();

      await prisma.account.create({
        data: {
          account_number: acc_number,
          balance: 10000,
          userId: user.id,
        },
      });

      const token = generateToken(user.email, user.id);
      if (!req.session.user) {
        req.session.user = {
          email: user.email,
          tax_id: user.tax_id,
          id: user.id,
        };
      }
      return {
        ...user,
        token,
      };
    },
    deleteUser: async (_: any, __: any, { req }: { req: Request }) => {
      const authorization = req.headers.authorization;
      // const
      if (!authorization) {
        throw new Error("Unauthorized User!");
      }
      const token = authorization.split(" ")[1];

      const user = decodeToken(token);

      await prisma.$transaction(async (prisma) => {
        await prisma.account.deleteMany({
          where: {
            userId: user.id,
          },
        });
        // Delete the user
        await prisma.user.delete({
          where: {
            id: user.id,
          },
        });
      });
      return true;
    },
  },
  User: {
    accounts: (parent: any) => {
      return prisma.account.findMany({
        where: {
          userId: parent.id,
        },
      });
    },
  },
};
