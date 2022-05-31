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

export const signTransactionMachineFactory = (config?: {
  fireAndForget: boolean;
}) => {
  /** @xstate-layout N4IgpgJg5mDOIC5QGUCWUB2ACALgJwEMNYCBjHVAe2wFsyALVDMAOgBVDiyLqtZ1mEAMSJQAB0r8eGUSAAeiAMyKArCwAcABgCMANkXqATCoCcqgCzmANCACeiALSHz6ltsO6T2gOwvDizxUAXyCbNExcThJyKloGJlZw7HwiaOkhfkwOVO5YgHVUHHoAaTBbMQJUPFkJKVjZBQQHTxZFc0UdDzMXXV11G3sETRZNExNvbxN1RW1tc29-TXV1ELCBSJyY3jpSRmYWJI2uLYwMgWzj6QKivIIAGzuwHBrJQvqkeUcVQ0MWb00VJMTPoAt5dIYBohhqNxpNprN5otlqsQIcUpdYlgdntEut0WlYiIPrU3tQGohdN4-ipNIZfOYlnT1NoTJCmtpFCYWCZjKoVFpRktzCi0VFctt4swMjgCHgcEkmFAXnUyR9Gk4vG4VCz-OZ+YZNL02U5DK4GTTNLSzP4FsKURhKBA4LJRZtpFjJawAJIQR7K0kyNWOcw8lgeFTg0yc8zgxTG4zmFjgzzOTQGFQzaYivFik4e3YJdi592ZQT+6TkhALJOWNPqPoGQyzfp2RwJpNdVPpzOKbMRfHiuIF-aujGq8SvCtBpp0qmBPrN9yaebG5utJuaMGeFzA0195LFzHYwsAEWoYHL71AjUbIwN6YN2nUZl0xrBbjaJhU828GZphn3I4CQlYcL2JScr0+Jpv10P4ASBEFKXBY1lC5ZMzH1FwATaEIQiAA */
  return createMachine(
    {
      context: {
        transaction: undefined as Transaction | undefined,
        signatures: [] as SignaturePubkeyPair[],
      },
      tsTypes: {} as import('./sign-transaction.machine.typegen').Typegen0,
      schema: {
        events: {} as SignTransactionMachineEvent,
        services: {} as SignTransactionMachineServices,
      },
      on: {
        startSigning: {
          actions: 'Save transaction in context',
          target: '.Sign transaction',
          internal: false,
        },
      },
      initial: 'Idle',
      states: {
        Idle: {},
        'Transaction signed': {
          always: {
            cond: 'is fire and forget',
            target: 'Done',
          },
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
        Done: {
          type: 'final',
        },
      },
      id: 'Sign transaction machine',
    },
    {
      actions: {
        'Save transaction in context': assign({
          transaction: (_, event) => event.value,
          signatures: (_) => [],
        }),
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
        'is fire and forget': () => config?.fireAndForget ?? false,
      },
    }
  );
};

export const signTransactionServiceFactory = (config?: {
  fireAndForget: boolean;
}) => {
  return interpret(signTransactionMachineFactory(config));
};
