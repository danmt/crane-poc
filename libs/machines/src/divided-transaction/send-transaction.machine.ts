import { Connection, Transaction, TransactionSignature } from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const sendTransactionModel = createModel(
  {
    transaction: undefined as Transaction | undefined,
    signature: undefined as TransactionSignature | undefined,
  },
  {
    events: {
      sendTransaction: (value: Transaction) => ({ value }),
    },
  }
);

export type SendTransactionMachineServices = {
  'Send transaction': {
    data: TransactionSignature;
  };
};

export const sendTransactionMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QGUwDsIAIAqAnAhmrPgMYAuAlgPZqYCypAFhWmAHQCSEANmAMSx0EPIWLlqaRKAAOVWBUo0pIAB6IAtABYAHACY2ugMyHNugKxmAbNoCMhgOyHLAGhABPDbtNsAnLc2WupaWAAyWNmY+hgC+0a6oGDgERKSKtAwkzKxsCRAsUEmiqRJ8EDTsLABuVADW7LmFKeI09Ews9UL5jWJpCFVUJPhpANohALrKsvJpymoI6roh9mw2lj5GmoaR9tqWZvauHvM2J2x6fpr2l3r7OrHxQt3FLRlZHRhdIk1pfGC4uFRcGxpNwhgAzQEAWxyjy+PQkrUy7RhHzQBThzzQfTQ1UGI3GkzkCgksw0Ok0bEC9hsmgC2n2ZnMB3ciCCbDMmh89iW9l02ls9jM2licRAaCoEDgygaGOa6Ta2S4vEJ0xJSFUZJMvhCujsQUMNiZukOGmMyxsthphl0PhsIR8ITM9xAMuS8JeCveeTRTzlKuJSnVcy0Pgpul01IsfKcXh8JuOXjY1r8jJC1vpljuotdRTliLebFlaUwCTI-pmQY0Nh8PjYmjMIXJ9aM2gCNnjqzMK3tEQb2nsfm0PmdOe+CNeyKLCIAYvgKLwIOW1aBg5dDJShZoljbAoEzB29t3bRYQv3B-yR7C3Zj8+0l4GVxozBaDBHe9HAjp41o7StLZtIm0A0oidEUgA */
  sendTransactionModel.createMachine({
    tsTypes: {} as import('./send-transaction.machine.typegen').Typegen0,
    initial: 'Idle',
    schema: {
        services: {} as SendTransactionMachineServices
    },
    states: {
      Idle: {
        on: {
          sendTransaction: {
            actions: 'Save transaction in memory',
            target: 'Sending Transaction',
          },
        },
      },
      'Sending Transaction': {
        invoke: {
          src: 'Send transaction',
          onDone: [
            {
              actions: 'Save signature in memory',
              target: 'Transaction Sent',
            },
          ],
          onError: [
            {
              actions: 'Notify send transaction error',
              target: 'Transaction Failed',
            },
          ],
        },
      },
      'Transaction Sent': {
        type: 'final',
      },
      'Transaction Failed': {
        type: 'final',
      },
    },
    id: 'Send Transaction Machine',
  });

export const sendTransactionServiceFactory = (connection: Connection) =>
  interpret(
    sendTransactionMachine.withConfig({
      actions: {
        'Save transaction in memory': assign({
          transaction: (_, event) => event.value,
        }),
        'Save signature in memory': assign({
          signature: (_, event) => event.data,
        }),
        'Notify send transaction error': (_, event) => console.error(event.data),
      },
      services: {
        'Send transaction': (context) => {
          if (context.transaction === undefined) {
            throw new Error('Transaction is not defined.');
          }

          return connection.sendRawTransaction(
            context.transaction?.serialize()
          );
        },
      },
    })
  ).start();
