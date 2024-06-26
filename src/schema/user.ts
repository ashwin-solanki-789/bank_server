export const userTypeDefs = /* GraphQL */ `
  type Error {
    status_code: Int!
    message: String!
  }

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

  union UserResult = User | Error

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
    getUser: UserResult
  }

  type Mutation {
    login(userInput: LoginInput): PublicUser!
    register(registerInput: RegisterInput): PublicUser!
    updateUser(updateInput: UpdateInput!): User!
    deleteUser: Boolean!
  }

  input UpdateInput {
    firstname: String!
    lastname: String!
    email: String!
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

  type Subscription {
    greetings(email: String!): String
  }
`;
