import { Request } from "express";
import {
  RegisterInput,
  LoginInput,
  RequestContext,
  UpdateInputInterface,
} from "../interfaces";
import prisma from "../PrismaClient";
import { generateToken, decodeToken } from "../utils/token";
import bcrypt from "bcrypt";
import { loginInputSchema, registerInputSchema } from "../validation";
import generate_account_number from "../utils/generate_account_number";
import { AccountStatus, UserStatus } from "@prisma/client";
import { PubSub, withFilter } from "graphql-subscriptions";
import { ErrorStatusCode } from "../ErrorConst";

const pubsub = new PubSub();

export const userResolver = {
  Query: {
    getUser: async (_: any, __: any, { req, session }: RequestContext) => {
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);
      if (!user) {
        return ErrorStatusCode[601];
      }

      const isValidUser = await prisma.user.findFirst({
        where: {
          email: user?.email,
          id: user?.id,
          status: UserStatus.ACTIVE,
        },
      });

      if (!user || !isValidUser) {
        return ErrorStatusCode[650];
      }

      return { __typename: "User", ...isValidUser };
    },
  },
  Mutation: {
    login: async (
      _: any,
      { userInput }: { userInput: LoginInput },
      { req, session }: RequestContext
    ) => {
      console.log(session);
      await loginInputSchema.validate(userInput);
      const user = await prisma.user.findFirst({
        where: {
          email: userInput.email,
          status: UserStatus.ACTIVE,
        },
      });
      if (!user) {
        const error = new Error(ErrorStatusCode[602].message);
        throw error;
      }
      const isValidPassword = await bcrypt.compare(
        userInput.password,
        user.password
      );
      if (!isValidPassword) {
        return ErrorStatusCode[602];
      }
      const token = generateToken(user.email, user.id);
      if (!session.user) {
        session.user = {
          firstName: user.firstname,
          email: user.email,
          tax_id: user.tax_id,
          id: user.id,
        };
      }
      pubsub.publish("USER_LOGGED", {
        greetings: `LOGGED IN USER - ${user.email}`,
        email: user.email,
      });
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
          OR: [
            {
              tax_id: registerInput.tax_id,
            },
            {
              email: registerInput.email,
            },
          ],
        },
      });

      if (tax_exists) {
        return ErrorStatusCode[603];
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
          status: UserStatus.ACTIVE,
        },
      });

      const acc_number = generate_account_number();

      await prisma.account.create({
        data: {
          account_number: acc_number,
          balance: 10000,
          userId: user.id,
          status: AccountStatus.ACTIVE,
        },
      });

      const token = generateToken(user.email, user.id);
      // if (!req.session.user) {
      //   req.session.user = {
      //     email: user.email,
      //     tax_id: user.tax_id,
      //     id: user.id,
      //   };
      // }
      return {
        ...user,
        token,
      };
    },
    updateUser: async (
      _: unknown,
      { updateInput }: { updateInput: UpdateInputInterface },
      { req }: RequestContext
    ) => {
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        throw new Error(ErrorStatusCode[650].message);
      }

      const isEmailExist = await prisma.user.findFirst({
        where: {
          id: {
            not: user.id,
          },
          email: updateInput.email,
        },
      });
      if (isEmailExist) {
        throw new Error(ErrorStatusCode[651].message);
      }

      const updateUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          firstname: updateInput.firstname,
          lastname: updateInput.lastname,
          email: updateInput.email,
        },
      });

      return updateUser;
    },
    deleteUser: async (_: any, __: any, { req }: { req: Request }) => {
      const authorization = req.headers.authorization;
      // const
      const token = authorization?.split(" ")[1];

      const user = decodeToken(token);

      if (!user) {
        return ErrorStatusCode[601];
      }

      await prisma.$transaction(async (prisma) => {
        await prisma.account.updateMany({
          where: {
            userId: user.id,
          },
          data: {
            status: AccountStatus.DELETED,
          },
        });
        // Delete the user
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            status: UserStatus.DELETED,
          },
        });
      });
      return true;
    },
  },
  Subscription: {
    greetings: {
      subscribe: withFilter(
        () => pubsub.asyncIterator("USER_LOGGED"),
        (payload: any, variables: any) => {
          // if (payload.email === variables.email) {
          //   return payload.greetings;
          // }
          return payload.email === variables.email;
        }
      ),
    },
  },
  User: {
    accounts: (parent: any) => {
      return prisma.account.findMany({
        where: {
          userId: parent.id,
          status: AccountStatus.ACTIVE,
        },
      });
    },
  },
};
