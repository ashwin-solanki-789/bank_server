export const AccountTypeDefs = /* GraphQL */ `
  type Account {
    id: ID!
    account_number: Int!
    userId: ID!
    balance: Float!
    createdAt: String!
  }

  type PublicAccount {
    id: ID!
    account_number: Int!
    userId: ID!
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
    verifyAccount(account_number: Int!): Boolean!
  }

  # type Subscription {
  #   verify(account_number: Int!): Boolean!
  # }
`;
