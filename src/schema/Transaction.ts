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
    senderId: Int!
    receiverId: Int!
    sender: PublicAccount!
    receiver: PublicAccount!
    amount: Float!
    description: String
    status: TransactionStatus!
    type: TransactionType!
    createdAt: String
    updatedAt: String
  }

  type TransactionsStats {
    total_send: Float
    total_received: Float
  }

  type Query {
    getAllTransaction(
      account_id: Int!
      status: TransactionStatus
    ): [Transaction]
    transactionStats(account_id: Int!): TransactionsStats
  }

  type Mutation {
    createTransaction(transaction_details: sendMoneyInput!): Transaction!
    updateTransaction(
      transaction_id: ID!
      status: TransactionStatus!
    ): Transaction!
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
