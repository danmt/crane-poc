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
    connection: new Connection('http://localhost:8899'),
    id: 'default-id',
    createdAt: Date.now(),
    feePayer: PublicKey.default,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAHQCSEANmAGJy6bGEIkylWsUSgADjVhVqdWSAAeiALQBOAKwAmDjoDsBnQGYADFYsGAbOYAsAGhABPbfacdrARnsLPz0dPxMrcIAOAF9otzRMHAIiUgoVeiZyVnZuPkE1BSV0tU0ELRMLew4nCwsaqz1Iv0irAxM3TzKDPQtq+z1DAz8LE0chk1j4kSTxVKk6RhY2TgAxMCwstihcXlFYLFwAI14acgBrZgxYZgEIOk42ADcaM84E0WSJNOlFzZy1jbZba7HD7I4nc6Xa4IJ6nbDSADaVgAugVFMppCVtBZIr0HA0rPZ7FYdJFzBY9B0vD5-IEHPZ9E5IiYJnEQO8ZilJOlftlVus-sC9gdjqcLlcbmBUKgaKgOHIQQAzWUAWw4HLws25P0yfI4AMFO2F4LFUOYMOIz3I8LoSNRSBAhQxqgdpS0Ticeg4jiZjWGRMilI82gMNW9ThMhisHtJTlsOkm7Ommq53wWuuW6umW1wWFT82IAlg6zWYAAChh3FK0UVMa7tH4HBwzM49CZIv0LDodFSujZm8ETM1caYnOY9ImNZ85jyMzkOTm818C0X1lxSHmAK4F+AOp3FetlYa9ZkGSI6BrhGx1Ay9rTDDh6T0jKIBiM4yfJ6fa9NLefZ4htiXGdpAEQ5NyoXgIC1NMZD3dED1AUpgiqSwLwiMxo2ZZo7wCHwhz8MJhj0KwO1JAxP0SFNl1nP83gAoD83SAQa2dOCkMQPwLwHLtwg9dsQjCO8PQ4FoAiCZpvBxexYjZYgaAgOA1CnGCC15TMeH4VjEI0bRQi9HE7HpQYwnaYMumscNIwCRp7EDNtWSmKjv1g9T-gFIEjVBEUIXFa5tLrDiyiHAySSfFsBnsCpcLPcMo3bbwmScYJKI+VTaL+ejEkXJjAsdBC8rdFpRO8fQDHxJ9ox7cytEifCBkMFlkpJUjHKTZz0p1OiOE6hYNQgAKXSCiMdA4Kw-BqNCGUsZ9cL8KwOG6AZzHGswBg9VLORorrMsG9jdLKUxULMSxrwcZw7zsKonH6QwI0aSw7Fk6IgA */
  createTransactionModel.createMachine(
    {
      context: createTransactionModel.initialContext,
      tsTypes: {} as import('./create-transaction.machine.typegen').Typegen0,
      schema: { services: {} as CreateTransactionMachineServices },
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
          always: {
            cond: 'auto build enabled',
            target: 'Transaction Created',
          },
          on: {
            setFeePayer: {
              actions: 'Save fee payer in memory',
            },
            setInstructions: {
              actions: 'Save instructions in memory',
            },
            buildTransaction: {
              target: 'Transaction Created',
            },
          },
        },
        'Transaction Created': {
          entry: 'Generate transaction and save in memory',
          type: 'final',
        },
      },
    },
    {
      actions: {
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
        'Fetch latest blockhash': ({ connection }) =>
          connection.getLatestBlockhash(),
      },
      guards: {
        'auto build enabled': () => false,
        'auto start enabled': () => false,
      },
    }
  );

export const createTransactionServiceFactory = (
  connection: Connection,
  feePayer: PublicKey,
  instructions: TransactionInstruction[],
  config?: {
    eager: boolean;
    autoBuild: boolean;
  }
) =>
  interpret(
    createTransactionMachine.withConfig(
      {
        guards: {
          'auto build enabled': () => config?.autoBuild ?? false,
          'auto start enabled': () => config?.eager ?? false,
        },
      },
      {
        connection,
        id: uuid(),
        createdAt: Date.now(),
        instructions,
        feePayer,
        latestBlockhash: undefined,
        transaction: undefined,
      }
    )
  );
