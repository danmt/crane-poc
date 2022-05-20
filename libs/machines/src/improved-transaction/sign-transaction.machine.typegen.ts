// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save transaction in context': 'startSigning';
    'Notify sign transaction error': 'error.platform.Sign transaction machine.Signing transaction:invocation[0]';
  };
  internalEvents: {
    'error.platform.Sign transaction machine.Signing transaction:invocation[0]': {
      type: 'error.platform.Sign transaction machine.Signing transaction:invocation[0]';
      data: unknown;
    };
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    'Sign transaction': 'done.invoke.Sign transaction machine.Signing transaction:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    'Sign transaction': 'signTransaction';
  };
  eventsCausingGuards: {
    'auto start enabled': '';
    'valid signer': 'signTransaction';
    'signatures done': '';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Transaction signed'
    | 'Sign transaction'
    | 'Signing transaction';
  tags: never;
}
