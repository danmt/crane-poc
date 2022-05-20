import { Connection, TransactionSignature } from '@solana/web3.js';
import { ActorRefFrom, assign, createMachine, interpret, spawn } from 'xstate';
import {
  rpcRequestMachineFactory,
  RpcRequestSuccess,
} from './rpc-request.machine';
import { EventType } from './types';

type ConfirmTransactionEvent = EventType<'confirmTransaction'>;

type ConfirmTransactionMachineEvent =
  | RpcRequestSuccess<TransactionSignature>
  | ConfirmTransactionEvent;

export const confirmTransactionMachineFactory = (
  connection: Connection,
  signature: TransactionSignature,
  config?: { eager: boolean }
) => {
  const confirmTransactionFactory = (signature: TransactionSignature) =>
    rpcRequestMachineFactory(() => connection.confirmTransaction(signature), {
      eager: true,
      fireAndForget: true,
    });

  /** @xstate-layout N4IgpgJg5mDOIC5QGED2A7AZgSwE4FsACAF1wEN1YyBjY7DQ-GgC23TADoBJCAGzADE1DDgIAVcpRp0MiUAAdUsbDPRyQAD0QBaAIwBWAAwcAbAE4TuwwCZLuy4YAc+gDQgAnogP6OZw38N7AHZbAGYTE1CAXyi3NCw8IlIKKlp6dEYWNk4efgF1RWVVdS0EPSNTCytbXXsrZzdPBFCg339DUNqLRyCTazMYuJFEkklU1UzqVnYOeNF8NihRlOl0gQAleWpCdbAARwBXOGJCAFksmd3D48JYA+pqMEhIAqUVdJLEW0cOUMMg3QAFn0gOs1g6oUcgMaiEspgMJl6f0CQUcUJisRA6FQEDg6jmI2SUjSDCYU2y3D4YFeRQ+SE0OjB1g4gWBtX0QV6QX0oRhCChHF0jk6PLMnSChkBAMGIAJBGWxImZOmnDlC3QSyJ4zpCjexXppQsvmsjjM1n0jl03MB9j5nI4gLM+hMjkizsiQKCMrVCu1pIunAkKxJGVgYHQxBp71kBthulCpn+VuqunB+l0fLRHE5Lp6ALNNtC0UxPq1q395PYUf1oFK2msgJMLKB6YMOe5vI8OlCPnaZgBoMBgNCUoxUSAA */
  return createMachine(
    {
      context: {
        signature,
        error: undefined as unknown,
        confirmTransactionRef: undefined as
          | ActorRefFrom<ReturnType<typeof confirmTransactionFactory>>
          | undefined,
      },
      tsTypes: {} as import('./confirm-transaction.machine.typegen').Typegen0,
      schema: { events: {} as ConfirmTransactionMachineEvent },
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
          entry: 'Start confirm transaction machine',
          on: {
            'Rpc Request Machine.Request succeeded': {
              actions: 'Save signature in context',
              target: 'Transaction confirmed',
            },
          },
        },
        'Transaction confirmed': {
          type: 'final',
        },
      },
      id: 'Confirm transaction machine',
    },
    {
      actions: {
        'Save signature in context': assign({
          signature: (_, event) => event.data,
        }),
        'Start confirm transaction machine': assign({
          confirmTransactionRef: ({ signature }) =>
            spawn(confirmTransactionFactory(signature), {
              name: 'confirm-transaction',
            }),
        }),
      },
      guards: {
        'auto start enabled': () => config?.eager ?? false,
      },
    }
  );
};

export const confirmTransactionServiceFactory = (
  connection: Connection,
  signature: TransactionSignature,
  config?: { eager: boolean }
) => {
  return interpret(
    confirmTransactionMachineFactory(connection, signature, config)
  );
};
