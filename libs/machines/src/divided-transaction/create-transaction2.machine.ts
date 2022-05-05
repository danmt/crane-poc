import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { ActorRefFrom, assign, createMachine, interpret, spawn } from 'xstate';
import { rpcRequestMachineFactory } from './rpc-request.machine';

export type EventType<Type> = { type: Type };
export type EventValue<Type> = { value: Type };

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
    EventValue<{
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

  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAEwB0AkhADZgAxOXTYwhEmUq1iiUAAcasKtTryQAD0QBGAJwBmLgAZTxgCwcAHADZjegKwHzAGhABPRM4DsXPf70bHStnK0cHcwBfSLc0TBwCIlIKNXomclZ2bj5BIQ0lFVSNbQR9IzMLaztHZzdPBA4OPT8AvUaOMoMHK2jYsQTJZJk6RhY2Ti4AMTAsDLYoXH5xWCxcACN+GnIAa2YMWGYhACUFclwjsABHAFc4VfTMsC4Lm7vcWGvycjBISHzlVSyYqIKzecocBzGKwcYzeYwGKwObx1LwGYxcSGmDjeHTGJzQvTeXogOLiRJSFKyUZzLJcUnUYgLLBJaSpIRra5UfgQQasoFIEAFQHqAUlHTmcy+ez+EKg+wGbyuDyoqxcGzqmwGHQwvSw0EGYn0vC8ykjB7jbj0+a4ZkU4bEPICoVFUW6CVSgKyuGGRUohowtUaoIOQI6HQ2HoxEn9Y0s01pMa0k323CieKQIToFYYVBYc3sf6FfmgMV2bhIyEK5wOEM4v26lr+bxWHRwmzmKz2Q0x8lDVLUx7cZP9tPiCCOxQAl0lxAw7y+cMQrWIhFhv2NIzhjU6ENBcORqPEGgQOAaI29vlmxMTHJgQvCuSuhCWP0+Rv+RrdfQObvpi-xgcLSmGYaQWJYcBWdZNh2PYDnvactEQSEbC4cwFQcDhzAjcxDCRJV6mXDEKm1Gw9HFEIbF-MlhypfMJitRkbTje14OLRDSg6VUDAhfcOiaTCbFfND30McUbBDKxESogZmP7Oih1kqlRxwCBWJFGdSm8OwMQVLCHFInD9CsdcOBQoNxLQvRoW4n8o3PGirxpCYABE6DvJ0pzYkoOC1dEQ38Vt2gcVt8NnDCuC3cSwUCsFvA4aTYztOTrw4NTHw04I-WCaJoiAA */
  return createMachine(
    {
      tsTypes: {} as import('./create-transaction2.machine.typegen').Typegen0,
      schema: {
        events: {} as CreateTransactionMachineEvent,
      },
      id: 'Create Transaction Machine2',
      initial: 'Idle',
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
          latestBlockhash: (_, event) => event.value,
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

export const createTransactionServiceFactory2 = (
  connection: Connection,
  config?: {
    eager: boolean;
    autoBuild: boolean;
    fireAndForget: boolean;
  }
) => {
  return interpret(createTransactionMachineFactory(connection, config));
};
