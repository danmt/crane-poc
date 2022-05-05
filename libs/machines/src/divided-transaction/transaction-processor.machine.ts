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
      transactionFailed: (value: unknown) => ({ value }),
      transactionConfirmed: (value: TransactionSignature) => ({ value }),
      transactionNotConfirmed: (value: unknown) => ({ value }),
    },
  }
);

export const transactionProcessorMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUBOBDAdrdBjALgJYD2mABAAqrG5yzGpkCyeAFoZmAHQCSEANmADEuVGHT4waLDgIlMiUAAdisQkVKKQAD0QBaAKwAWA1yMB2AMwGAnFYBMANgAczo0YA0IAJ77nARn8uS2cbeydnA1sABmj7AF94r2lsPA1yKho6BmY2Dm4+QSEtFTV0rV0EPUtooP8jSytbR3NHA3sTL18qt0cuW0sba2iGmwMXROSMVLlSSmpaWHpGFlx2Ti4AYTEJDigyFNl0oXxpo-lt8UkIEtV1eQr9Ixcuf2dzA0snNrD7f0cuk9zDZ+uZgSY-v5wQZJiBDml5PMskscqt1twAMqEKCYPZkU4yBGkE5nImYLE4yC3MoPJA6RBfLh-dr+QY2EwGVruQFVN6mAzOWpGKE1KFWRyw+GzDILbIrPIbDFgTAQPEEmbHdXnUhKzD4an3TR0yqDMztczROzRGr2GoAnz6AyBMzOcJjfxjaKCtyS0nSpGLZa5Nb5Li61WYfZaskkwnSgBi6EIghudNKhoUxoZn1eNhsXottmcjR51Sir0tNneNjalhMJl9cfSAblwfRW1IADNCKgALZqv2awcXLs93tUtN3cpZhB-Lh52pjIxuPPmZyl5yOPqWwb2UKuqEwpJw4dzTKB1EK7ibUd9gdN+SxjXyAByxHwN8w3b7E+UU9poAmk486bo4wojK0liDAYpYWpYZh7sWRj2Pm9ixDYiTHpgxAQHAWhSs256tmioaFGABrToBTxblw0SOJaxaOOyLhQp4DpVHmRi0W81p-EKfyWI2z5nrKKLyiGGyXLskYHKemZ-jSRpUVUxhBFB5j+MYLj0V89illu5hcFyVoco4liBEJ2oysiQYkYq2K4jJ0bShRAH0ipjLhG4jFGHEAT2t0egen0Ng8QuaGsmhziWWSLZiW2obhvewnySA6aUe51SGeEXkBKFNSfB0paWC0XCOP4sRxI4tp5h0Rgxf6RHxXZ163v2Tlya5SmZc8ZU5ZyLgfLaHqwZp86IfUJjAqy5gNYRom2VeXAEYiuBtb+aX-t1lTRP0cRWJp9jGI0bzIaWVb2H1cTjBalroXNiJNYtEncCtcxvvgZCft+46pgpGaPAgNqvC0+YWNa102KW7QgsubjIWummNLNx5vdZF7ie2aNkJ2SYpl1qUmlBRlQqEh6RGulilm8zhcJERhjE4UGbuYHQPSJNmXi9BOA4YTFmE0dhfC48PU3Rhm1IKdas-YDj1ZhQA */
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
            transactionFailed: {
              actions: [
                'Transaction failed',
                sendParent((_, event) => ({
                  type: 'Transaction Processor Machine.Transaction failed',
                  value: event.value,
                })),
              ],
              target: 'Transaction failed',
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
            transactionNotConfirmed: {
              actions: 'Transaction not confirmed',
              target: 'Transaction Not Confirmed',
            },
          },
        },
        'Transaction confirmed': {
          type: 'final',
        },
        'Transaction Not Confirmed': {},
        'Transaction failed': {},
      },
    },
    {
      actions: {
        'Transaction created': () => {},
        'Transaction signed': () => {},
        'Transaction sent': () => {},
        'Transaction failed': () => {},
        'Transaction confirmed': () => {},
        'Transaction not confirmed': () => {},
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
              .onTransition(({ context, value }) => {
                if (
                  value === 'Transaction Sent' &&
                  context.signature !== undefined
                ) {
                  send(
                    transactionProcessorModel.events.transactionSent(
                      context.signature
                    )
                  );
                }

                if (value === 'Transaction Failed') {
                  send(
                    transactionProcessorModel.events.transactionFailed(
                      context.error
                    )
                  );
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
