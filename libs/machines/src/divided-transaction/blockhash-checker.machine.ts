import { Connection } from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { createModel } from 'xstate/lib/model';

export const blockhashCheckerModel = createModel(
  {
    blockHeight: undefined as number | undefined,
    connection: new Connection('http://localhost:8899'),
    lastValidBlockHeight: -1,
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCEA2B7AxgawBYENZcACAYVzBzACdiBZfTXASwDswA6ASQlTAGIYAFzRZsACTDMouIYlAAHdLGZDm6VvJAAPRAFoAzACYAjBxNGDJgwA4LAVhsAGJwDZXAGhABPfQacALBzGVvYGAOwuNjYB4fYAvvFeojgERGQUVLQMTGycPHz8Wkoqahpaugh69q72wSY1dpYBBhEmXr5VxmYGtQCcfXF9du5hickYqYQk5JTYNPSMLOwcAOJgQmqsUMQARpPYxBTSsvwQGpxsAG7o8xwpeNMZcws5y5zrm2w7+2JHUjIhAhrlh8GVWABtJwAXWKylU6k0SB0+ga4Q4NnsAVcRic4RxAQsBgCHVR4SMHFxQ1CsXC0Vc4xADzSM0y82ySzyaw2Wx+B3+JyE-Bo1HQ1A4ClQYIAZmKALb3A4s55ZRa5FafXl7fnHQHA1g3TBgxFQ2HIkoI8rIyp6bHoiJ9FzhAKY52uNykhBWDiuAIu+xhAL2PoGex0xnMp6zVVvLkAZT4YAU3342lgQjBnHw0qENAAFP4XE4AJT8SPpaPstXvDgJsBJ75w0qIiqokw2DjhPq4votANGR02Tw+fSuDvGYYmAK4pwD2o2CNKqNs16c9j8dPoBSVmhNy1I0A2iwdrv+EOOtwBJx9T22oMcPH2EyuCJhTF9BlJJlLisrjnqgQ93BVsEDRYJMQCPoTCcZ8jAHCJb0JAwMUGIwXSgtwbFMBJGVYdAIDgLRy1ZF5-xrAowCAltrT8LtzBcFoYPCZ0AxsRDXHRZ9CRMEwBivUwDEXMRlR3Mj4yELcFEgKirUPVFiUpAN3WnUxeLcexb16IJokGadBkcMdwiEqZf1I6suU1b5tT+XVZBkg8USqWJXHMUMjBsAZLBMfEjFvawO0xJxWksAc0MCAJjMeUyYzXTg6wbbZ7JA0wgifDiXVcHiahUvzrGCewgqsJwwkfaJIpEv9zJWYjiAAUW0ZNqGk814WAmjQLsDgn0Cc8akcBoSRHKojEccx21cYZMpfWwX3K5czNjdgkva6oPPqRoiRaNpb37cxfSnWJew8j9EkSIA */
  blockhashCheckerModel.createMachine(
    {
      context: blockhashCheckerModel.initialContext,
      tsTypes: {} as import('./blockhash-checker.machine.typegen').Typegen0,
      schema: { services: {} as BlockhashCheckerMachineServices },
      always: {
        cond: 'is block height invalid',
        target: '.Blockhash Expired',
      },
      id: 'Blockhash Checker Machine',
      initial: 'Idle',
      states: {
        Idle: {
          always: {
            cond: 'auto start enabled',
            target: 'Getting block height',
          },
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
    },
    {
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
        'Get block height': ({ connection }) => connection.getBlockHeight(),
      },
      guards: {
        'is block height invalid': ({ blockHeight, lastValidBlockHeight }) => {
          if (blockHeight === undefined) {
            return false;
          }

          return blockHeight > lastValidBlockHeight;
        },
        'auto start enabled': () => false,
      },
    }
  );

export const blockhashCheckerServiceFactory = (
  connection: Connection,
  lastValidBlockHeight: number,
  config?: { eager: boolean }
) =>
  interpret(
    blockhashCheckerMachine.withConfig(
      {
        guards: {
          'auto start enabled': () => config?.eager ?? false,
        },
      },
      {
        connection,
        lastValidBlockHeight,
        blockHeight: undefined,
      }
    )
  );
