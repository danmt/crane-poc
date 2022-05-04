// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Get block height': 'Transaction Processor Machine.Transaction created';
    'Start transaction processor': 'xstate.init';
  };
  internalEvents: {
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: 'Get block height' | 'Start transaction processor';
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: 'Processing Transaction' | 'Checking Blockhash';
  tags: never;
}
