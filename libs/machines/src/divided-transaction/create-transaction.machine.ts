import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { v4 as uuid } from 'uuid';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const createTransactionModel = createModel(
  {
    id: undefined as string | undefined,
    createdAt: undefined as number | undefined,
    feePayer: undefined as PublicKey | undefined,
    instructions: [] as TransactionInstruction[],
    latestBlockhash: undefined as
      | {
          blockhash: string;
          lastValidBlockHeight: number;
        }
      | undefined,
    transaction: undefined as Transaction | undefined,
  },
  {
    events: {
      createTransaction: (value: {
        instructions?: TransactionInstruction[];
        feePayer?: PublicKey;
      }) => ({ value }),
      setInstructions: (value: TransactionInstruction[]) => ({ value }),
      setFeePayer: (value: PublicKey) => ({ value }),
      buildTransaction: () => ({}),
    },
  }
);

export type CreateTransactionMachineServices = {
  'Fetch latest blockhash': {
    data: {
      blockhash: string;
      lastValidBlockHeight: number;
    };
  };
};

export const createTransactionMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAHQCSEANmAGJy6bGEIkylWsUSgADjVhVqdWSAAeiALQBOAAwBWDjoMA2faYDMeywBYAjAA4DAGhABPbfYDsAJg6++t4m3qGOjvYAvpFuaJg4BESkFCr0TOSs7BwAYmBYGWxQuLyisFi4AEa8NOQA1swYsMwCEHScbABuNLWccaKJEinSjCxsnLn5mUUlOGWV1XUNTQidNdjSANp6ALpqCkqpapoIWnY6HI565nq2BpaOob4Pbp4n9r5GwXoROpbepnodDpHL5orERAlxMkpHQRgUshN4dNSuUqjV6o1mmBUKgaKgOHIZgAzPEAWw4fUhSUkqThmXGeSRxRR83RS2YK2IXXI6zoW12SBA+2U0iO2lMgQ49nMDglBj0vicrg82l8EqlIJ+728TkcOlMYJAlLwUJpw3S9IpEMKuCw1KGdAEsDyuTAAAUMO5sXtFCLVILjlpghxvFc9ZZTI4rP9TMrXlp7CYAkEo5YdImJVdDcaBtDaRaxlb4ja7YMYcQnXkuKQ7QBXcvwQXCw4B7RRi5mKOR2x6YIfXwvbSWfzfK7eAz-HuWYc6bMQk328t0wuUkuL1ICCq1qi8CCmh0yJu+lugY72WymDimSOA3w2C-vWzeQdvaUhlOmUMGRW+byOaIxCAxA0BAcBqDm+5LgWWQ8PwPoHKKrZvDc9jGGY+hXKYtgWC+CaSl8ES9vqBj2PY9xzvEC5lvmowIoyUzMrMqILBiTTwX6h6nuKDhoeY1gGDooTYY4uFkd477fJY9gGAYlw6tJFH9JBNHwr01rEEUpZ5oh8jHjpGhtrYHC2BEeqyb2oRAnGXg2Mm3xqg4ji2GmtyKVS1HmrRnDKcMxoQOxJ4GQgF6XpYMmyfxNySaJtmBN8BgXsCejSX+blUdpsLQWAAX6YG9hXEYJjXJh2FXLh05GE4Txke8E7XrYAGREAA */
  createTransactionModel.createMachine(
    {
      context: createTransactionModel.initialContext,
      tsTypes: {} as import('./create-transaction.machine.typegen').Typegen0,
      schema: { services: {} as CreateTransactionMachineServices },
      id: 'Create Transaction Machine',
      initial: 'Idle',
      states: {
        Idle: {
          on: {
            createTransaction: {
              actions: 'Generate id and save in memory',
              target: 'Fetching latest blockhash',
            },
          },
        },
        'Fetching latest blockhash': {
          invoke: {
            src: 'Fetch latest blockhash',
            onDone: [
              {
                actions: 'Save latest blockhash in memory',
                target: 'Creating transaction',
              },
            ],
            onError: [
              {
                actions: 'Notify fetch latest blockhash error',
              },
            ],
          },
        },
        'Creating transaction': {
          on: {
            setFeePayer: {
              actions: 'Save fee payer in memory',
            },
            setInstructions: {
              actions: 'Save instructions in memory',
            },
            buildTransaction: {
              actions: 'Generate transaction and save in memory',
              target: 'Transaction Created',
            },
          },
        },
        'Transaction Created': {
          type: 'final',
        },
      },
    },
    {
      actions: {
        'Generate id and save in memory': assign({
          id: (_) => uuid(),
          createdAt: (_) => Date.now(),
          instructions: (_, event) => event.value.instructions ?? [],
          feePayer: (_, event) => event.value.feePayer,
        }),
        'Save fee payer in memory': assign({
          feePayer: (_, event) => event.value,
        }),
        'Save instructions in memory': assign({
          instructions: (_, event) => event.value,
        }),
        'Notify fetch latest blockhash error': (_, event) =>
          console.error(event.data),
        'Save latest blockhash in memory': assign({
          latestBlockhash: (_, event) => event.data,
        }),
        'Generate transaction and save in memory': assign({
          transaction: (context) =>
            new Transaction({
              feePayer: context.feePayer,
              recentBlockhash: context.latestBlockhash?.blockhash,
            }).add(...context.instructions),
        }),
      },
    }
  );

export const createTransactionServiceFactory = (connection: Connection) =>
  interpret(
    createTransactionMachine.withConfig({
      services: {
        'Fetch latest blockhash': () => connection.getLatestBlockhash(),
      },
    })
  ).start();

/* export const createTransactionServiceFactory = (connection: Connection) =>
  interpret(
    createTransactionMachine.withConfig({
      actions: {
        'Generate id and save in memory': assign({
          id: (_) => uuid(),
          createdAt: (_) => Date.now(),
          instructions: (_, event) => event.value.instructions ?? [],
          feePayer: (_, event) => event.value.feePayer,
        }),
        'Save fee payer in memory': assign({
          feePayer: (_, event) => event.value,
        }),
        'Save instructions in memory': assign({
          instructions: (_, event) => event.value,
        }),
        'Notify fetch latest blockhash error': (_, event) =>
          console.error(event.data),
        'Save latest blockhash in memory': assign({
          latestBlockhash: (_, event) => event.data,
        }),
        'Generate transaction and save in memory': assign({
          transaction: (context) =>
            new Transaction({
              feePayer: context.feePayer,
              recentBlockhash: context.latestBlockhash?.blockhash,
            }).add(...context.instructions),
        }),
      },
      services: {
        'Fetch latest blockhash': () => connection.getLatestBlockhash(),
      },
    })
  ).start(); */
