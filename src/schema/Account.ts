export const AccountTypeDefs = /* GraphQL */ `
  type Account {
    id: ID!
    account_number: Int!
    userId: ID!
    user: PublicUser!
    balance: Float!
    createdAt: String
  }

  type PublicAccount {
    id: ID!
    account_number: Int!
    User: PublicUser!
    createdAt: String!
  }

  type Query {
    getAccountDetails(account_number: Int!): Account!
    getAllAccountBasedOnUserID(user_id: ID!): [Account!]
  }

  type Mutation {
    createAnotherAccount: Account!
    deleteAccount(account_number: Int!): Boolean!
  }
`;
