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
  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAHQCSEANmAGJy6bGEIkylWsUSgADjVhVqdWSAAeiALQBGAAwAWABwcjOgMwB2IwFY7OgEyWAnABoQAT20A2PRwfmDs56tgbm5jYGOt4AvjHuaJg4BESkFCr0TOSs7Nx8gmoKShlqmghaRoH+lgYORt76hjYODu5e5Q4Gzhzmzt4uwUbODt7DNnEJIsniaVJ0jCxsnABiYFjZbFC4vKKwWLgARrw05ADWzBiwzAIQdJxsAG40p5yJoikS6dILG7mr6zktjscHtDsczhcrghHidsNIANp6AC6hUUymkpW0BhcHH0Fm8DkcRmxRlsbR8fgCQT0fUJOmcNmJBgmIDe01SkgyPxyKzWvyBu32RxO50u1zAqFQNFQHDkwIAZtKALYcNl4Gac75ZHkcf787aCsEiyHMaHEJ7kOF0REopAgIro1R2spaSI6DgGbw2Sz4uzhAw2ckdXocb1GFw1PQ6Yw1WLxVlTdUcr7zbVLVVTTa4LDJubEASwNarMAABQwHglqOKGOd2haDlD3nMRij5j0Nh0QysQd0fQ43k9zgZLgswT05hZao+sy5adybKzOc+eYLay4pBzAFc8-A7Q6SrWOkEOD6rJ6QvVmm5PNputjvF6DOPKuZO9FJ4np5rU4t55niFsS4ztIAgHJuVC8BAGopjIe5ogeoBlA0HA0mYzQOFGlSWJYejeD20R+AOnTGG2DgdqMH5JEmy6zr+rz-oBuYZAIVaOrBiGIM4BimJYr7RsMww0qMPZPiegSDBYLa2P0cbxsQNAQHAahTtBebcumPD8KxCEaNoeLui0T5GISOH1JYrQ3ke3ihtYLgRM2Nh6HU4zxipTFanRup8oCBogkK4Kilc2k1hx5RmO6OiOU+TgGLU0RGPhnQ2QOxJmA0r4BJR7yqbRvz0Uki7uU68jwSFunlDoljWThjJ6NhI5DM4lg9i2-b1C2g5OFYDJZeyNEeXlHA5d8aoQMFxXlc25i4rxNjNgGRKBpZui4bi7Xtn0QxOc0vXUcBP55eN7HlSt5mmBY1h2B2TjXu0WiBA2vT9D6c14nUskxEAA */
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
