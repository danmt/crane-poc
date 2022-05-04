import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { interpret, sendParent } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { confirmTransactionServiceFactory } from './confirm-transaction.machine';
import { createTransactionServiceFactory } from './create-transaction.machine';
import { sendTransactionServiceFactory } from './send-transaction.machine';
import {
  signTransactionModel,
  signTransactionServiceFactory,
} from './sign-transaction.machine';

export const transactionProcessorModel = createModel(
  {
    connection: new Connection('http://localhost:8899'),
    feePayer: PublicKey.default,
    instructions: [] as TransactionInstruction[],
    signer: Keypair.generate(),
  },
  {
    events: {
      createTransaction: () => ({}),
      transactionCreated: (value: {
        transaction: Transaction;
        lastValidBlockHeight: number;
      }) => ({ value }),
      transactionSigned: (value: Transaction) => ({ value }),
      transactionSent: (value: TransactionSignature) => ({ value }),
      transactionConfirmed: (value: TransactionSignature) => ({ value }),
      transactionFailed: (value: unknown) => ({ value }),
    },
  }
);

export const transactionProcessorMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUBOBDAdrdBjALgJYD2mABAAqrG5yzGpkCyeAFoZmAHQCSEANmADEuVGHT4waLDgIlMiUAAdisQkVKKQAD0QBaAMwBWAJxcATAEYAbAA5LABkuWALNYPnbAGhABPfQauXEZGBgDsJqYGBi7OkQC+8T7S2Hga5FQ0dAzMbBzcfIJCWipq6Vq6CHo2RsGWJrbmDQ4uRpZGYeY+-lUGtmF15tbWTvVWLmGJyRipcqSU1LSw9IwsuOycXADCYhIcUGQpsulC+DPH8jvikhAlquryFQEGZhFhDgYOnbG21t36LhcFnMRiaE3MLhMlneximICOaXkCyyyxyaw23AAyoQoJh9mQzjJEaRTudiZhsbjIHcyo8kDoAo0LGEbLYGkZbE5QS5-ggPOZgh1zGFbJDbB4RQY4Qi5hlFtlVnlNpiwJgIPjCbMTpqLqQVZh8DSHpp6ZUmgLrNCPA4Rg1OaLeZYXoMhk13E0HI1pWTZcilitcut8ttSAAzQioAC2Gp92tjlzDEcj1PppWNClNiGFtXaLlFJgcbtMw15ehBQJcn2FDUs5gMdj6iSSIEwxAgcC0MvSfoVgYxvAEYCN5UzvUrXAckUCJmMNo6fz8AIctViLRiVjC7zrRm9RN9mX9aKV3Cue0wBy7dOU9xHoEqekBli4-RMLM3YUhoNL5ghXE67yMBwnDZFpzF3LUkQPXt0WDSk8XPAl4xNa9aWQhkqhcJouFzQInGzYYTEdJwJ0La1nGsVooTA5tL3mKDUUVINlVVdUEJ1clhyvdCrFqExMM+awwiMQEbQdRc+UcCchQ6eoJmsUxwN1OUUQDGDNi2RMoxjPdbxANNdLNG1gn4utnBCfiFx6PQRQnQEOi+ExhU9QFFPJHsGL7YNaPIXBNOTW5UxvLizVCLhhjCGJPk3StAlLF4gTwwSnWsV9PTCaxXP3eUPLUodAtQjM7wBeTnzeaFosiLpxIfGzV0rEFhQo+SdybIA */
  transactionProcessorModel.createMachine(
    {
      tsTypes: {} as import('./transaction-processor.machine.typegen').Typegen0,
      id: 'Transaction Processor Machine',
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Creating Transaction',
          },
          on: {
            createTransaction: {
              target: 'Creating Transaction',
            },
          },
        },
        'Creating Transaction': {
          invoke: {
            src: 'Create transaction machine',
          },
          on: {
            transactionCreated: {
              actions: [
                'Transaction created',
                sendParent((_, event) => ({
                  type: 'Transaction Processor Machine.Transaction created',
                  value: event.value,
                })),
              ],
              target: 'Signing transaction',
            },
          },
        },
        'Signing transaction': {
          invoke: {
            src: 'Sign transaction machine',
          },
          on: {
            transactionSigned: {
              actions: 'Transaction signed',
              target: 'Sending transaction',
            },
          },
        },
        'Sending transaction': {
          invoke: {
            src: 'Send transaction machine',
          },
          on: {
            transactionSent: {
              actions: 'Transaction sent',
              target: 'Confirming transaction',
            },
          },
        },
        'Confirming transaction': {
          invoke: {
            src: 'Confirm transaction machine',
          },
          on: {
            transactionConfirmed: {
              actions: 'Transaction confirmed',
              target: 'Transaction confirmed',
            },
          },
        },
        'Transaction confirmed': {
          type: 'final',
        },
      },
    },
    {
      actions: {
        'Transaction created': () => {},
        'Transaction signed': () => {},
        'Transaction sent': () => {},
        'Transaction confirmed': () => {},
      },
      guards: {
        'auto start enabled': () => true,
      },
      services: {
        'Create transaction machine':
          ({ connection, feePayer, instructions }) =>
          (send) => {
            const machine = createTransactionServiceFactory(
              connection,
              feePayer,
              instructions,
              { eager: true, autoBuild: true }
            )
              .start()
              .onTransition(
                ({ context: { transaction, latestBlockhash }, done }) => {
                  if (
                    done &&
                    transaction !== undefined &&
                    latestBlockhash !== undefined
                  ) {
                    send(
                      transactionProcessorModel.events.transactionCreated({
                        lastValidBlockHeight:
                          latestBlockhash.lastValidBlockHeight,
                        transaction,
                      })
                    );
                  }
                }
              );

            return () => {
              machine.stop();
            };
          },
        'Sign transaction machine':
          ({ signer }, event) =>
          (send) => {
            const machine = signTransactionServiceFactory(
              event.value.transaction,
              {
                eager: true,
              }
            )
              .start()
              .onTransition(({ context, done }) => {
                if (done && context.transaction !== undefined) {
                  send(
                    transactionProcessorModel.events.transactionSigned(
                      context.transaction
                    )
                  );
                }
              });

            machine.send(signTransactionModel.events.partialSign(signer));

            return () => {
              machine.stop();
            };
          },
        'Send transaction machine':
          ({ connection }, event) =>
          (send) => {
            const machine = sendTransactionServiceFactory(
              connection,
              event.value,
              { eager: true }
            )
              .start()
              .onTransition(({ context, done, value }) => {
                if (
                  done &&
                  value === 'Transaction Sent' &&
                  context.signature !== undefined
                ) {
                  send(
                    transactionProcessorModel.events.transactionSent(
                      context.signature
                    )
                  );
                }

                if (done && value === 'Transaction Failed') {
                  console.log({ context, event });

                  /* send(
                    transactionProcessorModel.events.transactionFailed(
                      context.signature
                    )
                  ); */
                }
              });

            return () => {
              machine.stop();
            };
          },
        'Confirm transaction machine':
          ({ connection }, event) =>
          (send) => {
            const machine = confirmTransactionServiceFactory(
              connection,
              event.value,
              {
                eager: true,
              }
            )
              .start()
              .onTransition(({ context, done }) => {
                if (done && context.signature !== undefined) {
                  send(
                    transactionProcessorModel.events.transactionConfirmed(
                      context.signature
                    )
                  );
                }
              });

            return () => {
              machine.stop();
            };
          },
      },
    }
  );

export const transactionProcessorServiceFactory = (
  connection: Connection,
  instructions: TransactionInstruction[],
  feePayer: PublicKey,
  signer: Keypair,
  config?: {
    eager: boolean;
  }
) =>
  interpret(
    transactionProcessorMachine.withConfig(
      {
        guards: {
          'auto start enabled': () => config?.eager ?? false,
        },
      },
      {
        connection,
        feePayer,
        instructions,
        signer,
      }
    )
  );
