import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { inspect } from '@xstate/inspect';
import { ActorRefFrom, assign, interpret, send, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { blockhashCheckerMachine } from './blockhash-checker.machine';
import {
  createTransactionMachine,
  createTransactionModel,
} from './create-transaction.machine';

inspect({
  // options
  // url: 'https://stately.ai/viz?inspect', // (default)
  iframe: false, // open in new window,
});

export const transactionProcessorModel = createModel(
  {
    createTransaction: undefined as
      | ActorRefFrom<typeof createTransactionMachine>
      | undefined,
    blockhashChecker: undefined as
      | ActorRefFrom<typeof blockhashCheckerMachine>
      | undefined,
  },
  {
    events: {
      createTransaction: () => ({}),
    },
  }
);

export type TransactionProcessorMachineServices = {
  'Creating transaction': {
    data: any;
  };
};

export const transactionProcessorMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUBOBDAdrdBjALgJYD2mABAAqrG5yzGpkCyeAFoZmAHQCSEANmADEuVGHT4waLDgIlMiUAAdisQkVKKQAD0QBaACwBWAAxcAHAHYTARgDMRgGyO7jqwYA0IAJ76b5xy4ATmMbIyDnI3MAJidHAF94r2lsPA1yKho6BmY2Dm4AYTEJDigyFNl0oS0VNXStXQRokwMuR0sokxigy0to2M8ffWj7LgMHEP9HCPMAxOSMVLlSSmpaWHpGFlx2Ti4AMQ5CWF2y-EXK+TJRcSqa1XV5BsQ7aMDo63MgsKCrUyCjF5fAg9NE2o4uuMTA4XADzIkkiBMMQIHAtBU0ldMutNrkdvleAIwPc6k8kDp9I4bEEuDZonZ7EE7BEDCEgkC-ACuB8giZLO0vk43vMQBjlhk1tktnk9kVbqVyhdMZpybVHirQI09DY6RYjEYDDFzC0eqZzByQf47MFPgb+T1zKzoiKxelVlkNjltrtuABlQhQTAK84yZUKVUPerkxpmrgmaEmXl0hkmRwGRwW7UGMEsqH6yzUkzOxGurGSz3S-F7Q5Bk7BpXi67FKPKSNkzWU61BX6WYz82zRY12C2vCwON4GuzG1n8l0Nt3YqV4n0k9XhjsgtPW5OM5lptmZweBcbhVzZwcdOx2BHxIA */
  transactionProcessorModel.createMachine({
    tsTypes: {} as import('./transaction-processor.machine.typegen').Typegen0,
    schema: { services: {} as TransactionProcessorMachineServices },
    id: 'Transaction Processor Machine',
    initial: 'Idle',
    states: {
      Idle: {
        on: {
          createTransaction: {
            actions: [
              'Spawn create transaction machine',
              'Start creating transaction',
            ],
            target: 'Creating Transaction',
          },
        },
      },
      'Creating Transaction': {
        always: {
          actions: 'Finish transaction creation',
          cond: 'creating transaction',
          target: 'Finishing transaction creation',
        },
      },
      'Signing transaction': {},
      'Finishing transaction creation': {
        always: {
          cond: 'transaction created',
          target: 'Signing transaction',
        },
      },
    },
  });

export const transactionProcessorServiceFactory = (
  connection: Connection,
  instructions: TransactionInstruction[],
  feePayer: PublicKey
) =>
  interpret(
    transactionProcessorMachine.withConfig({
      actions: {
        'Spawn create transaction machine': assign({
          createTransaction: (_) => {
            return spawn(
              createTransactionMachine.withConfig({
                services: {
                  'Fetch latest blockhash': () =>
                    connection.getLatestBlockhash(),
                },
              }),
              {
                name: 'createTransaction',
                sync: true,
              }
            );
          },
        }),
        'Start creating transaction': send(
          createTransactionModel.events.createTransaction({
            feePayer,
            instructions,
          }),
          { to: 'createTransaction' }
        ),
        'Finish transaction creation': send(
          createTransactionModel.events.buildTransaction(),
          {
            to: 'createTransaction',
          }
        ),
      },
      guards: {
        'transaction created': (context) => {
          const snapshot = context.createTransaction?.getSnapshot();

          if (snapshot === undefined) {
            return false;
          }

          return snapshot.value === 'Transaction Created';
        },
        'creating transaction': (context) => {
          const snapshot = context.createTransaction?.getSnapshot();

          if (snapshot === undefined) {
            return false;
          }

          return snapshot.value === 'Creating transaction';
        },
      },
    }),
    { devTools: true }
  ).start();
