export const userTypeDefs = /* GraphQL */ `
  type User {
    id: ID!
    firstname: String!
    tax_id: String!
    password: String!
    join_date: String!
  }

  type PublicUser {
    id: ID!
    firstname: String!
    tax_id: String!
    join_date: String!
    token: String!
  }

  input UserInput {
    tax_id: String!
    password: String!
  }

  input RegisterInput {
    firstname: String!
    password: String!
    tax_id: String!
  }

  type Query {
    getUser(id: ID): User
  }

  type Mutation {
    login(userInput: UserInput): PublicUser
    register(userInput: RegisterInput): PublicUser
  }
`;
