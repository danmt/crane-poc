// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save transaction in context': 'startSigning';
    'Update transaction with signature in context': 'done.invoke.Sign transaction machine.Signing transaction:invocation[0]';
    'Notify sign transaction error': 'error.platform.Sign transaction machine.Signing transaction:invocation[0]';
  };
  internalEvents: {
    'done.invoke.Sign transaction machine.Signing transaction:invocation[0]': {
      type: 'done.invoke.Sign transaction machine.Signing transaction:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
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
