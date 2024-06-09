import {
  Account,
  TransactionStatus,
  TransactionType,
  User,
} from "@prisma/client";

export interface GetTransactionInput {
  account_id: number;
  status: TransactionStatus;
  length: number;
}

export interface TransactionInput {
  transaction_details: {
    sender: number;
    receiver: number;
    amount: number;
    type: TransactionType;
    description: string;
  };
}

export interface TransactionOutput {
  id: string;
  senderId: string;
  receiverId: string;
  sender: Account & User;
  receiver: Account & User;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  description: string;
}

export interface SubscriptionTransactionInterface {
  account_number: number;
  transaction: TransactionOutput;
}

export interface paginationInterface {
  account_id: number;
  length: number;
  page_number: number;
}

export interface UpdateTransaction {
  transaction_id: string;
  status: TransactionStatus;
}
