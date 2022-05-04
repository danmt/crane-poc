import { Keypair, Transaction } from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const signTransactionModel = createModel(
  {
    transaction: new Transaction(),
  },
  {
    events: {
      signTransaction: (value: Transaction) => ({ value }),
      partialSign: (value: Keypair) => ({ value }),
    },
  }
);

export const signTransactionMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGUCWUB2ACAKgJwEMNYCBjAF1QHtsBZMgC1QzADo1NmotzDizKNAMQAHAnkoEANhwyJQIqrFSC5SEAA9EANm2ttATgDMADiMGA7ACYAjAFZtNo3YA0IAJ6IAtDYAsN1ntdOxCTPwtfSIBfKLdZXD4SCmo6RmY2WS4eRIEUoXkQRWVVAq0ELyNtX1Z-AwAGOzqbMJsDbSs3TwQrPVbKhosjJ0sm3xi49Gx8IiTVLHpSJhZWAEkIKTAhZUxp-mSaAqKVFNLvI1tWSvrfKzqTXxN7zu9WutZ6ut9P27qrKzsjOMQPFdrMUvM0ss1ht8uojiV1GUvNo7IFfrcjNY2r5GiZnuUrBYDO90SZ2nYInUmjFYiAMFQIHACiCcvtUot0uxJlleDNcgc4UpjgLQEjnEZWA5CdYrL5DAZbr58V57qwIo5HpZtOZfkCWXy2RCOctQfzsLJIIchQjRWcAYEhnZfMYbtrHvibBYAjYUX4qXUUS0LHrJgkDXMFks2NCwFbiidEWcbG8DI1zncrCNU8qrGSaqTPbZ7n8Q5gw3sI5DY4L4yLNGdHjVXo1mjZWu1lc5iV8-vcjL5HUNtDSokA */
  signTransactionModel.createMachine(
    {
      tsTypes: {} as import('./sign-transaction.machine.typegen').Typegen0,
      initial: 'Idle',
      states: {
        'Signing transaction': {
          always: {
            cond: 'signatures verified',
            target: 'Transaction Signed',
          },
          on: {
            partialSign: [
              {
                actions: 'Add signature to transaction',
                cond: 'valid signer',
              },
              {
                actions: 'Notify invalid signer error',
              },
            ],
          },
        },
        'Transaction Signed': {
          type: 'final',
        },
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Signing transaction',
          },
          on: {
            signTransaction: {
              target: 'Signing transaction',
            },
          },
        },
      },
      id: 'Sign Transaction Machine',
    },
    {
      actions: {
        'Add signature to transaction': assign({
          transaction: (context, event) => {
            context.transaction?.partialSign(event.value);

            return context.transaction;
          },
        }),
        'Notify invalid signer error': () => console.error('Invalid Signer'),
      },
      guards: {
        'signatures verified': (context) =>
          context.transaction?.verifySignatures() ?? false,
        'valid signer': (context, event) => {
          if (context.transaction === undefined) {
            return false;
          }

          const message = context.transaction.compileMessage();
          const accountIndex = message.accountKeys.findIndex((accountKey) =>
            accountKey.equals(event.value.publicKey)
          );

          return message.isAccountSigner(accountIndex);
        },
        'auto start enabled': () => false,
      },
    }
  );

export const signTransactionServiceFactory = (transaction: Transaction) =>
  interpret(signTransactionMachine.withConfig({}, { transaction })).start();
