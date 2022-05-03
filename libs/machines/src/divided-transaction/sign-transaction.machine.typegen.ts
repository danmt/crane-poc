// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Add signature to transaction': 'partialSign';
    'Notify invalid signer error': 'partialSign';
    'Save transaction in memory': 'signTransaction';
  };
  internalEvents: {
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions:
      | 'Add signature to transaction'
      | 'Notify invalid signer error'
      | 'Save transaction in memory';
    services: never;
    guards: 'valid signer' | 'signatures verified';
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {
    'valid signer': 'partialSign';
    'signatures verified': '';
  };
  eventsCausingDelays: {};
  matchesStates: 'Signing transaction' | 'Transaction Signed' | 'Idle';
  tags: never;
}
