export const AccountTypeDefs = /* GraphQL */ `
  type Account {
    id: ID!
    account_number: Int!
    userId: ID!
    user: User
    balance: Float!
    createdAt: String
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
