import { Keypair, Transaction } from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const signTransactionModel = createModel(
  {
    transaction: undefined as Transaction | undefined,
  },
  {
    events: {
      signTransaction: (value: Transaction) => ({ value }),
      partialSign: (value: Keypair) => ({ value }),
    },
  }
);

export const signTransactionMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGUCWUB2ACAKgJwEMNYCBjAF1QHtsBZMgC1QzADo1NmotzDizKNAMSJQAByqxUgjKJAAPRAFoAzADYALKw0BGAJwAGAKwGdADh361AJgA0IAJ6Jra1vvXGA7Cp0q9n0w0AXyD7Dmx8IhIKajpGZjZwrh4+aJkhMQI8SgIAG3C5CSkZOUUEHVcDNQMzT2sNDSNLHSq1eycEJR1rI1ZPMyN-T09zAxUzM2DQkHDcVIFYrHpSJhZWAEkIXLAhKUxI-hiaQslpWNLlFSMzVmsLIyM1NSM-HztHZXMVW50TZ5cBgZPEYQtMMFQIHA5LMDmlFstVol0BhkrwogtjkgQEUzpjQGVVC9WI87mMgU8DHodO1lNU+gN-EYNMY1GY1OoQmFkXN0Uc4isEqxYRjsOFICdiucsQSrt9fL8NHoVBoXOMzDTyiM3M8dMyDFVrpZPJyZtzhXylvE1ptthLcbJpZcWqw9CYVNYatZ-JSjBqlHdXMzrHcdHVzCrrCaYfMLQiEnaSo7OmrtPpjKYLFZ3h1CXptAZg8CGkX2aCgkA */
  signTransactionModel.createMachine({
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
        on: {
          signTransaction: {
            actions: 'Save transaction in memory',
            target: 'Signing transaction',
          },
        },
      },
    },
    id: 'Sign Transaction Machine',
  });

export const signTransactionServiceFactory = () =>
  interpret(
    signTransactionMachine.withConfig({
      actions: {
        'Save transaction in memory': assign({
          transaction: (_, event) => event.value,
        }),
        'Add signature to transaction': assign({
          transaction: (context, event) => {
            context.transaction?.partialSign(event.value);

            return context.transaction;
          },
        }),
        'Notify invalid signer error': () => console.error('Invalid Signer'),
      },
      guards: {
        'signatures verified': (context, _) =>
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
      },
    })
  ).start();
