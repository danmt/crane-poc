import { Keypair, PublicKey, SignaturePubkeyPair, Transaction, TransactionInstruction, TransactionSignature } from '@solana/web3.js';
import { createMachine } from 'xstate';

export type Event<Type> = { type: Type };

export type FinishCreatingEvent = Event<'Finish Creating'>;
export type WatchBlockhashEvent = Event<'Watch blockhash'> & {
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number };
};
export type SetFeePayerEvent = Event<'Set fee payer'> & {
  feePayer: PublicKey;
};
export type AddInstructionEvent = Event<'Add instruction'> & {
  instruction: TransactionInstruction;
};
export type SignTransactionEvent = Event<'Sign transaction'> & { keypair: Keypair };
export type RetryConfirmationEvent = Event<'Retry confirmation'>;

export type ComposedTransactionMachineEvent =
  | FinishCreatingEvent
  | WatchBlockhashEvent
  | SetFeePayerEvent
  | AddInstructionEvent
  | SignTransactionEvent
  | RetryConfirmationEvent;

export type TransactionStatus = 'creating' | 'signing' | 'sending' | 'confirmed' | 'failed';

export type ComposedTransactionMachineServices = {
  'Confirm Transaction': { data: TransactionSignature };
  'Fetch latest blockhash': {
    data: { blockhash: string; lastValidBlockHeight: number };
  };
  'Get Block Height': { data: number };
  'Send Transaction': { data: TransactionSignature };
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type ComposedTransactionMachineContext = {
  'Transaction Processor Machine': {
    id: string;
    createdAt: number;
    status: TransactionStatus;
    transaction?: Transaction;
    signature?: TransactionSignature; 
    'Create Transaction Machine': {
      feePayer: PublicKey;
      instructions: TransactionInstruction[];
      latestBlockhash?: {
        blockhash: string;
        lastValidBlockHeight: number;
      };
    };
    'Sign Transaction Machine': {
      signatures: SignaturePubkeyPair[]
    };
    'Send Transaction Machine': {
      maxAttempts: number;
      attempt: number;
    }
  };
  'Blockhash Checker Machine': {
    latestBlockhash?: {
      blockhash: string;
      lastValidBlockHeight: number;
    };
  };
};

export const composedTransactionMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUBOBDAdrdBjALgJYD2mABALJ4AWhmYAdAEIA2xuA1terNWQMLUwnMKko06jAOJh8RTFDKt2HMgAkwhKNXwBiCKUZ0AbsQ6M0WHARLkquWvWZtO3XgKEix9x9NnzFZU51TW18BBN2dCJSAG0ABgBdRFAAB2JYQhjMFJAAD0QAVgAWBgB2eIAOSoAmAEZa+OKANgBmGuKAGhAAT0QAWkLmyuaGYtbimprKusKOuoBOAF8l7stsPGzxB0lnFTc+QWFzbwknAGUWMDBUuihdPNh8aMZ0ADN8UQAKVvi-+IAlLp1tYtj5dkEuDxDp4TttfAxLtdbgpculMtlcgUEBM6gx4nNCnVimVKgs6vFmt0+ghBsU-vi6mUFi1xhT4jUVmsMBsbKR4RCXFD3EcvAKnJCDmQAKJ5W6oSC6NEZLK2LEDCl1VoMQq1Yq1X41VrtGrUgaFXXxBg1ZplI0LMkkslckAgza2cUWHmgj0ABVQ7DgsGIpx2Tn4CpeZDdfLsZ0YADFZGHFCwXk8yAAjIUHfSGBiRcwMGNg+PF73u-n+wOwYOhhERsBRkse8FOJP4FNkNOfDPZ-bQiKYUy4aK2BLJJAgdGq0jq2mkmrlBY1O2-BbxCYLM204qFVqFfE1Eq6yqn6Yulv8tteqyV8jV3BBkOehiN5sV2OvjtdntwfBZjm0K6KIAaoAwqQ9m8IYALblneX43vBvJbI+z71rs76fNGn6lmGibJo4qbpgB-auIOkSjtkE7KhiapTti-QUuSDAzGSzREtUVTxGUO79C0ZR4i0RrVAsHHzJeuGtmWV4PgGT61i+SFYWAOEIXhDaRgEakobYujnLIZBvNcZCpOgPSiLRs45AxAzTAsrGtGUxQNKSwzTM0VK9AMLRzAwrTNAshSbmUZRzC5knqdJ+HIT6Vbyehr4qTpcVxjFWF3Cl966AAghAEBkHQTyoAArrGVmYrZC4cgwdRar8zR7meq6mt5u6BVaYlGmFx4VK0dSRbp14yVJ8U1nWSVaapsmTU22myboCZ0IQIpaXcFX0aAjFbgwzSLKuQzjCuJJ8cUkxWqSrQLBUhRlM09SFINqWvjNaGKRh4ZTVliFlhlCjfdkugAOrRA4gEDrwG1zlVgxagwLIrjUDrEk59R8fu+rWoUG6hSakyPasrqjWlCKvQl72zR+UXDfheZOE8LyxfeL3E2Qb0TcpX0zTeUM2VtiBakJCxXQsQWNfq8TC6dbQOftxLccyDpPczSFk+NSllucWjkNzmva5l+DE-p2tkIb1N89OKqVfzCAcaMHQbk5ZIlH1p3OZUtV7fExLY60zqE7rMVqwpHN61AOus0hWvhwbRu8-O1SjGSRpTGdd3FA6p0jB7JKUseFpzHtys-UHrPsxrMXRxH5uenTjAM58TMl6TZfk6Hlcm4Hvjx1VdRI-iMwZ5U3uVH7kteTS-EBXi9klFdm598UxcabsweJVHYCYAVXe7AZW+ZQtBhOIWt5DSTq+t+rH2MHv2+R5rm8QAfxNDiOY5xEkPc2-0LW1aFZ5DAes1Qop06jNE6hubOGcgoWmXtFFuNdy7X0RI-AG8Dd6P2fubECqAwIQSgrBJuK8nBrwphvLeaCaYIlvlgs+r8ojUU-lOGc1t8gaiaGUHU2NJjMkqBnCoXQ2r9D9iyWqDpAplGnvuA8cCqEX0QW3Cu1DUE73DKQN4hBUAwVoalOuBZhxmFPs9VWl8Q5KIwRQ1RjB+DqM0do-6sl6FUXHEwtIVtNpsIQHdco1Qzy2iqEFP4IChFXUqJwxqq4gpam9gSWR58SGmPXg-Sx990q2K0To7KoEQz4OiNBLRRD0EJIUVfV8t9KHxOsek+xihHGUXfpgGizD3HQ2-kMTqpJkYkjaBaSop0mgOU3AFMStRhZNDiSzEpZjkHlKsYiK4Nw7gPAbq8D43xfj-CBHM0h7dlEpJrlHBZKIoBf08f0WoHsCRVFXASUewteIhJGbVHhETzoyIDqkhBZ82aKOvnolZhS5HFO+Ugz0pzsTjF2oJFO9I2J6gnuaYkoxnJ7g3NMM6IwViE0wMQCAcBchzMlNCDwxxRCvhkHITKkIQhaB0OCoooj07-HGGSUegjJ77nAeUbGPE2hMh4mUCZSEiUilhGSw5yJ1rNLoq0zx2MxikiZHtDORoDzBI5fSUYRJmQ3JGbMIVZYRUwlJcgo1Mo5SaMgPS2kUwlyoo5KPCYzlbro11Mi20B5Fh7RmK0A1MUzWijhFHfAxBUipCtdK6y85FicOun7fcSr6Q2gRbScK4SOJSN+LCv1CIA1iuQQASQgFca1TFiQ6m9qFJGMbZjTHRndJcNRJbDyCo7TkHyDmGqAqKk1YLI2sMYh0UY9rpjGhJHuB5HLR6HibddRo7RKRLw7d8kxUyknpS5p83YP4iLdhIuDcikN+0eMYnVAkf9RYuWFvUckp0XY6mPPqfcJ4OQ5vkSC35lNsJzL+rU4mpaM4zuJGErUHQAoTDvVMI8J4mTjCqIK5dxiRprrIb9TdnbS41xUhAUtTJG0DPjVxKotQ71ww5C7P2B4zoE25Bhr5z1QWczmtNLd9BcN91lorK97RFh1Ddm0eG90nKkkupMN9wKGOfqjp3VjN99b-TNmfa10DWKzvAfUEYto+lCP1GdMYZ5QoUltCUZYiGVbIY-aU6T4cKllPk4oAAIoYa1iNygBQJCuEYt0+FuyZPp7Gds+4NEqOJoxzNGNh2riu+MymwqqfHhyBonlSSnRZEJG611RYVHGWZ5u77JNWeSXfOjFin4OP-ce2Vp6CTIqVcPN1vD1U+SRf5O0oVvYtAaANXLxCwtfgi5XFRsm3zVMyeVSrFtB3XWtIJXU+1xjYzPP0vcrEmTGkJBxUeoXAVyUK4N-Z0XK5HKlW4mVk2Bjp2tCycBJIKSjyNP0i0OpjS2nci1Zo22dnmIuENkrbGJvziYtxcodXbm2gdE13cqr4aQMEn3KonlPuJNQ5h75NjMAaK0RG07Uaqr6kua29TFo7qSL4ldZyu0eG+P6pIu6SOUO7Py8zBM6BCBXBwwDmGFIDz+RGN0n2FpWqTwCvSfygT6TtDCgt+nlnpl9pxwOjUsxtRMkvYsHjt6hHBXLbnW6TQ-bu1C+x0KF60vXt4+jSB1pJZS5JGPBDKwgA */
  createMachine({
  tsTypes: {} as import('./composed-transaction.machine.typegen').Typegen0,
  schema: {
    context: {} as ComposedTransactionMachineContext,
    events: {} as ComposedTransactionMachineEvent,
    services: {} as ComposedTransactionMachineServices,
  },
  type: 'parallel',
  states: {
    'Blockhash Checker Machine': {
      initial: 'Idle',
      states: {
        'Getting Block Height': {
          invoke: {
            src: 'Get Block Height',
            onDone: [
              {
                cond: 'is blockhash valid',
                target: 'Sleeping',
              },
              {
                target: 'Blockhash Expired',
              },
            ],
          },
        },
        Sleeping: {
          after: {
            '30000': {
              target: 'Getting Block Height',
            },
          },
        },
        'Blockhash Expired': {
          type: 'final',
          always: {
            actions: 'Mark transaction as creating',
            cond: 'should recreate transaction',
            target:
              '#Transaction Machine.Transaction Processor Machine.Create Transaction Machine',
          },
        },
        Stopped: {
          type: 'final',
        },
        Idle: {},
      },
    },
    'Transaction Processor Machine': {
      initial: 'Create Transaction Machine',
      states: {
        'Create Transaction Machine': {
          initial: 'Fetching latest blockhash',
          states: {
            'Fetching latest blockhash': {
              invoke: {
                src: 'Fetch latest blockhash',
                onDone: [
                  {
                    actions: 'Save blockhash details',
                    target: 'Creating Transaction',
                  },
                ],
                onError: [{}],
              },
            },
            'Creating Transaction': {
              on: {
                'Set fee payer': {
                  actions: 'Save fee payer',
                  target: 'Creating Transaction',
                  internal: false,
                },
                'Add instruction': {
                  actions: 'Add instruction to list',
                },
                'Finish Creating': {
                  actions: 'Generate and save transaction',
                  target: 'Transaction Created',
                },
                'Watch blockhash': {
                  actions: 'Save blockhash details in checker',
                  target:
                    '#Transaction Machine.Blockhash Checker Machine.Getting Block Height',
                },
              },
            },
            'Transaction Created': {
              type: 'final',
            },
          },
          onDone: {
            actions: 'Mark transaction as signing',
            target: 'Sign Transaction Machine',
          },
        },
        'Sign Transaction Machine': {
          initial: 'Signing transaction',
          states: {
            'Signing transaction': {
              always: {
                cond: 'signatures are done',
                target: 'Signing Done',
              },
              on: {
                'Sign transaction': [
                  {
                    actions: 'Add signature to list',
                    cond: 'valid signer',
                  },
                  {
                    actions: 'Notify invalid signer error',
                  },
                ],
              },
            },
            'Signing Done': {
              type: 'final',
            },
          },
          onDone: {
            actions: 'Mark transaction as sending',
            target: 'Send Transaction Machine',
          },
        },
        'Send Transaction Machine': {
          initial: 'Sending Transaction',
          states: {
            'Sending Transaction': {
              invoke: {
                src: 'Send transaction',
                onDone: [
                  {
                    actions: 'Save transaction signature',
                    target: 'Confirming Transaction',
                  },
                ],
                onError: [
                  {
                    actions: 'Notify send transaction error',
                    target:
                      '#Transaction Machine.Transaction Processor Machine.Transaction Failed',
                  },
                ],
              },
            },
            'Confirming Transaction': {
              invoke: {
                src: 'Confirm transaction',
                onDone: [
                  {
                    actions: 'Mark transaction as confirmed',
                    target:
                      '#Transaction Machine.Transaction Processor Machine.Transaction Confirmed',
                  },
                ],
                onError: [
                  {
                    actions: 'Notify confirm transaction error',
                    target: 'Sleeping',
                  },
                ],
              },
            },
            Sleeping: {
              after: {
                '30000': [
                  {
                    actions: 'Increase number of attempts',
                    cond: 'can try to confirm again',
                    target: 'Confirming Transaction',
                  },
                  {
                    target:
                      '#Transaction Machine.Transaction Processor Machine.Transaction Failed',
                  },
                ],
              },
            },
          },
        },
        'Transaction Confirmed': {
          type: 'final',
        },
        'Transaction Failed': {
          entry: 'Mark transaction as failed',
          type: 'final',
        },
      },
      onDone: {
        cond: 'is transaction done',
        target: '#Transaction Machine.Blockhash Checker Machine.Stopped',
      },
    },
  },
  id: 'Transaction Machine',
});
