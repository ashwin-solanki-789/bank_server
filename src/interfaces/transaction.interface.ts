import { TransactionStatus, TransactionType } from "@prisma/client";

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

export interface paginationInterface {
  account_id: number;
  length: number;
  page_number: number;
}

export interface UpdateTransaction {
  transaction_id: string;
  status: TransactionStatus;
}
