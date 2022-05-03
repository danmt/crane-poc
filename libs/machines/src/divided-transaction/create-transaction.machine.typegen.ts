// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Generate id and save in memory': 'createTransaction';
    'Save latest blockhash in memory': 'done.invoke.Create Transaction Machine.Fetching latest blockhash:invocation[0]';
    'Notify fetch latest blockhash error': 'error.platform.Create Transaction Machine.Fetching latest blockhash:invocation[0]';
    'Save fee payer in memory': 'setFeePayer';
    'Save instructions in memory': 'setInstructions';
    'Generate transaction and save in memory': 'buildTransaction';
  };
  internalEvents: {
    'done.invoke.Create Transaction Machine.Fetching latest blockhash:invocation[0]': {
      type: 'done.invoke.Create Transaction Machine.Fetching latest blockhash:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.Create Transaction Machine.Fetching latest blockhash:invocation[0]': {
      type: 'error.platform.Create Transaction Machine.Fetching latest blockhash:invocation[0]';
      data: unknown;
    };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    'Fetch latest blockhash': 'done.invoke.Create Transaction Machine.Fetching latest blockhash:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    services: 'Fetch latest blockhash';
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    'Fetch latest blockhash': 'createTransaction';
  };
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Fetching latest blockhash'
    | 'Creating transaction'
    | 'Transaction Created';
  tags: never;
}
