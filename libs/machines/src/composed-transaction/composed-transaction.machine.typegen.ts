// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Mark transaction as creating': '';
    'Mark transaction as signing': 'done.state.Transaction Machine.Transaction Processor Machine.Create Transaction Machine';
    'Save blockhash details': 'done.invoke.Transaction Machine.Transaction Processor Machine.Create Transaction Machine.Fetching latest blockhash:invocation[0]';
    'Save fee payer': 'Set fee payer';
    'Add instruction to list': 'Add instruction';
    'Generate and save transaction': 'Finish Creating';
    'Save blockhash details in checker': 'Watch blockhash';
    'Mark transaction as sending': 'done.state.Transaction Machine.Transaction Processor Machine.Sign Transaction Machine';
    'Add signature to list': 'Sign transaction';
    'Notify invalid signer error': 'Sign transaction';
    'Save transaction signature': 'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]';
    'Notify send transaction error': 'error.platform.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]';
    'Mark transaction as confirmed': 'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Confirming Transaction:invocation[0]';
    'Notify confirm transaction error': 'error.platform.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Confirming Transaction:invocation[0]';
    'Increase number of attempts': 'xstate.after(30000)#Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sleeping';
    'Mark transaction as failed':
      | 'error.platform.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]'
      | 'xstate.after(30000)#Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sleeping';
  };
  internalEvents: {
    '': { type: '' };
    'done.invoke.Transaction Machine.Transaction Processor Machine.Create Transaction Machine.Fetching latest blockhash:invocation[0]': {
      type: 'done.invoke.Transaction Machine.Transaction Processor Machine.Create Transaction Machine.Fetching latest blockhash:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]': {
      type: 'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]': {
      type: 'error.platform.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]';
      data: unknown;
    };
    'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Confirming Transaction:invocation[0]': {
      type: 'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Confirming Transaction:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Confirming Transaction:invocation[0]': {
      type: 'error.platform.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Confirming Transaction:invocation[0]';
      data: unknown;
    };
    'xstate.after(30000)#Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sleeping': {
      type: 'xstate.after(30000)#Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sleeping';
    };
    'done.invoke.Transaction Machine.Blockhash Checker Machine.Getting Block Height:invocation[0]': {
      type: 'done.invoke.Transaction Machine.Blockhash Checker Machine.Getting Block Height:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'xstate.after(30000)#Transaction Machine.Blockhash Checker Machine.Sleeping': {
      type: 'xstate.after(30000)#Transaction Machine.Blockhash Checker Machine.Sleeping';
    };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    'Get Block Height': 'done.invoke.Transaction Machine.Blockhash Checker Machine.Getting Block Height:invocation[0]';
    'Fetch latest blockhash': 'done.invoke.Transaction Machine.Transaction Processor Machine.Create Transaction Machine.Fetching latest blockhash:invocation[0]';
    'Send transaction': 'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]';
    'Confirm transaction': 'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Confirming Transaction:invocation[0]';
  };
  missingImplementations: {
    actions:
      | 'Mark transaction as creating'
      | 'Mark transaction as signing'
      | 'Save blockhash details'
      | 'Save fee payer'
      | 'Add instruction to list'
      | 'Generate and save transaction'
      | 'Save blockhash details in checker'
      | 'Mark transaction as sending'
      | 'Add signature to list'
      | 'Notify invalid signer error'
      | 'Save transaction signature'
      | 'Notify send transaction error'
      | 'Mark transaction as confirmed'
      | 'Notify confirm transaction error'
      | 'Increase number of attempts'
      | 'Mark transaction as failed';
    services:
      | 'Get Block Height'
      | 'Fetch latest blockhash'
      | 'Send transaction'
      | 'Confirm transaction';
    guards:
      | 'is blockhash valid'
      | 'should recreate transaction'
      | 'is transaction done'
      | 'valid signer'
      | 'signatures are done'
      | 'can try to confirm again';
    delays: never;
  };
  eventsCausingServices: {
    'Get Block Height':
      | 'xstate.after(30000)#Transaction Machine.Blockhash Checker Machine.Sleeping'
      | 'Watch blockhash';
    'Fetch latest blockhash': 'xstate.init';
    'Send transaction': 'xstate.init';
    'Confirm transaction':
      | 'done.invoke.Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sending Transaction:invocation[0]'
      | 'xstate.after(30000)#Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sleeping';
  };
  eventsCausingGuards: {
    'is blockhash valid': 'done.invoke.Transaction Machine.Blockhash Checker Machine.Getting Block Height:invocation[0]';
    'should recreate transaction': '';
    'is transaction done': 'done.state.Transaction Machine.Transaction Processor Machine';
    'valid signer': 'Sign transaction';
    'signatures are done': '';
    'can try to confirm again': 'xstate.after(30000)#Transaction Machine.Transaction Processor Machine.Send Transaction Machine.Sleeping';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Blockhash Checker Machine'
    | 'Blockhash Checker Machine.Getting Block Height'
    | 'Blockhash Checker Machine.Sleeping'
    | 'Blockhash Checker Machine.Blockhash Expired'
    | 'Blockhash Checker Machine.Stopped'
    | 'Blockhash Checker Machine.Idle'
    | 'Transaction Processor Machine'
    | 'Transaction Processor Machine.Create Transaction Machine'
    | 'Transaction Processor Machine.Create Transaction Machine.Fetching latest blockhash'
    | 'Transaction Processor Machine.Create Transaction Machine.Creating Transaction'
    | 'Transaction Processor Machine.Create Transaction Machine.Transaction Created'
    | 'Transaction Processor Machine.Sign Transaction Machine'
    | 'Transaction Processor Machine.Sign Transaction Machine.Signing transaction'
    | 'Transaction Processor Machine.Sign Transaction Machine.Signing Done'
    | 'Transaction Processor Machine.Send Transaction Machine'
    | 'Transaction Processor Machine.Send Transaction Machine.Sending Transaction'
    | 'Transaction Processor Machine.Send Transaction Machine.Confirming Transaction'
    | 'Transaction Processor Machine.Send Transaction Machine.Sleeping'
    | 'Transaction Processor Machine.Transaction Confirmed'
    | 'Transaction Processor Machine.Transaction Failed'
    | {
        'Blockhash Checker Machine'?:
          | 'Getting Block Height'
          | 'Sleeping'
          | 'Blockhash Expired'
          | 'Stopped'
          | 'Idle';
        'Transaction Processor Machine'?:
          | 'Create Transaction Machine'
          | 'Sign Transaction Machine'
          | 'Send Transaction Machine'
          | 'Transaction Confirmed'
          | 'Transaction Failed'
          | {
              'Create Transaction Machine'?:
                | 'Fetching latest blockhash'
                | 'Creating Transaction'
                | 'Transaction Created';
              'Sign Transaction Machine'?:
                | 'Signing transaction'
                | 'Signing Done';
              'Send Transaction Machine'?:
                | 'Sending Transaction'
                | 'Confirming Transaction'
                | 'Sleeping';
            };
      };
  tags: never;
}
