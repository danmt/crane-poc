import { Connection } from '@solana/web3.js';
import { interpret } from 'xstate';
import { rpcRequestMachineFactory } from './rpc-request.machine';

export const getLatestBlockhashServiceFactory = (
  connection: Connection,
  config?: {
    eager: boolean;
    fireAndForget: boolean;
  }
) => {
  return interpret(
    rpcRequestMachineFactory(() => connection.getLatestBlockhash(), config)
  );
};
