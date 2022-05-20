import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { ActorRefFrom, assign, createMachine, interpret, spawn } from 'xstate';
import { rpcRequestMachineFactory } from './rpc-request.machine';
import { EventData, EventType, EventValue } from './types';

export type CreateTransactionEvent = EventType<'createTransaction'> &
  EventValue<{
    feePayer: PublicKey;
    instructions: TransactionInstruction[];
  }>;
export type BuildTransactionEvent = EventType<'buildTransaction'> &
  EventValue<{
    feePayer: PublicKey;
    instructions: TransactionInstruction[];
  }>;
export type RpcRequestSuccess =
  EventType<'Rpc Request Machine.Request succeeded'> &
    EventData<{
      blockhash: string;
      latestValidBlockHeight: number;
    }>;
export type RestartMachineEvent = EventType<'restartMachine'>;

export type CreateTransactionMachineEvent =
  | CreateTransactionEvent
  | BuildTransactionEvent
  | RpcRequestSuccess
  | RestartMachineEvent;

export const createTransactionMachineFactory = (
  connection: Connection,
  config?: {
    eager: boolean;
    autoBuild: boolean;
    fireAndForget: boolean;
  }
) => {
  const getLatestBlockhashMachine = (connection: Connection) =>
    rpcRequestMachineFactory(() => connection.getLatestBlockhash(), {
      eager: true,
      fireAndForget: true,
    });

  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAEwB0AkhADZgAxOXTYwhEmUq1iiUAAcasKtTryQAD0QBaAIwAGPQE4uADmNmzAZgCsFjgHZH16wBoQAT0TWzANi5jYw47Gz8Daz1bA1sAX1iPNEwcAiJSCjV6JnJWdm4+QSENJRVMjW0EHXtbLkcAFltjOoMWsxCDOo9vBEczLkM-Djao3r09F3jEsRTJdJk6RhY2Ti4AMTAsHLYoXH5xWCxcACN+GnIAa2YMWGYhACUFclw7sABHAFc4Q+zcsC4Xj5fXCwd7kchgSCQYrKVSycq6JymDocIz1WzNPThWxdHzorgcRrGFxRIxWOqTEBJcSpKQZWSLLZ5LhU6jEHZYNLSTJCI7vKj8CCzLlwpAgEqw9Siio2LgGPzWBrGZEGMx1PyOHEIWwKwJtRyWCzWDgo6wUll4IV0hY-ZbcFnbXAc2nzYhFUXispSxB1Op9TF6BWGRxBvSa6wuWqEsyOWzq6wGxxm6YWzlWrJLJmWl24UTJSBCdAHDCoLA29jQ0oi0AVfQccb9EImNqDWy9Dia6I1OrB7WDDpKkJxBKU5M0uaZBm-bhZie58QQN2KGGe6uIMwRLh1SLB3xGtp1Yya3pI1yn6LrpXkinEGgQOAac1j4XWjMrApgCsSuReyp6OumPQfWcNUmmDeUw3VfFCWCQwOGMWN5STPMnzTSdbTWDZGR2PYcAOY5TguK4bk-FctF0Pxu1qJwTBRbsDBjDUvB8Oo9EjIIrHVMYVUTYdHxnekyxWe02UdVMXRIqsyIQP9uAsEC7DrRp0QgxwoKCGCDDg2MeKmZD+JfRkVn0+g5xwCAJMlVcEBY6xN3GdFbA4X1W3GI9wlqZVuwVcIAyQ6ljLQpkABE6A-d1l0kipDDMGoxkc2xHI6TFsSYhAbDqQI0VjfxjExYI-JmMSJ0EjgLO-Kzay3fogPqPxQMxdxUtiuUnCcvxqmCBV4niIA */
  return createMachine(
    {
      context: {
        connection,
        latestBlockhash: undefined as
          | {
              blockhash: string;
              latestValidBlockHeight: number;
            }
          | undefined,
        feePayer: undefined as PublicKey | undefined,
        instructions: undefined as TransactionInstruction[] | undefined,
        transaction: undefined as Transaction | undefined,
        getLatestBlockhashRef: undefined as
          | ActorRefFrom<ReturnType<typeof getLatestBlockhashMachine>>
          | undefined,
      },
      tsTypes: {} as import('./create-transaction.machine.typegen').Typegen0,
      schema: { events: {} as CreateTransactionMachineEvent },
      id: 'Create Transaction Machine',
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Fetching latest blockhash',
          },
          on: {
            createTransaction: {
              actions: 'Save fee payer and instruction in context',
              target: 'Fetching latest blockhash',
            },
          },
        },
        'Fetching latest blockhash': {
          entry: 'Start get latest blockhash machine',
          on: {
            'Rpc Request Machine.Request succeeded': {
              actions: 'Save latest blockhash in context',
              target: 'Creating transaction',
            },
          },
        },
        'Creating transaction': {
          always: {
            cond: 'auto build enabled',
            target: 'Transaction created',
          },
          on: {
            buildTransaction: {
              actions: 'Save fee payer and instruction in context',
              target: 'Transaction created',
            },
          },
        },
        'Transaction created': {
          entry: 'Save transaction in context',
          always: {
            cond: 'is fire and forget',
            target: 'Done',
          },
          on: {
            restartMachine: {
              actions: 'Clear context',
              target: 'Idle',
            },
          },
        },
        Done: {
          type: 'final',
        },
      },
    },
    {
      actions: {
        'Start get latest blockhash machine': assign({
          getLatestBlockhashRef: ({ connection }) =>
            spawn(getLatestBlockhashMachine(connection), {
              name: 'get-latest-blockhash',
            }),
        }),
        'Save latest blockhash in context': assign({
          latestBlockhash: (_, event) => event.data,
        }),
        'Save transaction in context': assign({
          transaction: (context) =>
            new Transaction({
              feePayer: context.feePayer,
              recentBlockhash: context.latestBlockhash?.blockhash,
            }).add(...(context.instructions ?? [])),
        }),
        'Clear context': assign({
          transaction: (_) => undefined,
          latestBlockhash: (_) => undefined,
          feePayer: (_) => undefined,
          instructions: (_) => undefined,
          getLatestBlockhashRef: ({ getLatestBlockhashRef }) => {
            if (
              getLatestBlockhashRef !== undefined &&
              getLatestBlockhashRef.stop !== undefined
            ) {
              getLatestBlockhashRef.stop();
            }

            return undefined;
          },
        }),
        'Save fee payer and instruction in context': assign({
          instructions: (_, event) => event.value.instructions,
          feePayer: (_, event) => event.value.feePayer,
        }),
      },
      guards: {
        'auto start enabled': () => config?.eager ?? false,
        'is fire and forget': () => config?.fireAndForget ?? false,
        'auto build enabled': () => config?.autoBuild ?? false,
      },
    }
  );
};

export const createTransactionServiceFactory = (
  connection: Connection,
  config?: {
    eager: boolean;
    autoBuild: boolean;
    fireAndForget: boolean;
  }
) => {
  return interpret(createTransactionMachineFactory(connection, config));
};
