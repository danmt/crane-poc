import { Connection } from '@solana/web3.js';
import { rpcRequestServiceFactory } from './rpc-request.machine';

export const getLatestBlockhashServiceFactory = (
  connection: Connection,
  config?: {
    eager: boolean;
    fireAndForget: boolean;
  }
) => {
  return rpcRequestServiceFactory(
    () => connection.getLatestBlockhash(),
    config
  );
};
