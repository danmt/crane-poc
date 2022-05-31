// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    'Save latest valid block height in context': 'getSlot';
    'Save initial slot in context': 'Rpc Request Machine.Request succeeded';
    'Update slot and gaps in context': 'updateSlot';
    'Mark as invalid in context': '';
    'Start get slot machine': 'getSlot';
  };
  internalEvents: {
    '': { type: '' };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    'Subscribe to slot changes': 'done.invoke.Blockhash Status Machine.Watching slot status:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    'Subscribe to slot changes': 'Rpc Request Machine.Request succeeded';
  };
  eventsCausingGuards: {
    'slot invalid': '';
    'is fire and forget': '';
  };
  eventsCausingDelays: {};
  matchesStates:
    | 'Getting slot'
    | 'Watching slot status'
    | 'Slot invalid'
    | 'Done'
    | 'Idle';
  tags: never;
}
