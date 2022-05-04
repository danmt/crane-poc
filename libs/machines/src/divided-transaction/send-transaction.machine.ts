import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const sendTransactionModel = createModel(
  {
    connection: new Connection('http://localhost:8899'),
    transaction: new Transaction(),
    signature: undefined as TransactionSignature | undefined,
  },
  {
    events: {
      sendTransaction: (value: Transaction) => ({ value }),
    },
  }
);

export type SendTransactionMachineServices = {
  'Send transaction': {
    data: TransactionSignature;
  };
};

export const sendTransactionMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGUwDsIAIAqAnAhmrPgMYAuAlgPZqYCypAFhWmAHQCSEANmAMSx0EPIWLlqaRKAAOVWBUo0pIAB6IAtABZNADjYAGHQGYjAdnNH9AVgBMANjsAaEAE8NNzVbYeAjDs1GNqZ2RrY2RgC+Ec6oGDgERKSKtAwkzKycPPzKsvLJymoI6uEAnGx2OnYlppZGJTpWOqaazm5FJvrlOj4+mnbNOjr6DqZRMULxokkS9Ews7LEQLFCTieI0fBA07CwAblQA1gsTImvJs2nzbIvLq2LJCHtUJPjJANr6ALo5cgoSBe59KY2D4quEAlZqpUrKZWhoej42DobPVNM1TMiYboxiBFndpjQLuljhhbqd7hI+GBcLgqLg2NJuK8AGZ0gC21xOCQphNSxM5pLQK3JBLQjzQ+xe7y+Pzy-yQqg0uk05SCvT6DVMthhcIQ9jYVk01SBphsgx8Wp0UWiIDQVAgcGUeJF6xScwyXF4sr+SgVhS0RhVJX0Nh8gRCPhsMJsuvUJmBfh6ARRPn0wasOOd3NFRKuNyF+Nd3vyfqVJRVNjVVlsxjsHhKscjKsC9Vs+kCDTs2JtWamrtzGRd51iZGL8tA-p8JTKnn0ys84X8dh8utBXlTJR81cMpnqOhKma5ffOfKuQ5mADF8BReBAx76J0qauVGpogSi63WrKu7Ou01urB3PdBkPOJz15d0wHvSRSyKKw-G8KsayMOtdFjTRUxBbow1NfcRhKOxrQiIA */
  sendTransactionModel.createMachine(
    {
      tsTypes: {} as import('./send-transaction.machine.typegen').Typegen0,
      schema: { services: {} as SendTransactionMachineServices },
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Sending Transaction',
          },
          on: {
            sendTransaction: {
              target: 'Sending Transaction',
            },
          },
        },
        'Sending Transaction': {
          invoke: {
            src: 'Send transaction',
            onDone: [
              {
                actions: 'Save signature in memory',
                target: 'Transaction Sent',
              },
            ],
            onError: [
              {
                actions: 'Notify send transaction error',
                target: 'Transaction Failed',
              },
            ],
          },
        },
        'Transaction Sent': {
          type: 'final',
        },
        'Transaction Failed': {
          type: 'final',
        },
      },
      id: 'Send Transaction Machine',
    },
    {
      actions: {
        'Save signature in memory': assign({
          signature: (_, event) => event.data,
        }),
        'Notify send transaction error': (_, event) =>
          console.error(event.data),
      },
      services: {
        'Send transaction': ({ connection, transaction }) =>
          connection.sendRawTransaction(transaction.serialize()),
      },
      guards: {
        'auto start enabled': () => false,
      },
    }
  );

export const sendTransactionServiceFactory = (
  connection: Connection,
  transaction: Transaction
) =>
  interpret(
    sendTransactionMachine.withConfig(
      {},
      { connection, transaction, signature: undefined }
    )
  ).start();
