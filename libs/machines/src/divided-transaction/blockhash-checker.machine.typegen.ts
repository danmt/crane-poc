// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save last valid block height in memory': 'getBlockHeight';
    'Save block height in memory': 'done.invoke.Blockhash Checker Machine.Getting block height:invocation[0]';
    'Notifiy get block height error': 'error.platform.Blockhash Checker Machine.Getting block height:invocation[0]';
  };
  internalEvents: {
    'done.invoke.Blockhash Checker Machine.Getting block height:invocation[0]': {
      type: 'done.invoke.Blockhash Checker Machine.Getting block height:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.Blockhash Checker Machine.Getting block height:invocation[0]': {
      type: 'error.platform.Blockhash Checker Machine.Getting block height:invocation[0]';
      data: unknown;
    };
    'xstate.after(30000)#Blockhash Checker Machine.Sleeping': {
      type: 'xstate.after(30000)#Blockhash Checker Machine.Sleeping';
    };
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    'Get block height': 'done.invoke.Blockhash Checker Machine.Getting block height:invocation[0]';
  };
  missingImplementations: {
    actions:
      | 'Save last valid block height in memory'
      | 'Save block height in memory'
      | 'Notifiy get block height error';
    services: 'Get block height';
    guards: 'is block height invalid';
    delays: never;
  };
  eventsCausingServices: {
    'Get block height':
      | 'getBlockHeight'
      | 'xstate.after(30000)#Blockhash Checker Machine.Sleeping';
  };
  eventsCausingGuards: {
    'is block height invalid': '';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Stopped'
    | 'Getting block height'
    | 'Sleeping'
    | 'Blockhash Expired';
  tags: never;
}
