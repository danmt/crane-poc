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
  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAHQCSEANmAGJy6bGEIkylWsUSgADjVhVqdWSAAeiALQBOAMx6OABgAcARgBsAFgtmbOgExWdAGhABPbVbMcnAVj8TIz0jP1sdKwB2AF9otzRMHAIiUgoVeiZyVnZuPkE1BSV0tU0ELUjLDj8rBzsLCx0LIx1zN08yhxCOK2ao0z8zPz0rMNj4kSTxVKk6RhY2TgAxMCwstihcXlFYLFwAI14acgBrZgxYZgEIOk42ADcaY84E0WSJNOk5tZzl1eyNrY4Hb7Q4nM4XBD3I7YaQAbSMAF0CoplNISto9BZDJjHA4HJEnGYnCY2l4fP5AmY9CZhrZLGMQC9JilJOkvtklitvgDtrsDkdTudLmBUKgaKgOHJAQAzcUAWw4TLwU1Zn0yHI4v25m15IIF4OYkOID3IMLo8KRSBAhVRqitpS0NT8HEiBj8kSdzSCflJHQcRiqOjqQaxkT8+JMDKVb2mbPVC0VE3WuCwLI+dAEsBWyzAAAUMO4Rciimj7dozEYLBwaZZwkZTHohmZfVozJFIhwLH5GhYw0Mu0MrFGJsq0zMMvMckzk6n3uPMysuKRUwBXcfwK024plspmKkcFqWSsWEw1Fqn306KoV3veHQRIwOEwVYeJUdzuOT55J4gbWex6QBD2FcqF4CAVXTGRNxRbdQFKNsqxpR8Q0rMwg0iCwWzsHwByJetrEiEw8VfV4IPHdkE2nX8UzHdIBGLW0oLgxBagDJpw2qAxG1DH0PG0WoXRGd173rRtmh0WI4hAYgaAgOA1GjMjP2+TgeH4BjYI0bQTB0Z1nDQmoMK7Klmz4jojA7bs6iGesMPMCwSOZD81S-TUuX+HUgT5UFBQuDTS2YsoGj0swiKxAwWgsfEsNCKodMGLtCL0Rpqkc98ANmeMpx-P9aIC60YPyh0mgPV16hpD0aW7SIW1sTt7yiawAlEhxrDSmNVUy1ylM+JUIH8u1AucEwD1CXtCICLEdErFtnw4NCInbV0917Gl2p6rqVIGpitLKXSO1MSwbGDJxXDMrQQkMHoIgCEZQjCodJKAA */
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
