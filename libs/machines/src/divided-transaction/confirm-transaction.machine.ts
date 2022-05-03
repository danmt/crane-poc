import { Connection, TransactionSignature } from '@solana/web3.js';
import { assign, createMachine, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const confirmTransactionModel = createModel(
  {
    signature: undefined as TransactionSignature | undefined,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QGED2A7AZgSwE4FsACAFVwEN1YyBjAF2w0IFkaALbdMAOgEkIAbMAGJqGHAVIUqdBukSgADqljZ6GeSAAeiALQAWAOwGuABgDMARgBMJgKwGrANj1m9ADlsAaEAE9d1ky43RyszWzMATmsLZytbAF947zQsPCJJSho1dGY2Dm4U8XwOKEJackyZDCEIDG4OADdUAGsCsTSSCuls3Op2Ti5CtJKyrqzZBEbUajJsgG0TAF0NJRVsjW0EHQszQJiLC1tHA0czKwNds28-BD09s8cdkz1bOIM3PUTk9oJOqXHGCw+vlBj9iuhSuV-lV0EIwLhcKhcFwFPxZpgkfhQalfhlurJev02jjwZCxjDJugmjN5ksVspVLINv4zG4uLY9FYXmYTi8TCZDtdEBYTMY9BFIudjo4IgYXG4viAhrjyT0gUSuABlQRgBQlISaWC0WbcMiYWjwgAUu35JgAlEJlelVQT1SDtWBdSV6WsmUgtP4YlxDu4DBE3BFHlY3AYhQhQsZdgdnBY7hyYokkiB0KgIHANE6-pU1XkBnxBD7Gep-Zt9GEuHdHo5wh4rBEBXGdFZDqZXLYI7ZRZGzDzFYW8QCcm6Bk6RlDi37FAz1jXdIPbFwJRFbKnIzv3no4+KuCPWSZw05ZSYI2OwUX8YDS9wJzDCKISZBKyvQJs4hYT+GJxOGc56snGG6HIcIQGKB26GAqWbji6j7AgMHpehCX6LgG8bRqYkYeCOEQRKEOxWHGFhuIEkTuOcEYhB4za3iS96ToSIIvj075FLMBKYGQ2CCBAWHVj+iBWBJQTHK8Ryioc3bkb4iAjnoQQCt29gXHoMrbsxRSsa+05gCJcirlsrwRJukQ7uKzYWAenbRmy5gvGGFjbvZaaZvEQA */
  confirmTransactionModel.createMachine({
  tsTypes: {} as import('./confirm-transaction.machine.typegen').Typegen0,
  schema: { services: {} as ConfirmTransactionMachineServices },
  id: 'Confirm Transaction Machine',
  initial: 'Idle',
  states: {
    Idle: {
      on: {
        confirmTransaction: {
          actions: 'Save signature in memory',
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
});

export const confirmTransactionServiceFactory = (connection: Connection) =>
  interpret(
    confirmTransactionMachine.withConfig({
      actions: {
        'Save signature in memory': assign({
          signature: (_, event) => event.value,
        }),
        'Increase number of attempts': assign({
          attempt: (context) => context.attempt + 1,
        }),
        'Notify confirm transaction error': (_, event) =>
          console.error(event.data),
      },
      services: {
        'Confirm transaction': async (context) => {
          if (context.signature === undefined) {
            throw new Error('Signature is not defined.');
          }

          await connection.confirmTransaction(context.signature, 'confirmed');

          return context.signature;
        },
      },
      guards: {
        'can try again': (context) => context.attempt < context.maxAttempts,
      },
    })
  ).start();
