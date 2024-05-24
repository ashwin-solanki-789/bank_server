import { Request } from "express";
import { RegisterInput, LoginInput } from "../interfaces";
import prisma from "../PrismaClient";
import { generateToken, decodeToken } from "../utils/token";
import bcrypt from "bcrypt";
import { loginInputSchema, registerInputSchema } from "../validation";
import { SessionData } from "express-session";

export const userResolver = {
  Query: {
    getUser: async (_: any, __: any, ctx: Request) => {
      const authorization = ctx.headers.authorization;
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
      });

      if (!user || !isValidUser) {
        throw new Error("Unauthorized User!");
      }

      return {
        id: user.id,
        firstname: user.name,
        tax_id: user.tax_id,
        createdAt: isValidUser.createdAt,
      };
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
          tax_id: userInput.tax_id,
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

      const token = generateToken(user.firstName, user.id, user.tax_id);
      if (!req.session.user) {
        req.session.user = {
          firstName: user.firstName,
          tax_id: user.tax_id,
          id: user.id,
        };
      }
      return {
        id: user.id,
        firstname: user.firstName,
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
          firstName: true,
          tax_id: true,
          id: true,
          createdAt: true,
        },
        data: {
          firstName: registerInput.firstname,
          password: hashedPassword,
          tax_id: registerInput.tax_id,
        },
      });
      const token = generateToken(user.firstName, user.id, user.tax_id);
      if (!req.session.user) {
        req.session.user = {
          firstName: user.firstName,
          tax_id: user.tax_id,
          id: user.id,
        };
      }
      return {
        ...user,
        token,
      };
    },
  },
};
