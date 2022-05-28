import {
  Keypair,
  PublicKey,
  SignaturePubkeyPair,
  Transaction,
} from '@solana/web3.js';
import { sign } from 'tweetnacl';
import { assign, createMachine, interpret } from 'xstate';
import { EventType, EventValue } from './types';

export type StartSigningEvent = EventType<'startSigning'> &
  EventValue<Transaction>;

export type SignTransactionWithWalletEvent =
  EventType<'signTransactionWithWallet'> &
    EventValue<{ publicKey: PublicKey; signature: Buffer }>;

export type SignTransactionWithKeypairEvent =
  EventType<'signTransactionWithKeypair'> & EventValue<Keypair>;

export type SignTransactionMachineEvent =
  | StartSigningEvent
  | SignTransactionWithWalletEvent
  | SignTransactionWithKeypairEvent;

export type SignTransactionMachineServices = {
  'Sign transaction': {
    data: Transaction;
  };
};

export const signTransactionMachineFactory = (
  transaction: Transaction | undefined,
  config?: { eager: boolean }
) => {
  /** @xstate-layout N4IgpgJg5mDOIC5QGUCWUB2ACALgJwEMNYCBjHVAe2wFsyALVDMAOgEkIAbMAYlhwJ4caTEyiJQAB0qxUFahJAAPRAFoALACYAHC23qAzAHZ16gIwBOIwYCsmiwBoQATzVmjANhY2rH7f5sDD00zA00AX3CnEWx8IhJyKloGJlYObh5FaVl5DEUVBFV3MxZNMIMABiMbdW0DCwr1GydXQvsDFnUK21MjbU0bG31I6PRYwmIyXKw6UkZmFhjcCYTcvjGAFRWppIB1OXoAaTBnSQJUPCyZOST8xCHOqoa-EOr1C2aXNSaWdz9zeraDwWWxmEYgJZxSaJagzFILSHbGEYdaYLbxHbUfY4ei7Aicbg4K45W5IZRqerqFgfWraCpmMz6AzqDwtb42X6efShCxAkE2MFRCFjZYY5FwuapRYiqGrJKZMnZG4KMkFSwcmz0yz1MoC3maNmFRkczT0qxGbpVd6hSJCjCUCBwRSIsXTWbzNJcMDE5V5VUUuosIKad50mweJrWT6tVT2CzU7o1UIh-SaAbgl3Qt3w1jorNJLCyTCQH25O4IU0VIMWd5DSzPHSG2MWeMNHp2PzGAZGDMypHZyUIvuu0lSa5l-1G97U3oeMweDw+DyVAxN+cdHyeKwWEPWC0RIWZuWw92pUuj8mFJqaPSGEzmKy2exNrsJ2ygnymne28JAA */
  return createMachine(
    {
      context: { transaction, signatures: [] as SignaturePubkeyPair[] },
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
            signTransactionWithKeypair: {
              actions: 'Sign using keypair',
              cond: 'valid signer',
            },
            signTransactionWithWallet: {
              actions: 'Save signature in context',
              cond: 'valid signer',
            },
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
        // Is it easy to get the signature only using wallet adapter?
        'Save signature in context': assign({
          signatures: (context, event) => [
            ...context.signatures,
            {
              publicKey: event.value.publicKey,
              signature: event.value.signature,
            },
          ],
        }),
        'Sign using keypair': assign({
          signatures: ({ transaction, signatures }, event) => {
            if (transaction === undefined) {
              return signatures;
            }

            return [
              ...signatures,
              {
                publicKey: event.value.publicKey,
                signature: Buffer.from(
                  sign.detached(
                    transaction.compileMessage().serialize(),
                    event.value.secretKey
                  )
                ),
              },
            ];
          },
        }),
      },
      guards: {
        'signatures done': (context) => {
          const transaction = new Transaction(context.transaction);

          context.signatures.forEach(({ publicKey, signature }) => {
            if (signature !== null) {
              transaction.addSignature(publicKey, signature);
            }
          });

          return transaction?.verifySignatures() ?? false;
        },
        'valid signer': ({ transaction }, event) => {
          if (transaction === undefined) {
            return false;
          }

          const message = transaction.compileMessage();
          const accountIndex = message.accountKeys.findIndex((accountKey) =>
            accountKey.equals(event.value.publicKey)
          );

          return message.isAccountSigner(accountIndex);
        },
        'auto start enabled': () => config?.eager ?? false,
      },
    }
  );
};

export const signTransactionServiceFactory = (
  transaction: Transaction | undefined,
  config?: { eager: boolean }
) => {
  return interpret(signTransactionMachineFactory(transaction, config));
};
