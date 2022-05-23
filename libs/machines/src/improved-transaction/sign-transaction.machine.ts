import { PublicKey, Transaction } from '@solana/web3.js';
import { assign, createMachine, interpret } from 'xstate';
import { EventType, EventValue } from './types';

export type StartSigningEvent = EventType<'startSigning'> &
  EventValue<Transaction>;

export type SignTransactionEvent = EventType<'signTransaction'> &
  EventValue<PublicKey>;

export type SignTransactionMachineEvent =
  | StartSigningEvent
  | SignTransactionEvent;

export type SignTransactionMachineServices = {
  'Sign transaction': {
    data: Transaction;
  };
};

export const signTransactionMachineFactory = (
  transaction: Transaction | undefined,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  config?: { eager: boolean }
) => {
  /** @xstate-layout N4IgpgJg5mDOIC5QGUCWUB2ACALgJwEMNYCBjHVAe2wFsyALVDMAOgEkIAbMAYlhwJ4caTEyiJQAB0qxUFahJAAPRAFoALAHYAbCwCMATgDMABgMBWABxmATOoA0IAJ5rDBlgYOXtBmydNG6tqaNgC+oY4i2PhEJORUtAxMrBzcPIrSsvIYiioIqjZ6lixWetrmBmUmNpqa5uaOLvlGZSzW6uZaFr6WRpbhkejRhMRk2Vh0pIzMLFG4I3HZfEMAKgtjCRkycptIymqFukaa6paWejp1BqeNB7qapsaW5iFl5np6AyBzMaPx1BMkjMfut-hh0ntMjsFHs8hdNCx1F4jAZtGZzt4Ord8jZem1qicbNpAtZNNcviDYhsAZNpqwomJ5lSwTwINRWEwAG6UADW9KGTL+41pyVmQ0Zv0WCQQXMopAI2QA2iYALpbLK7UB5VQIwzqPQkow2czEozY1R6cyIyzdELaY0mdRGIzaCkCyXUxJTUUMjBQQVS6g8MB4PCUPAsSScBUAM3DNDFmADnsB3uB4r9ybBMow3PlStV6uhOVhaiCVsqJnMgXqNjr6gczkQ6hYJj0-htBpMljrBs04QiIAwlAgcEUlKFCVTdPYXDAReyuTLphYmg+liR2m0vQbjaaqiNRhYpg6DfMbZNOnMbqTHrB09Fa2Z41kmEgC81+wQRRsx98BpdbdrjXTRzQ+BFjg3cp-DsapXUHCdAy9GdEM9D8YS1VwDARGxrg+I1ameNswO8DwvE0Nt2z0II7DCBD3VBYUgX5URMzvRdIW2DjMPyQw9DI-UrjqLQ21AptvxOVtz1RXCrxrOjBlvRipxFZh0JLHjVHPEx9GMMwrFsPc1BRI5HXqajAjsToB1CIA */
  return createMachine(
    {
      context: { transaction },
      tsTypes: {} as import('./sign-transaction.machine.typegen').Typegen0,
      schema: {
        events: {} as SignTransactionMachineEvent,
        services: {} as SignTransactionMachineServices,
      },
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Sign transaction',
          },
          on: {
            startSigning: {
              actions: 'Save transaction in context',
              target: 'Sign transaction',
            },
          },
        },
        'Transaction signed': {
          type: 'final',
        },
        'Sign transaction': {
          always: {
            cond: 'signatures done',
            target: 'Transaction signed',
          },
          on: {
            signTransaction: {
              cond: 'valid signer',
              target: 'Signing transaction',
            },
          },
        },
        'Signing transaction': {
          invoke: {
            src: 'Sign transaction',
            onDone: [
              {
                target: 'Sign transaction',
              },
            ],
            onError: [
              {
                actions: 'Notify sign transaction error',
                target: 'Sign transaction',
              },
            ],
          },
        },
      },
      id: 'Sign transaction machine',
    },
    {
      actions: {
        'Save transaction in context': assign({
          transaction: (_, event) => event.value,
        }),
        'Notify sign transaction error': (_, event) =>
          console.error(event.data),
      },
      services: {
        'Sign transaction': ({ transaction }) => {
          if (transaction === undefined) {
            throw new Error('Transaction is missing');
          }

          return signTransaction(transaction);
        },
      },
      guards: {
        'signatures done': ({ transaction }) => {
          console.log(transaction, transaction?.verifySignatures());
          return transaction?.verifySignatures() ?? false;
        },
        'valid signer': ({ transaction }, event) => {
          if (transaction === undefined) {
            return false;
          }

          const message = transaction.compileMessage();
          const accountIndex = message.accountKeys.findIndex((accountKey) =>
            accountKey.equals(event.value)
          );

          console.log({ message });

          return message.isAccountSigner(accountIndex);
        },
        'auto start enabled': () => config?.eager ?? false,
      },
    }
  );
};

export const signTransactionServiceFactory = (
  transaction: Transaction | undefined,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  config?: { eager: boolean }
) => {
  return interpret(
    signTransactionMachineFactory(transaction, signTransaction, config)
  );
};
