export const userTypeDefs = /* GraphQL */ `
  type User {
    id: ID!
    firstname: String!
    tax_id: String!
    password: String
    createdAt: String!
  }

  type PublicUser {
    id: ID!
    firstname: String!
    tax_id: String!
    createdAt: String!
    token: String!
  }

  type Query {
    getUser: User!
  }

  type Mutation {
    login(userInput: UserInput): PublicUser!
    register(registerInput: RegisterInput): PublicUser!
  }

  input RegisterInput {
    firstname: String!
    password: String!
    tax_id: String!
  }

  input UserInput {
    tax_id: String!
    password: String!
  }
`;
