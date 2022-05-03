import { Connection } from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const blockhashCheckerModel = createModel(
  {
    blockHeight: undefined as number | undefined,
    lastValidBlockHeight: undefined as number | undefined,
  },
  {
    events: {
      getBlockHeight: (value: number) => ({ value }),
      stopChecker: () => ({}),
    },
  }
);

export type BlockhashCheckerMachineServices = {
  'Get block height': { data: number };
};

export const blockhashCheckerMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QCEA2B7AxgawBYENZcACAYVzBzACdiBZfTXASwDswA6ASQlTAGIYAFzRZsACTDMouIYlAAHdLGZDm6VvJAAPRAEYAnBwCsABgBsxgMx7TV0wA4rDvQCYANCACeiALSurKw49ABZbEOMzPXM9KwBfOM9RHAIiMgoqWgYmNk4AcTAhNVYoYgAjDBxiCmlZfggNTjYAN3RsTmS8QhJySnasxhZ2DgKitlKKsWqpGSEEFqx8NQ0AbVMAXS0lFWXNJB1EAHZjDlMLazdD11dDkPMDTx8EX1DzYLC7Yz1jEMCbw4SSUqXTSvUy9EGuRGhWKE2B01qQn4NGo6GoHAUqCWADM0QBbDidVI9DL9CE5YajWHleE1WbzVitTBLdSsNabfbbVSsrS6BCBEIcByuYyuX4hQ5Wa4OW6PPyGPTvUwGBymMUSyzmEKAkBE7rpPo0clDTgAZT4YAU4342lgQiWnHw2KENAAFPYzqYAJT8PWg0lG7ImjjmsCW8ZbZTcjS8xBikznGx2RzONxy57GIyhWxi1WHUyi6w6v0kw0DCkCO3oBRg-qRnY8-Z8-whQUxBwhAymPQOAz5rvmdOChzGXvmK7mM5SmLaxK64HEg3goO5fj16N7UDN9Ucdud7u9-sWdOioWjgwhGVXXs9gwJOesdAQOBaEtLskr4Y8Pjr3ax55uIqnZWHcnbmMKsSdum-iGLuHxhOYzjmK4HbFgu+q1oGkLDKaQjVgokC-o2W5xoKZiWEm9hOC4HjePK7zhFKF6GFKooAnOb6YeWwZUuMNJTHSshETGTaINOpz3GcYSdnciHQQYWYfK40SBA4DjmOYaFiIuXHGlCobhiUwmbgcAFWCc5mZrcCldlYF5WNBtwcH2vzqVYhz3IhBiaRx6H+mWenDG+ACi2hWtQhGclGf6iQg8bkRcybUWmdEIC4Z69lK+bdtEkRaSkGEBtxuTGf+-jgbuPb7reR6Dqlvg2A4DEFpKVyHO195xEAA */
  blockhashCheckerModel.createMachine({
    context: blockhashCheckerModel.initialContext,
    schema: {
      services: {} as BlockhashCheckerMachineServices,
    },
    tsTypes: {} as import('./blockhash-checker.machine.typegen').Typegen0,
    always: {
      cond: 'is block height invalid',
      target: '.Blockhash Expired',
    },
    id: 'Blockhash Checker Machine',
    initial: 'Idle',
    states: {
      Idle: {
        on: {
          getBlockHeight: {
            actions: 'Save last valid block height in memory',
            target: 'Getting block height',
          },
        },
      },
      Stopped: {
        type: 'final',
      },
      'Getting block height': {
        invoke: {
          src: 'Get block height',
          onDone: [
            {
              actions: 'Save block height in memory',
              target: 'Sleeping',
            },
          ],
          onError: [
            {
              actions: 'Notifiy get block height error',
            },
          ],
        },
      },
      Sleeping: {
        after: {
          '30000': {
            target: 'Getting block height',
          },
        },
      },
      'Blockhash Expired': {
        type: 'final',
      },
    },
    on: {
      stopChecker: {
        target: '.Stopped',
      },
    },
  });

export const blockhashCheckerServiceFactory = (connection: Connection) =>
  interpret(
    blockhashCheckerMachine.withConfig({
      actions: {
        'Notifiy get block height error': (_, event) =>
          console.error(event.data),
        'Save block height in memory': assign({
          blockHeight: (_, event) => event.data,
        }),
        'Save last valid block height in memory': assign({
          lastValidBlockHeight: (_, event) => event.value,
        }),
      },
      services: {
        'Get block height': () => connection.getBlockHeight(),
      },
      guards: {
        'is block height invalid': ({ blockHeight, lastValidBlockHeight }) => {
          if (blockHeight === undefined || lastValidBlockHeight === undefined) {
            return false;
          }

          return blockHeight > lastValidBlockHeight;
        },
      },
    })
  ).start();
