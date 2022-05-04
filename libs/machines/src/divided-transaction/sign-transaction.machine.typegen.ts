// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Add signature to transaction': 'partialSign';
    'Notify invalid signer error': 'partialSign';
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
    'valid signer': 'partialSign';
    'signatures verified': '';
    'auto start enabled': '';
  };
  eventsCausingDelays: {};
  matchesStates: 'Signing transaction' | 'Transaction Signed' | 'Idle';
  tags: never;
}
