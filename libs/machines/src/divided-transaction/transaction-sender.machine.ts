import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { ActorRefFrom, assign, interpret, spawn } from 'xstate';
import { createModel } from 'xstate/lib/model';
import { blockhashCheckerMachine } from './blockhash-checker.machine';
import { transactionProcessorMachine } from './transaction-processor.machine';

export const transactionSenderModel = createModel(
  {
    connection: new Connection('http://localhost:8899'),
    feePayer: PublicKey.default,
    instructions: [] as TransactionInstruction[],
    signer: Keypair.generate(),
    transactionProcessorRef: undefined as
      | ActorRefFrom<typeof transactionProcessorMachine>
      | undefined,
    blockhashCheckerRef: undefined as
      | ActorRefFrom<typeof blockhashCheckerMachine>
      | undefined,
  },
  {
    events: {
      startBlockhashChecker: (value: number) => ({ value }),
      transactionConfirmed: () => ({}),
      blockhashExpired: () => ({}),
      'Transaction Processor Machine.Transaction created': (value: {
        transaction: Transaction;
        lastValidBlockHeight: number;
      }) => ({ value }),
      'Transaction Processor Machine.Transaction failed': (value: unknown) => ({
        value,
      }),
    },
  }
);

export const transactionSenderMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUBOBDAdrdBjALgJYD2mABAMpiYRipkCyeAFoZmAHQAKqxucsNlDJosOAiUwBiUdjxFSZHnwHF6TXK3YdZ4heVyow6fJESgADsUH7zIAB6IALAFYXHAAyuXAdgCcAIxOABwAbL6+ADQgAJ6IAT5OHOGhTk6hwT6pHj6ZAL550brykpTUtOosbJzK-LCCmMLFEqQyGHIt5LWqlZrVOu16pQBm6IQANmZIIFY2knaOCD4eHH4AzGsefn4uAEwBLn4eAdFxCE4BHLs+AWsBYS6hyy4eLgWFIJjEtPDTzfplGh0RhVbTdepCESDEqkOyzQi2aaLAKvDj3dZOY77FwJA6neKhXbJR5pPzpNa7a5kgpFaGdQEVEF9bQAYWYYFwAGtIQAhcZ8TnMdCwZhw6wI+ZIxDBQ4cNY7ULHUIbXZ+HwufEIe7BNEkvbBHY5Q40kD-UpUIG9LRgMVzWFS86hVYbLY7bFHLZOTUAWjuHB8u0yW2CFOCHnCLmC7zyQA */
  transactionSenderModel.createMachine({
    tsTypes: {} as import('./transaction-sender.machine.typegen').Typegen0,
    type: 'parallel',
    states: {
      'Processing Transaction': {
        entry: 'Start transaction processor',
        on: {
          'Transaction Processor Machine.Transaction created': {
            actions: 'Get block height',
            target: 'Checking Blockhash',
          },
          'Transaction Processor Machine.Transaction failed': {
            actions: 'Handle failed transaction',
          },
        },
      },
      'Checking Blockhash': {},
    },
    id: 'Transaction Sender Machine',
  });

export const transactionSenderServiceFactory = (
  connection: Connection,
  instructions: TransactionInstruction[],
  feePayer: PublicKey,
  signer: Keypair
) => {
  return interpret(
    transactionSenderMachine.withConfig(
      {
        services: {},
        actions: {
          'Start transaction processor': assign({
            transactionProcessorRef: ({
              connection,
              feePayer,
              instructions,
              signer,
            }) =>
              spawn(
                transactionProcessorMachine.withConfig(
                  {
                    guards: { 'auto start enabled': () => true },
                  },
                  {
                    connection,
                    feePayer,
                    instructions,
                    signer,
                  }
                ),
                { name: 'transaction-processor' }
              ),
          }),
          'Get block height': assign({
            blockhashCheckerRef: ({ connection }, event) =>
              spawn(
                blockhashCheckerMachine.withConfig(
                  {
                    guards: {
                      'auto start enabled': () => true,
                    },
                  },
                  {
                    connection,
                    lastValidBlockHeight: event.value.lastValidBlockHeight,
                    blockHeight: undefined,
                  }
                ),
                { name: 'blockhash-checker' }
              ),
          }),
          'Handle failed transaction': (context, event) => {
            console.log({ context, event });
          },
        },
      },
      {
        connection,
        instructions,
        feePayer,
        signer,
        transactionProcessorRef: undefined,
        blockhashCheckerRef: undefined,
      }
    )
  );
};
