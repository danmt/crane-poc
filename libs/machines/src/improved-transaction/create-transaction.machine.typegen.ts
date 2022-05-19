// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save fee payer and instruction in context':
      | 'createTransaction'
      | 'buildTransaction';
    'Save latest blockhash in context': 'Rpc Request Machine.Request succeeded';
    'Clear context': 'restartMachine';
    'Start get latest blockhash machine': 'createTransaction' | '';
    'Save transaction in context': 'buildTransaction' | '';
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
    'auto start enabled': '';
    'auto build enabled': '';
    'is fire and forget': '';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Fetching latest blockhash'
    | 'Creating transaction'
    | 'Transaction created'
    | 'Done';
  tags: never;
}
