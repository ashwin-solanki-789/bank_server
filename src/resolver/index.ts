import { userResolver } from "./user.resolver";
import { accountResolver } from "./account.resolver";
import { transactionResolver } from "./transaction.resolver";

import { mergeResolvers } from "@graphql-tools/merge";

export const resolvers = mergeResolvers([
  userResolver,
  accountResolver,
  transactionResolver,
]);
