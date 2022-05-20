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
type BuildTransactionEvent = EventType<'buildTransaction'> &
  EventValue<{
    feePayer: PublicKey;
    instructions: TransactionInstruction[];
  }>;
type RpcRequestSuccess = EventType<'Rpc Request Machine.Request succeeded'> &
  EventData<{
    blockhash: string;
    latestValidBlockHeight: number;
  }>;
type RestartMachineEvent = EventType<'restartMachine'>;

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

  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAHQCSEANmAGJy6bGEIkylWsUSgADjVhVqdWSAAeiALQAWAKwAGDnoCMAdh06AHAb0AmPVZ1mzAGhABPbXYBsZjga2ZiYmBlYAnLY6JgC+Me5omDgERKQUKvRM5Kzs3HyCagpKGWqaCFo+DhwWdjoAzGbhdTo+PuF27l7ldTYcVqF1fiZ1BpVmPnEJIsniaVJ0jCxsnABiYFjZbFC4vKKwWLgARrw05ADWzBiwzAIASnLkuLdgAI4ArnAHWTmcz++fuFgb3I5DAkEghUUymkpW8eh8HHCfnqBnCehGVjMTk62gadg4djsVnRdhGDhMLUmIESohSEnS0kWm1yNOoxG2WFSkgyAkObyovAgs25MKQICK0NUYrKZiMIT04SsdT0+lGpisOPKziM-V1FJ0kSiVNZeGFDIW32WHFZW1wnPp82IAkhxVFoDKoSM4wV-WigXGg01WgV+IMhPRrRMdhM4Qsxumpq55syS1yZsduGESUgAnQ+wwqCwlvYLslMml2nqBLCtVJqJVhmJQacXsMssqIzqJkq8ezdLmGSZPw46cHWdEEGdYolJQrCBa+IcxNMOgMZnRBhMeiDq5MBNrXcCbRGfji8RAxBoEDgahN-ZFFtTnB4-FLs-dlb0-jMdjC4TRlSYt2OjNqMAQ+CYSoNAYXY6ESva0qOjLFqs6zMtsuw4PsRwnOclzXG+boaJWjTGO0zguD4Vi1JEbieIgdQcHUioxpudiKiMYQ6AhMxJhmKHWtMtr2gOREzkRZRaL+e6-gav7RuY1htEG9j4lu9TdoqTgUlYPGJg6g4CUhCzjjgECEVKH7zpBHDAVioyxpiioqT+AThg4saKXBen3smQ5WgAInQYAWeWVmNhwFFErKFIwdGdRBpBOrRvCoT2cMdg+cZKbMiF05Qu+xHlD4BrVHB9SNM0rTtEG4TDNUbZbu0hJUWYZ4xEAA */
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
