import { TransactionStatus, TransactionType } from "@prisma/client";

export interface GetTransactionInput {
  account_id: number;
  status: TransactionStatus;
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
