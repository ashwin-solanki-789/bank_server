export const AccountTypeDefs = /* GraphQL */ `
  type Account {
    id: ID!
    account_number: Int!
    user: User!
    balance: Float!
  }

  type Query {
    getAccountDetails(account_number: Int!): Account
    getAccountBasedOnUserID(user_id: ID!): Account
  }

  type Mutation {
    generateAccount(account: AccountInput): Account
  }

  input AccountInput {
    account_number: Int!
    user_id: ID!
    balance: Float!
  }
`;
