import { userResolver } from "./user.resolver";
import { accountResolver } from "./account.resolver";

import { mergeResolvers } from "@graphql-tools/merge";

export const resolvers = mergeResolvers([userResolver, accountResolver]);
