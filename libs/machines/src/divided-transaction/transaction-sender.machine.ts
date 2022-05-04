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
    },
  }
);

export const transactionSenderMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QBUBOBDAdrdBjALgJYD2mABAMpiYRipkCyeAFoZmAHQAKqxucsNlDJosOAiUwBiUdjxFSZHnwHF6TXK3YdZ4heVyow6fJESgADsUH7zIAB6IAtAE4A7BwBMAFgAMAVn8ANn8AZjdvUP8ADgAaEABPZwBGX1COXxd-NKC3ZOiXbyCgzwBfcvjMYlp4JBBdeUlKalp1FjZOZX5YQUxhBolSOysbSTtHBCdQl08Ob2jPAPyXAty4xMRkj2D-bxXPaOjvRf8K+ow5QfIqGjpGdu0AYWYwXABrITIAIQAbPjfmOhYMxhtZCLY6hNPMl0r43G5fL5vP53P43J5-PEkghIhkwskYSsAi4kS4gmcBvpmrc2poOqDRkNIc5vMkgnMFksCqs3OtsU4tuzMtlpqE-Bi3OTyqUgA */
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
