export const userTypeDefs = /* GraphQL */ `
  type User {
    id: ID!
    firstname: String!
    lastname: String!
    email: String!
    tax_id: String!
    password: String
    accounts: [Account]
    createdAt: String
  }

  type PublicUser {
    id: ID!
    firstname: String!
    lastname: String
    email: String!
    tax_id: String!
    createdAt: String!
    token: String
  }

  type Query {
    getUser: User!
  }

  type Mutation {
    login(userInput: LoginInput): PublicUser!
    register(registerInput: RegisterInput): PublicUser!
    deleteUser: Boolean!
  }

  input RegisterInput {
    firstname: String!
    lastname: String!
    email: String!
    password: String!
    tax_id: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }
`;
