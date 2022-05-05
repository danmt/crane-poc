// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Get block height': 'Transaction Processor Machine.Transaction created';
    'Handle failed transaction': 'Transaction Processor Machine.Transaction failed';
    'Start transaction processor': 'xstate.init';
  };
  internalEvents: {
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions:
      | 'Get block height'
      | 'Handle failed transaction'
      | 'Start transaction processor';
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
