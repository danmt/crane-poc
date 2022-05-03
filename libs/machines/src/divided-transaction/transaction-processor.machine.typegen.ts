// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Spawn create transaction machine': 'createTransaction';
    'Start creating transaction': 'createTransaction';
    'Finish transaction creation': '';
  };
  internalEvents: {
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions:
      | 'Spawn create transaction machine'
      | 'Start creating transaction'
      | 'Finish transaction creation';
    services: never;
    guards: 'creating transaction' | 'transaction created';
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {
    'creating transaction': '';
    'transaction created': '';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Creating Transaction'
    | 'Signing transaction'
    | 'Finishing transaction creation';
  tags: never;
}
