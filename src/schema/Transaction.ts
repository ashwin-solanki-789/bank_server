export const TransactionTypeDefs = /* GraphQL */ `
  enum TransactionStatus {
    PENDING
    COMPLETED
    CANCELLED
    DELETED
  }

  enum TransactionType {
    REQUEST
    NORMAL
  }

  type Transaction {
    id: ID!
    sender: Int!
    receiver: Int!
    amount: Float!
    description: String
    status: TransactionStatus!
    type: TransactionType!
    createdAt: String
    updatedAt: String
  }

  type Query {
    getAllTransaction(
      account_id: Int!
      status: TransactionStatus
    ): [Transaction]
  }

  type Mutation {
    createTransaction(transaction_details: sendMoneytInput!): Transaction!
    updateTransaction(id: ID!, status: TransactionStatus!): Transaction!
    deleteTransaction(id: ID!): Transaction!
  }

  input sendMoneyInput {
    sender: Int!
    receiver: Int!
    amount: Int!
    type: TransactionType!
    description: String
  }
`;
