import { Connection, SlotInfo } from '@solana/web3.js';
import { ActorRefFrom, assign, createMachine, interpret, spawn } from 'xstate';
import {
  rpcRequestMachineFactory,
  RpcRequestSuccess,
} from './rpc-request.machine';
import { EventType, EventValue } from './types';

type GetSlotEvent = EventType<'getSlot'> & EventValue<number>;

type UpdateSlotEvent = EventType<'updateSlot'> & EventValue<SlotInfo>;

type BlockhashStatusMachineEvent =
  | RpcRequestSuccess<number>
  | GetSlotEvent
  | UpdateSlotEvent;

export const blockhashStatusMachineFactory = (
  connection: Connection,
  config?: { fireAndForget: boolean }
) => {
  const getSlotMachine = () =>
    rpcRequestMachineFactory(() => connection.getSlot(), {
      eager: true,
      fireAndForget: true,
    });

  /** @xstate-layout N4IgpgJg5mDOIC5QCEA2B7AxgawBYENZcACAZQBd9yBXWYgWX01wEsA7MAOgHExzz2UYrAzkAxACUADpmISwAR2pxyDJqw6d5SlcOqZMYSJESgp6WCwHo2pkAA9EAWgCsLgOycXAZhcAWbwBObwAOACZAgAZAvwAaEABPZwCARk4QqL8QrOCXSL9AgF9C+LQsPEISCipaNWZ2LgB1Knq2IRF0VVhKGlgxaikIKjBSUTtzS2tbJAdnFLDvThS-MIKQ7z8UyPcXMJD4pIQnCMDOMPdvADZ8sJTfILDi0owcAiIyHtrGVqaWjXbRMJPn1xhYrCwbHZHAgUi5LpxLn44Yi-O47oEfAdnJdLiFOJEcW4PDjLstLk8QGVXpUPjU6N8NFxRp1iOwAG74VAsCBiUGTCHTUDQq4uTg7EI+SIS7w7NzeLFHLKRTiBdzuSIytHeDUhFLkkqUl4Vd7VXp1RliGDkZnkPngyEzaFObx7ThXUnuS4eQKIwI+hVOXGeZFwjWXH0uGLFA1sdAQOB2KnGqrA80NHh8ARtYRjGYTe2C2ZHXaeVGBPWR7KhfaJZxw05IjZXFJo1YyilJt4pulpzTNcitAEs7p0u1TKFzHxukKRWd+HHuELh+YBvxrt2ZbKRBZXTYdo1d2lmhnpm2stgcrkQMcCicIMKzsVhXGqwJ7LWrANBU53LbLCLnBc+7lIeppfOo6YACI2GAN4OkKiCbGkqruAs5ZbG+-hflKCK7LCITrN4+H6s8IE0mB9IQZoACSECoLBeZguOjp1hEYoEqqBEakRiIBpc7h+F4hIXJxOJ6sB1ImqmJ4cHBhZOi4upeL4ATBOEUQxAGaphEJXoBLc+ThPqxRAA */
  return createMachine(
    {
      context: {
        lastValidBlockHeight: undefined as number | undefined,
        initialSlot: undefined as number | undefined,
        currentSlot: undefined as number | undefined,
        initialGap: undefined as number | undefined,
        currentGap: undefined as number | undefined,
        percentage: undefined as number | undefined,
        getSlotRef: undefined as
          | ActorRefFrom<ReturnType<typeof getSlotMachine>>
          | undefined,
        isValid: undefined as boolean | undefined,
      },
      tsTypes: {} as import('./blockhash-status.machine.typegen').Typegen0,
      schema: { events: {} as BlockhashStatusMachineEvent },
      on: {
        getSlot: {
          actions: 'Save latest valid block height in context',
          target: '.Getting slot',
        },
      },
      initial: 'Idle',
      states: {
        'Getting slot': {
          entry: 'Start get slot machine',
          on: {
            'Rpc Request Machine.Request succeeded': {
              actions: 'Save initial slot in context',
              target: 'Watching slot status',
            },
          },
        },
        'Watching slot status': {
          invoke: {
            src: 'Subscribe to slot changes',
          },
          always: {
            actions: 'Mark as invalid in context',
            cond: 'slot invalid',
            target: 'Slot invalid',
          },
          on: {
            updateSlot: {
              actions: 'Update slot and gaps in context',
            },
          },
        },
        'Slot invalid': {
          always: {
            cond: 'is fire and forget',
            target: 'Done',
          },
        },
        Done: {
          type: 'final',
        },
        Idle: {},
      },
      id: 'Blockhash Status Machine',
    },
    {
      actions: {
        'Mark as invalid in context': assign({
          isValid: (_) => false,
        }),
        'Save initial slot in context': assign({
          initialSlot: (_, event) => event.data,
          initialGap: (context, event) =>
            (context.lastValidBlockHeight ?? 0) - event.data,
          percentage: (_) => 100,
          isValid: (context, event) =>
            context.lastValidBlockHeight !== undefined &&
            event.data < context.lastValidBlockHeight,
        }),
        'Update slot and gaps in context': assign({
          currentSlot: (_, event) => event.value.slot,
          currentGap: (context, event) =>
            (context.lastValidBlockHeight ?? 0) - event.value.slot,
          percentage: (context, event) =>
            Math.floor(
              (((context.lastValidBlockHeight ?? 0) - event.value.slot) * 100) /
                (context.initialGap ?? 1)
            ),
        }),
        'Save latest valid block height in context': assign({
          lastValidBlockHeight: (_, event) => event.value,
        }),
        'Start get slot machine': assign({
          getSlotRef: (_) =>
            spawn(getSlotMachine(), {
              name: 'get-slot',
            }),
        }),
      },
      guards: {
        'slot invalid': (context) => context.percentage === 0,
        'is fire and forget': () => config?.fireAndForget ?? false,
      },
      services: {
        'Subscribe to slot changes': () => (callback) => {
          const id = connection.onSlotChange((slotInfo) =>
            callback({ type: 'updateSlot', value: slotInfo })
          );

          return () => connection.removeSlotChangeListener(id);
        },
      },
    }
  );
};

export const blockhashStatusServiceFactory = (
  connection: Connection,
  config?: { fireAndForget: boolean }
) => {
  return interpret(blockhashStatusMachineFactory(connection, config));
};
