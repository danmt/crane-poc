import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const sendTransactionModel = createModel(
  {
    connection: new Connection('http://localhost:8899'),
    transaction: new Transaction(),
    signature: undefined as TransactionSignature | undefined,
    error: undefined as unknown,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QGUwDsIAIAqAnAhmrPgMYAuAlgPZqYCypAFhWmAHQCSEANmAMSx0EPIWLlqaRKAAOVWBUo0pIAB6IAtAGZNATjYBWABwAWAAw7TANh0AmS3csAaEAE8NNm4bZXPHnYdMbHWDDAF9Q51QMHAIiUkVaBhJmVk4efmVZeQTlNQR1AEZNArYCwwB2S0NLU1MCnSNy-Wc3fOLNA0CCu2N9GybjXvDIoRjReIl6JhZ2KIgWKDG48Ro+CBp2FgA3KgBrWdGRZYSp5Jm2OYWlsQSEbaoSfASAbVMAXUy5BQlcjX82SzWHTGcqaGxlapGFp-YwA-SmQz9MoeUx9SzDEBza4TGinFIHDBXI43CR8MC4XBUXBsaTcJ4AMypAFsLodYiTcUl8azCWhFsScWg7mgdo8Xu9PtkfkhVBpNJVSv1DLpAgFTOVDNCEPpYd1LPpyvVEeUNcFwhEQGgqBA4MosQKVolpqkuLxJd8lDK8lo7GwzJ5evodNoDTYtT7TN4un4GqZNMqMfb2YK8edLnzsY73TkvXLDPo2OUlVUbL0i8YdOGCurSvDlQVQVVTMY7Im2eNHanUg6TlEyNnpaBvRY2A0CvVysYCoMTAatci2J5DA39PGzFPum3oj3JlzzjvcQAxfAUXgQAeeody-W1nTdQJGTT2ZquRALpcrtfN8dbrAHp1nKwF6SLm+RmHoRYaiWZalpWr5tMGUbggUQJPgUBrGOaoRAA */
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
                actions: [
                  'Notify send transaction error',
                  'Save error in memory',
                ],
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
        'Save error in memory': assign({
          error: (_, event) => event.data,
        }),
      },
      services: {
        'Send transaction': ({ connection, transaction }) => {
          return connection.sendRawTransaction(transaction.serialize());
        },
      },
      guards: {
        'auto start enabled': () => false,
      },
    }
  );

export const sendTransactionServiceFactory = (
  connection: Connection,
  transaction: Transaction,
  config?: { eager: boolean }
) =>
  interpret(
    sendTransactionMachine.withConfig(
      {
        guards: {
          'auto start enabled': () => config?.eager ?? false,
        },
      },
      { connection, transaction, signature: undefined, error: undefined }
    )
  );
