import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { ActorRefFrom, assign, createMachine, interpret, spawn } from 'xstate';
import { rpcRequestMachineFactory } from './rpc-request.machine';
import { EventData, EventType, EventValue } from './types';

type CreateTransactionEvent = EventType<'createTransaction'> &
  EventValue<{
    feePayer: PublicKey;
    instructions: TransactionInstruction[];
  }>;
type RpcRequestSuccess = EventType<'Rpc Request Machine.Request succeeded'> &
  EventData<{
    blockhash: string;
    lastValidBlockHeight: number;
  }>;

export type CreateTransactionMachineEvent =
  | CreateTransactionEvent
  | RpcRequestSuccess;

export const createTransactionMachineFactory = (
  connection: Connection,
  config?: {
    fireAndForget: boolean;
  }
) => {
  const getLatestBlockhashMachine = (connection: Connection) =>
    rpcRequestMachineFactory(() => connection.getLatestBlockhash(), {
      eager: true,
      fireAndForget: true,
    });

  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAHQBiYW5rxKLgA22OFlwAjYTXIBrZhljMAxACUADuVxqwARwCu4xizaddh47APlyYSJESgNNWFWp0nIAB6IAtABsAAwcQQAcAOwRAExhQbEALACMSQkArAA0IACe-gDMYXkchbERSWnRCWHRAQCcCQC+DVlomDgERKQUHvRM-GYchCRklLT05OhiECpeLm49Xr4IeQm1HAVBedG10Wl5ebUxCVm5CH5pYQEcAXFp5SnpaQmNzSCtYh3D3WMm-ewqEzaYCGXVGniQIDm7jGi38qxCNVKkXitTiQQCJ38wSuSVuqSSARi5TSTVexBoEDgXne7RBIx6vwEnAAkhBhGBZq5oeDQEtouEOBEEsECWkgkEomEwsccv4ImKOLjUgFttFogdqk0WpNaZ16T8+kzuLw-kJRDhYBJpLIFEpmJz5jCIUtzkk1vsItLLjtInlMWcDld9qVUbV0UE7lq3jq8HTvnRGQM42DxjGIA7ucRYWcqhxdvF0RUYvV5f7ArjrrcgklogS8qkSa8abG9fHeqZ2BwACJ0DkQqELZ2IA5pDhpWphsoXeFhPZlvIREIlSK1VJq6VR5ufUEMw1mDOD3n+J5FD1euqlP2ys6FUdK1Yn-k1UkNIA */
  return createMachine(
    {
      context: {
        connection,
        latestBlockhash: undefined as
          | {
              blockhash: string;
              lastValidBlockHeight: number;
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
      on: {
        createTransaction: {
          actions: 'Save fee payer and instruction in context',
          target: '.Fetching latest blockhash',
          internal: false,
        },
      },
      id: 'Create Transaction Machine',
      initial: 'Idle',
      states: {
        Idle: {},
        'Fetching latest blockhash': {
          entry: 'Start get latest blockhash machine',
          on: {
            'Rpc Request Machine.Request succeeded': {
              actions: 'Save latest blockhash in context',
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
        },
        Done: {
          type: 'final',
        },
      },
    },
    {
      actions: {
        'Save fee payer and instruction in context': assign({
          instructions: (_, event) => event.value.instructions,
          feePayer: (_, event) => event.value.feePayer,
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
        'Start get latest blockhash machine': assign({
          getLatestBlockhashRef: ({ connection }) =>
            spawn(getLatestBlockhashMachine(connection), {
              name: 'get-latest-blockhash',
            }),
        }),
      },
      guards: {
        'is fire and forget': () => config?.fireAndForget ?? false,
      },
    }
  );
};

export const createTransactionServiceFactory = (
  connection: Connection,
  config?: {
    fireAndForget: boolean;
  }
) => {
  return interpret(createTransactionMachineFactory(connection, config));
};
