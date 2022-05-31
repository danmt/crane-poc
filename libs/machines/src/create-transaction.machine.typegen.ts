// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save fee payer and instruction in context': 'createTransaction';
    'Save latest blockhash in context': 'Rpc Request Machine.Request succeeded';
    'Start get latest blockhash machine': 'createTransaction';
    'Save transaction in context': 'Rpc Request Machine.Request succeeded';
  };
  internalEvents: {
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {
    'is fire and forget': '';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Fetching latest blockhash'
    | 'Transaction created'
    | 'Done';
  tags: never;
}
