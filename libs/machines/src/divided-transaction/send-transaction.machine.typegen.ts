// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save signature in memory': 'done.invoke.Send Transaction Machine.Sending Transaction:invocation[0]';
    'Notify send transaction error': 'error.platform.Send Transaction Machine.Sending Transaction:invocation[0]';
  };
  internalEvents: {
    'done.invoke.Send Transaction Machine.Sending Transaction:invocation[0]': {
      type: 'done.invoke.Send Transaction Machine.Sending Transaction:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.Send Transaction Machine.Sending Transaction:invocation[0]': {
      type: 'error.platform.Send Transaction Machine.Sending Transaction:invocation[0]';
      data: unknown;
    };
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    'Send transaction': 'done.invoke.Send Transaction Machine.Sending Transaction:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    'Send transaction': 'sendTransaction' | '';
  };
  eventsCausingGuards: {
    'auto start enabled': '';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Sending Transaction'
    | 'Transaction Sent'
    | 'Transaction Failed';
  tags: never;
}
