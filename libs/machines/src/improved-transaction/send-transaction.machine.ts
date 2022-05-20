import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';
import { ActorRefFrom, assign, createMachine, interpret, spawn } from 'xstate';
import {
  rpcRequestMachineFactory,
  RpcRequestSuccess,
} from './rpc-request.machine';
import { EventType } from './types';

type SendTransactionEvent = EventType<'sendTransaction'>;

type SendTransactionMachineEvent =
  | RpcRequestSuccess<TransactionSignature>
  | SendTransactionEvent;

export const sendTransactionMachineFactory = (
  connection: Connection,
  transaction: Transaction,
  config?: { eager: boolean }
) => {
  const sendRawTransactionFactory = (transaction: Transaction) =>
    rpcRequestMachineFactory(
      () => connection.sendRawTransaction(transaction.serialize()),
      {
        eager: true,
        fireAndForget: true,
      }
    );

  /** @xstate-layout N4IgpgJg5mDOIC5QGUwDsIAIAuAnAhmrPgMbYCWA9mpgLakAW5aYAdAJIQA2YAxIqAAOlWOQrUBIAB6IAtACZ5AVlYBmJQA4ALEvlatAdiX75BgDQgAnnICMAThut5ANjsAGG-bd7Vbt1oBfAItUDBwCIlJxGnoSJhYObj5YdAgAFQjiMio0SWFRaMkZBFlVOztWOwM3O2dNTS0NGw0LaxKbZ0cdbo1nOu1epSCQ1PDCLOi6RmY2UIhmKDHI7OpeACVBEkw1sABHAFc4bEwAWWmEnYOjzFh9khIwSEg8kTEcosQtN1Y65q1TDRKNwGOw6VpyAysDRGaEGAwaVT6GyqZpBYIgNCUCBwSRzJYTHJTOIzRI8F4Fd5IaRyVSqSGggw2NxKdTwuymcElXzfRHONyqXrOFzuGxDdF4vDjKKE2LxWapBb46USKn5N4q0DFWRaWlQ9yaPzybRuZychQ8mEaJq+AzyUUGYYgCWZZUxc5sDJSlY0FJobDk9W5KnFJkVbRKJSM5yM7zydlmmz6KHORq0twadPVOGO51eyaymYBwrBuQ6SEafUZ7zG01WGkGVRqLR8rQ2I1fDwdNEBIA */
  return createMachine(
    {
      context: {
        transaction,
        error: undefined as unknown,
        signature: undefined as TransactionSignature | undefined,
        sendRawTransactionRef: undefined as
          | ActorRefFrom<ReturnType<typeof sendRawTransactionFactory>>
          | undefined,
      },
      tsTypes: {} as import('./send-transaction.machine.typegen').Typegen0,
      schema: { events: {} as SendTransactionMachineEvent },
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Sending transaction',
          },
          on: {
            sendTransaction: {
              target: 'Sending transaction',
            },
          },
        },
        'Sending transaction': {
          entry: 'Start send raw transaction machine',
          on: {
            'Rpc Request Machine.Request succeeded': {
              actions: 'Save signature in context',
              target: 'Transaction sent',
            },
          },
        },
        'Transaction sent': {
          type: 'final',
        },
      },
      id: 'Send transaction machine',
    },
    {
      actions: {
        'Save signature in context': assign({
          signature: (_, event) => event.data,
        }),
        'Start send raw transaction machine': assign({
          sendRawTransactionRef: ({ transaction }) =>
            spawn(sendRawTransactionFactory(transaction), {
              name: 'send-raw-transaction',
            }),
        }),
      },
      guards: {
        'auto start enabled': () => config?.eager ?? false,
      },
    }
  );
};

export const sendTransactionServiceFactory = (
  connection: Connection,
  transaction: Transaction,
  config?: { eager: boolean }
) => {
  return interpret(
    sendTransactionMachineFactory(connection, transaction, config)
  );
};
