import { Connection, TransactionSignature } from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const confirmTransactionModel = createModel(
  {
    connection: new Connection('http://localhost:8899'),
    signature: '' as TransactionSignature,
    maxAttempts: 10,
    attempt: 0,
  },
  {
    events: {
      confirmTransaction: (value: TransactionSignature) => ({ value }),
    },
  }
);

export type ConfirmTransactionMachineServices = {
  'Confirm transaction': {
    data: TransactionSignature;
  };
};

export const confirmTransactionMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGED2A7AZgSwE4FsACAFVwEN1YyBjAF2w0IFkaALbdMAOgEkIAbMAGJqGHAVIUqdBukSgADqljZ6GeSAAeiALQAWAOwBWLgCZzBywAYAbDb0AOUw4A0IAJ66HNrgE4jNgDMDka+vnoAjBGBNqYAvnFuaFh4RJKUNGrozGwc3HyCQhpKKlka2gg6pqFcEQYOkVZGEc6BloFunpUtEVwGdnphpjZWpgYR4QlJYqkk5BkyjCzU7JxcyeL4HFCEtPPSWUIQGNwcAG6oANbcG7PpB7I5K3nrMwTbu-uZsgjnqNRkLIAbSsAF1ispVLJyrpolZajYogF+oExoErB0PIg9PDosM4XojNV6nopiBbgQ5lJvktcmsKVt0Ds9tTFughGBcLhULguAp+IDMDz8K8UpT7jTsstVjc3ozmV82b90BcAcCwRDStCkFpYcEuEY9KZCW17EYrFYIkZOogIlYDFxBoFfGMbP1fAY9MEyQyqQssk8ZVwAMqCMAKbZCTSwWiA7hkTC0TkACnRFqsAEohL6JWzAy9Q2Bw9tNVD1DqKjooj4rY4DL4HL5Ec4DDaEKY2lx0dXIjjDREbAlEiB0KgIHANDnFQHpS8CmBS2UK7ovSYcYibEZgkTfJa21UrVwMYTG+b60E2j65X6HrTnvS5R8Wf7tYpIUvQJXzSZfM7moNNzqBo20GLtAmCKwG2GD0rEbK8xTSadHlnNZcwDUQEMgRdX11dtmi7Bt+mGVFIOCNsTCtK1YgMUj-EMBx4M2G9JXzNZC2LJlsPLT9EHMBwjybEJwKGQI8TbCIHHhZ1HDGRtYhCTdGLuJC7yDNDHgwzZAUeTAyGwQQIC4uRl3bcwuG8YxqhGcYiRaNtwL0czLVMK12j0GwwiMJTxRUqU6QXHUSjLYyeMqHc-D-CIAOaEl92cfjjyMesJhivshziIA */
  confirmTransactionModel.createMachine(
    {
      tsTypes: {} as import('./confirm-transaction.machine.typegen').Typegen0,
      schema: { services: {} as ConfirmTransactionMachineServices },
      id: 'Confirm Transaction Machine',
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Confirming transaction',
          },
          on: {
            confirmTransaction: {
              target: 'Confirming transaction',
            },
          },
        },
        'Confirming transaction': {
          invoke: {
            src: 'Confirm transaction',
            onDone: [
              {
                target: 'Transaction confirmed',
              },
            ],
            onError: [
              {
                actions: [
                  'Notify confirm transaction error',
                  'Increase number of attempts',
                ],
                target: 'Sleeping',
              },
            ],
          },
        },
        'Transaction confirmed': {
          type: 'final',
        },
        Sleeping: {
          after: {
            '30000': [
              {
                cond: 'can try again',
                target: 'Confirming transaction',
              },
              {
                target: 'Transaction confirmation failed',
              },
            ],
          },
        },
        'Transaction confirmation failed': {
          type: 'final',
        },
      },
    },
    {
      actions: {
        'Increase number of attempts': assign({
          attempt: (context) => context.attempt + 1,
        }),
        'Notify confirm transaction error': (_, event) =>
          console.error(event.data),
      },
      guards: {
        'can try again': (context) => context.attempt < context.maxAttempts,
        'auto start enabled': () => false,
      },
      services: {
        'Confirm transaction': async ({ connection, signature }) => {
          await connection.confirmTransaction(signature, 'confirmed');

          return signature;
        },
      },
    }
  );

export const confirmTransactionServiceFactory = (
  connection: Connection,
  signature: TransactionSignature
) =>
  interpret(
    confirmTransactionMachine.withConfig(
      {},
      {
        connection,
        signature,
        attempt: 0,
        maxAttempts: 10,
      }
    )
  ).start();
