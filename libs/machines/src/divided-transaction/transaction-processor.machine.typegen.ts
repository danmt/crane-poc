// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Transaction created': 'transactionCreated';
    'Transaction signed': 'transactionSigned';
    'Transaction sent': 'transactionSent';
    'Transaction confirmed': 'transactionConfirmed';
  };
  internalEvents: {
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    'Create transaction machine': 'done.invoke.Transaction Processor Machine.Creating Transaction:invocation[0]';
    'Sign transaction machine': 'done.invoke.Transaction Processor Machine.Signing transaction:invocation[0]';
    'Send transaction machine': 'done.invoke.Transaction Processor Machine.Sending transaction:invocation[0]';
    'Confirm transaction machine': 'done.invoke.Transaction Processor Machine.Confirming transaction:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    services:
      | 'Create transaction machine'
      | 'Sign transaction machine'
      | 'Send transaction machine'
      | 'Confirm transaction machine';
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    'Create transaction machine': 'createTransaction' | '';
    'Sign transaction machine': 'transactionCreated';
    'Send transaction machine': 'transactionSigned';
    'Confirm transaction machine': 'transactionSent';
  };
  eventsCausingGuards: {
    'auto start enabled': '';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Creating Transaction'
    | 'Signing transaction'
    | 'Sending transaction'
    | 'Confirming transaction'
    | 'Transaction confirmed';
  tags: never;
}
