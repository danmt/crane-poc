import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { ActorRefFrom, assign, createMachine, interpret, spawn } from 'xstate';
import { rpcRequestMachineFactory } from './rpc-request.machine';
import { EventData, EventType, EventValue } from './types';

type CreateTransactionEvent = EventType<'createTransaction'> &
  EventValue<{
    feePayer: PublicKey;
    instructions: TransactionInstruction[];
  }>;
type BuildTransactionEvent = EventType<'buildTransaction'>;
type RpcRequestSuccess = EventType<'Rpc Request Machine.Request succeeded'> &
  EventData<{
    blockhash: string;
    lastValidBlockHeight: number;
  }>;
type RestartMachineEvent = EventType<'restartMachine'>;
type SetFeePayerEvent = EventType<'setFeePayer'> & EventValue<PublicKey>;
type AddInstructionEvent = EventType<'addInstruction'> &
  EventValue<TransactionInstruction>;
type RemoveInstructionEvent = EventType<'removeInstruction'> &
  EventValue<number>;
type OrganizeInstructionsEvent = EventType<'organizeInstructions'> &
  EventValue<TransactionInstruction[]>;

export type CreateTransactionMachineEvent =
  | CreateTransactionEvent
  | BuildTransactionEvent
  | RpcRequestSuccess
  | RestartMachineEvent
  | SetFeePayerEvent
  | AddInstructionEvent
  | RemoveInstructionEvent
  | OrganizeInstructionsEvent;

export const createTransactionMachineFactory = (
  connection: Connection,
  config?: {
    eager: boolean;
    autoBuild: boolean;
    fireAndForget: boolean;
  }
) => {
  const getLatestBlockhashMachine = (connection: Connection) =>
    rpcRequestMachineFactory(() => connection.getLatestBlockhash(), {
      eager: true,
      fireAndForget: true,
    });

  /** @xstate-layout N4IgpgJg5mDOIC5QGEBOYCGAXMACAKqhgHawYDGWAlgPbG4CyFAFlcWAHQCSEANmAGJy6bGEIkylWsUSgADjVhVqdWSAAeiALQAWAMwBGDgHZjOnQE4AHACYLegGwGHDgDQgAntqvGbHC842xlaWDpZ6FgC+ke5omDgERKQUKvRM5Kzs3HyCagpKqWqaCFoArA5WHAAMhjpmpjqlOlUW7l4lLsYcQTq2DsaljtY60bEiCeLJUnSMLGycAGJgWBlsULi8orBYuABGvDTkANbMGLDMAgBKcuS4l2AAjgCucDvpmZz3z6+4sE-k5DAkEgeUUymkRUQBj0fgMzSs5QMg2MgWMbW0Ngcfj0VicVVMKPsDj0oxAcVEiQkKWks1WWXJ1GI6ywSUkqQEuyeVF4EEmbIhSBA+XBqkFxV0VkqzSqVT6Fiq0Kc6JKjUq0LspRsTWMeJGMTJ4zwfOpM3e8w4DLWuBZVOmxAEsGWSzAAAUMB4wKhQQUBaBigYgiZSlVehYKgS9HpSsqtMZI90kYYzGGLDrjKSGUbWSa0nN6eMrTapuyMBAIFxSCz-oVBcKa36oTYdP4LDotb4XM4HK1PNpiaUOI4wvYUU4hxnDZTizSzfn4oXs3aBOgALY0ABuYAr21Q1d9QrB9Y0UJhHGcpS7uOaBgsqZjTSMcYMthshgMpk1E-iWdtqVpHwtAsmWtRd2RoVAoBIKgAC8t0rXc7XgWtD33cVjAsDhymCONI0MWoYx8PwAixYJQnCKJ9UzKd+VNPNOEtYCixo+1vRFGQxW0AMjGIqobC1HwDBvOoYx0FxuhlQZSlsTUIgRL8KWNO1-3NRS-2Eb8IGXV4MFQLBZzAVij2KcwiNTCxXyjKxHBsaEY2sBwTBqGo9GaRpgwceSJlAmc6I4VSaXU0RNMM1DEAfDgHFlKwLEGBUdHfNxexKFyuhsKoHG1fE+JqCj9WIGgIDgNQqP82i6U4Hh+BC0UGxKC9mxRaKUVEmobJ7dotFTPRHL0GouwGaKKLGb9qJzZSsiWFZMnWTYcG2PYDmOU5zmq9jaq0GEugMFpMUabazE1GMeg4SUnGcaFTDhRpPJ-acyoAhjmW8mqDx9F7xX48S7HM7aAmsewYyxbEXGDTE9AGJEPMoydStzcq-Oe+hApwCBVshBBHCMfqoplNsYujJKtH6PxXzqQSsVla7oZG2Hxs4AAROgDOQt61uPBA9o4OofofBEnGEwm4W6m9BlJgZLKjG7RqU-S0Y4urzOqWp6gO5p2s4qpSgw4wnJ1Hx9FKT9okiIA */
  return createMachine(
    {
      context: {
        connection,
        latestBlockhash: undefined as
          | {
              blockhash: string;
              lastValidBlockHeight: number;
            }
          | undefined,
        feePayer: undefined as PublicKey | undefined,
        instructions: undefined as TransactionInstruction[] | undefined,
        transaction: undefined as Transaction | undefined,
        getLatestBlockhashRef: undefined as
          | ActorRefFrom<ReturnType<typeof getLatestBlockhashMachine>>
          | undefined,
      },
      tsTypes: {} as import('./create-transaction.machine.typegen').Typegen0,
      schema: { events: {} as CreateTransactionMachineEvent },
      id: 'Create Transaction Machine',
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Creating transaction',
          },
          on: {
            createTransaction: {
              actions: 'Save fee payer and instruction in context',
              target: 'Creating transaction',
            },
          },
        },
        'Fetching latest blockhash': {
          entry: 'Start get latest blockhash machine',
          on: {
            'Rpc Request Machine.Request succeeded': {
              actions: 'Save latest blockhash in context',
              target: 'Transaction created',
            },
          },
        },
        'Creating transaction': {
          always: {
            cond: 'auto build enabled',
            target: 'Fetching latest blockhash',
          },
          on: {
            buildTransaction: {
              target: 'Fetching latest blockhash',
            },
            setFeePayer: {
              actions: 'Save fee payer in context',
            },
            addInstruction: {
              actions: 'Add instruction to context',
            },
            removeInstruction: {
              actions: 'Remove instruction from context',
            },
            organizeInstructions: {
              actions: 'Save instruction in new order in context',
            },
          },
        },
        'Transaction created': {
          entry: 'Save transaction in context',
          always: {
            cond: 'is fire and forget',
            target: 'Done',
          },
          on: {
            restartMachine: {
              actions: 'Clear context',
              target: 'Idle',
            },
          },
        },
        Done: {
          type: 'final',
        },
      },
    },
    {
      actions: {
        'Add instruction to context': assign({
          instructions: ({ instructions }, event) => [
            ...(instructions ?? []),
            event.value,
          ],
        }),
        'Clear context': assign({
          transaction: (_) => undefined,
          latestBlockhash: (_) => undefined,
          feePayer: (_) => undefined,
          instructions: (_) => undefined,
          getLatestBlockhashRef: ({ getLatestBlockhashRef }) => {
            if (
              getLatestBlockhashRef !== undefined &&
              getLatestBlockhashRef.stop !== undefined
            ) {
              getLatestBlockhashRef.stop();
            }

            return undefined;
          },
        }),
        'Remove instruction from context': assign({
          instructions: (context, event) => {
            const instructions = [...(context.instructions ?? [])];
            instructions.splice(event.value, 1);

            return instructions;
          },
        }),
        'Save fee payer and instruction in context': assign({
          instructions: (_, event) => event.value.instructions,
          feePayer: (_, event) => event.value.feePayer,
        }),
        'Save fee payer in context': assign({
          feePayer: (_, event) => event.value,
        }),
        'Save instruction in new order in context': assign({
          instructions: (_, event) => event.value,
        }),
        'Save latest blockhash in context': assign({
          latestBlockhash: (_, event) => event.data,
        }),
        'Save transaction in context': assign({
          transaction: (context) =>
            new Transaction({
              feePayer: context.feePayer,
              recentBlockhash: context.latestBlockhash?.blockhash,
            }).add(...(context.instructions ?? [])),
        }),
        'Start get latest blockhash machine': assign({
          getLatestBlockhashRef: ({ connection }) =>
            spawn(getLatestBlockhashMachine(connection), {
              name: 'get-latest-blockhash',
            }),
        }),
      },
      guards: {
        'auto start enabled': () => config?.eager ?? false,
        'is fire and forget': () => config?.fireAndForget ?? false,
        'auto build enabled': () => config?.autoBuild ?? false,
      },
    }
  );
};

export const createTransactionServiceFactory = (
  connection: Connection,
  config?: {
    eager: boolean;
    autoBuild: boolean;
    fireAndForget: boolean;
  }
) => {
  return interpret(createTransactionMachineFactory(connection, config));
};
