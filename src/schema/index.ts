import { userTypeDefs } from "./user";
import { AccountTypeDefs } from "./Account";
import { TransactionTypeDefs } from "./Transaction";

import { mergeTypeDefs } from "@graphql-tools/merge";

export const schema = mergeTypeDefs([
  userTypeDefs,
  AccountTypeDefs,
  TransactionTypeDefs,
]);
