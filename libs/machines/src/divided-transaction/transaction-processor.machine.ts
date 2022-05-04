import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js';
import { interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { confirmTransactionServiceFactory } from './confirm-transaction.machine';
import { createTransactionServiceFactory } from './create-transaction.machine';
import { sendTransactionServiceFactory } from './send-transaction.machine';
import {
  signTransactionModel,
  signTransactionServiceFactory,
} from './sign-transaction.machine';

export const transactionProcessorModel = createModel(
  {},
  {
    events: {
      createTransaction: () => ({}),
      transactionCreated: (value: Transaction) => ({ value }),
      transactionSigned: (value: Transaction) => ({ value }),
      transactionSent: (value: TransactionSignature) => ({ value }),
      transactionConfirmed: (value: TransactionSignature) => ({ value }),
    },
  }
);

export const transactionProcessorMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUBOBDAdrdBjALgJYD2mABAAqrG5yzGpkCyeAFoZmAHQCSEANmADEuVGHT4waLDgIlMiUAAdisQkVKKQAD0QBaAGwAGA1wCcAVgMAWAExnrZgBxOzBiwBoQAT322jAOxc1gCMRpYhYU4B1lYWAL7xXtLYeBrkVDR0DMxsHNx8gkJaKmrpWroIeqEAzFy2Fg6OIS4BAQ5evlW2TkZcNQbOIRb2sdZONQlJICmy6ZTUtLD0jCy47JxcAMJiEhxQZLNp8kL4GKlypDvikhAlquryFfoG-lxGTgYDFhYhNdZGawGTqICxOfpuAIhZyfAETJyJZLnObyBZZZY5NYbbgAZUIUEw+zIZxkx1Ip2RZMweIJkHuZSeSB0LxqfSMkVZZlsdlsAVcIIQdjMXACRnZthqNVs9gcIQMiJmlMuGUW2VWeU2OLAmAgRJJF3SFNJyq1mHw9MemiZlWs1i40Ta4oaBhCUOBPkQ3NM7l+gT57QsUKmSON80ySxWuXW+W2pAAZoRUABbPVKw36lFXeOJpN0pmlS0Ka2eoKhEb2GwWGqWNwCvQhaxBHoxf7OR3+eUKzDECBwLRHZVoiOYjUFARgC3lYtVRp9CaOGrRVu2P51+zg2wGAJgszV1kDBUDsOqjHq6Oba57TAHI+M5QPKegSqGVxcF27mpBrnDAJ1yJBME7CMX4HAlPkEWmW9SCHNUo2xLgaUJa9iTTO8QALR9mSqAwnBCN9nXCaUnBXKwBRXPoAR+V5eglHoJkPVDoPDWCsRjU1dWQjMqUnNDnxqPD2gCfjN3XKwJhqAVQibMUwn8aFrClWwGNDVFmNPOCYy2bNk1TFSrXvBl9Kw6o8OhAIK03aIVylMjhXCYiYiMfjLHA4NFT0lV0UjVjNig8hcG03M7nzB9eNBcxeXMgZdzlWVbDXT57UGYj3FiQFuRqZSDVUk9vNHHijOfKE6nfSUvxI38PSqT88M3bdZS3FpASmRIgA */
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
              actions: 'Transaction created',
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
    }
  );

export const transactionProcessorServiceFactory = (
  connection: Connection,
  instructions: TransactionInstruction[],
  feePayer: PublicKey,
  signer: Keypair
) =>
  interpret(
    transactionProcessorMachine.withConfig({
      services: {
        'Create transaction machine': () => (send) => {
          const machine = createTransactionServiceFactory(
            connection,
            feePayer,
            instructions,
            { eager: true, autoBuild: true }
          )
            .start()
            .onTransition(({ context, done }) => {
              if (done && context.transaction !== undefined) {
                send(
                  transactionProcessorModel.events.transactionCreated(
                    context.transaction
                  )
                );
              }
            });

          return () => {
            machine.stop();
          };
        },
        'Sign transaction machine': (_, event) => (send) => {
          const machine = signTransactionServiceFactory(event.value, {
            eager: true,
          })
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
        'Send transaction machine': (_, event) => (send) => {
          const machine = sendTransactionServiceFactory(
            connection,
            event.value,
            { eager: true }
          )
            .start()
            .onTransition(({ context, done }) => {
              if (done && context.signature !== undefined) {
                send(
                  transactionProcessorModel.events.transactionSent(
                    context.signature
                  )
                );
              }
            });

          return () => {
            machine.stop();
          };
        },
        'Confirm transaction machine': (_, event) => (send) => {
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
    })
  );
