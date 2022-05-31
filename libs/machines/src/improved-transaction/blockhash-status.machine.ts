import { Connection, SlotInfo } from '@solana/web3.js';
import { ActorRefFrom, assign, createMachine, interpret, spawn } from 'xstate';
import {
  rpcRequestMachineFactory,
  RpcRequestSuccess,
} from './rpc-request.machine';
import { EventType, EventValue } from './types';

type GetSlotEvent = EventType<'getSlot'> & EventValue<number>;

type UpdateSlotEvent = EventType<'updateSlot'> & EventValue<SlotInfo>;

type RestartMachineEvent = EventType<'restartMachine'>;

type BlockhashStatusMachineEvent =
  | RpcRequestSuccess<number>
  | GetSlotEvent
  | UpdateSlotEvent
  | RestartMachineEvent;

export const blockhashStatusMachineFactory = (
  connection: Connection,
  lastValidBlockHeight: number | undefined,
  initialSlot: number | undefined,
  config?: { fireAndForget: boolean }
) => {
  const getSlotMachine = () =>
    rpcRequestMachineFactory(() => connection.getSlot(), {
      eager: true,
      fireAndForget: true,
    });

  /** @xstate-layout N4IgpgJg5mDOIC5QCEA2B7AxgawBYENZcACAZQBd9yBXWYgWX01wEsA7MAOgHExzz2UYrAzkAxACUADpmISwAR2pxyDJqw6d5SlcOqZMYSJESgp6WCwHo2pkAA9EAWgBsARgDMnNwE4ATB4uAAwArAAsfkE+IQDsADQgAJ7OHiF+nCFuUR5+bgAcLn4hLjEAvqUJaFh4hCQUVLRqzOxcAOpUzWxCIuiqsJQ0sGLUUhBUYKSiduaW1rZIDs5uMXmcMT4+Yb4hQUF+7uEJyQhOuT6ceZuhbjuFPm7llRg4BERkA42MnW0dGt2iwg+Q2mFisLBsdkcCCyQU4PjyeRiYQ8HjcfkiPiCYSOzhCCM4LkRuw8oR8gRcYUeICqL1q7wadC+Gi4k16xHYADd8KgWBAxCDZuD5qAoajYVk3MEfC5NsUyTiTmEgm4Mj4kXkdqEVhsXFSaTU3vVBk1mWIYORWeQBWCIQsoU4PHkwpw9iS1TFHXlAn4Fa4gqt8jFdjEXIUtmjyhUQGx0BA4HZ9a86kCTS0eHwBF1hFMFjMbcLFic8V5PMFEW5kbFkb6wpiXR6ER4wi4PBtwrqo4m6UbPuo0+1yJ1-mz+gzrXNIc4MS7Av48X4gyEQh54kkUi4Qi6smTPJK3DcfHrngbkwzU5pLey2FyeRBx0LJ9CwpugjK1SUZWkZS5fajzjFMmbG4NTSMI8iPaok3pY0mTTAARGwwHvW0RUQVIXE4HIglRdZMg9e5fXRc4F32V80RCe4sQg2lDRTWCOGQgt7RbGJvH8QJQgiKJYl9GUSyJbCl2XZsO3KIA */
  return createMachine(
    {
      context: {
        lastValidBlockHeight,
        initialSlot,
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
      initial: 'Getting slot',
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
  lastValidBlockHeight: number | undefined,
  initialSlot: number | undefined,
  config?: { fireAndForget: boolean }
) => {
  return interpret(
    blockhashStatusMachineFactory(
      connection,
      lastValidBlockHeight,
      initialSlot,
      config
    )
  );
};
