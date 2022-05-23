// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save fee payer and instruction in context': 'createTransaction';
    'Save latest blockhash in context': 'Rpc Request Machine.Request succeeded';
    'Save fee payer in context': 'setFeePayer';
    'Add instruction to context': 'addInstruction';
    'Remove instruction from context': 'removeInstruction';
    'Save instruction in new order in context': 'organizeInstructions';
    'Clear context': 'restartMachine';
    'Start get latest blockhash machine': 'buildTransaction' | '';
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
