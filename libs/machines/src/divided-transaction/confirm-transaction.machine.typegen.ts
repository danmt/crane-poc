// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Notify confirm transaction error': 'error.platform.Confirm Transaction Machine.Confirming transaction:invocation[0]';
    'Increase number of attempts': 'error.platform.Confirm Transaction Machine.Confirming transaction:invocation[0]';
  };
  internalEvents: {
    'error.platform.Confirm Transaction Machine.Confirming transaction:invocation[0]': {
      type: 'error.platform.Confirm Transaction Machine.Confirming transaction:invocation[0]';
      data: unknown;
    };
    '': { type: '' };
    'xstate.after(30000)#Confirm Transaction Machine.Sleeping': {
      type: 'xstate.after(30000)#Confirm Transaction Machine.Sleeping';
    };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    'Confirm transaction': 'done.invoke.Confirm Transaction Machine.Confirming transaction:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    'Confirm transaction':
      | 'confirmTransaction'
      | ''
      | 'xstate.after(30000)#Confirm Transaction Machine.Sleeping';
  };
  eventsCausingGuards: {
    'auto start enabled': '';
    'can try again': 'xstate.after(30000)#Confirm Transaction Machine.Sleeping';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Idle'
    | 'Confirming transaction'
    | 'Transaction confirmed'
    | 'Sleeping'
    | 'Transaction confirmation failed';
  tags: never;
}
