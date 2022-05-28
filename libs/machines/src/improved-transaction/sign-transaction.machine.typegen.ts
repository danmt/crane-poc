// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save transaction in context': 'startSigning';
    'Sign using keypair': 'signTransactionWithKeypair';
    'Save signature in context': 'signTransactionWithWallet';
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
    'valid signer': 'signTransactionWithKeypair' | 'signTransactionWithWallet';
    'signatures done': '';
  };
  eventsCausingDelays: {};
  matchesStates: 'Idle' | 'Transaction signed' | 'Sign transaction';
  tags: never;
}
