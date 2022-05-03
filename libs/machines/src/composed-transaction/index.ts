import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { assign, interpret } from 'xstate';
import { composedTransactionMachine } from './composed-transaction.machine';
import { v4 as uuid } from 'uuid';

export * from './composed-transaction.machine';

export const composedTransactionServiceFactory = (
  connection: Connection,
  authority: Keypair,
  instructions: TransactionInstruction[]
) =>
  interpret(
    composedTransactionMachine.withConfig(
      {
        actions: {
          'Add instruction to list': assign({
            'Transaction Processor Machine': (context, event) => ({
              ...context['Transaction Processor Machine'],
              'Create Transaction Machine': {
                ...context['Transaction Processor Machine'][
                  'Create Transaction Machine'
                ],
                instructions: [
                  ...context['Transaction Processor Machine'][
                    'Create Transaction Machine'
                  ].instructions,
                  event.instruction,
                ],
              },
            }),
          }),
          'Add signature to list': (context, event) => {
            context['Transaction Processor Machine'].transaction?.partialSign(
              event.keypair
            );
          },
          'Increase number of attempts': assign({
            'Transaction Processor Machine': (context) => ({
              ...context['Transaction Processor Machine'],
              'Send Transaction Machine': {
                ...context['Transaction Processor Machine'][
                  'Send Transaction Machine'
                ],
                attempt:
                  context['Transaction Processor Machine'][
                    'Send Transaction Machine'
                  ]?.attempt + 1,
              },
            }),
          }),
          'Save transaction signature': assign({
            'Transaction Processor Machine': (context, event) => ({
              ...context['Transaction Processor Machine'],
              signature: event.data as string,
            }),
          }),
          'Mark transaction as creating': assign({
            'Transaction Processor Machine': (context) => ({
              ...context['Transaction Processor Machine'],
              status: 'creating',
            }),
          }),
          'Mark transaction as confirmed': assign({
            'Transaction Processor Machine': (context) => ({
              ...context['Transaction Processor Machine'],
              status: 'confirmed',
            }),
          }),
          'Mark transaction as sending': assign({
            'Transaction Processor Machine': (context) => ({
              ...context['Transaction Processor Machine'],
              status: 'sending',
            }),
          }),
          'Mark transaction as signing': assign({
            'Transaction Processor Machine': (context) => ({
              ...context['Transaction Processor Machine'],
              status: 'signing',
            }),
          }),
          'Mark transaction as failed': assign({
            'Transaction Processor Machine': (context) => ({
              ...context['Transaction Processor Machine'],
              status: 'failed',
            }),
          }),
          'Notify invalid signer error': () => {
            console.error('Invalid Signer Error');
          },
          'Notify send transaction error': (_, event) => {
            console.error(event.data);
          },
          'Notify confirm transaction error': (_, event) => {
            console.error(event.data);
          },
          'Save fee payer': assign({
            'Transaction Processor Machine': (context, event) => ({
              ...context['Transaction Processor Machine'],
              'Create Transaction Machine': {
                ...context['Transaction Processor Machine'][
                  'Create Transaction Machine'
                ],
                feePayer: event.feePayer,
              },
            }),
          }),
          'Save blockhash details': assign({
            'Transaction Processor Machine': (context, event) => ({
              ...context['Transaction Processor Machine'],
              'Create Transaction Machine': {
                ...context['Transaction Processor Machine'][
                  'Create Transaction Machine'
                ],
                latestBlockhash: {
                  blockhash: event.data.blockhash,
                  lastValidBlockHeight: event.data.lastValidBlockHeight,
                },
              },
            }),
          }),
          'Generate and save transaction': assign({
            'Transaction Processor Machine': (context) => {
              const { feePayer, latestBlockhash, instructions } =
                context['Transaction Processor Machine'][
                  'Create Transaction Machine'
                ];
              const transaction = new Transaction({
                feePayer,
                recentBlockhash: latestBlockhash?.blockhash,
              });

              instructions.forEach((instruction) =>
                transaction.add(instruction)
              );

              return {
                ...context['Transaction Processor Machine'],
                transaction,
              };
            },
          }),
          'Save blockhash details in checker': assign({
            'Blockhash Checker Machine': (context, event) => ({
              ...context['Blockhash Checker Machine'],
              latestBlockhash: event.latestBlockhash,
            }),
          }),
        },
        services: {
          'Confirm transaction': async (context) => {
            if (
              context['Transaction Processor Machine'].signature === undefined
            ) {
              throw new Error('Missing signature');
            }

            return connection.confirmTransaction(
              context['Transaction Processor Machine'].signature
            );
          },
          'Fetch latest blockhash': () => connection.getLatestBlockhash(),
          'Get Block Height': () => connection.getBlockHeight(),
          'Send transaction': (context) => {
            if (
              context['Transaction Processor Machine'].transaction === undefined
            ) {
              throw new Error('Missing transaction');
            }

            return connection.sendRawTransaction(
              context['Transaction Processor Machine'].transaction.serialize()
            );
          },
        },
        guards: {
          'should recreate transaction': (context, _, { state }) =>
            context['Transaction Processor Machine'].status !== 'creating' &&
            (state.value as any)['Blockhash Checker Machine'] === 'Blockhash Expired',
          'can try to confirm again': (context) =>
            context['Transaction Processor Machine']['Send Transaction Machine']
              .attempt <
            context['Transaction Processor Machine']['Send Transaction Machine']
              .maxAttempts,
          'is blockhash valid': (context, event) => {
            if (
              context['Blockhash Checker Machine']?.latestBlockhash ===
              undefined
            ) {
              return false;
            }

            return (
              event.data <
              context['Blockhash Checker Machine']?.latestBlockhash
                ?.lastValidBlockHeight
            );
          },
          'signatures are done': (context) =>
            context[
              'Transaction Processor Machine'
            ].transaction?.verifySignatures() ?? false,
          'valid signer': (context, event) => {
            if (
              context['Transaction Processor Machine'].transaction === undefined
            ) {
              return false;
            }

            const message =
              context[
                'Transaction Processor Machine'
              ].transaction.compileMessage();
            const accountIndex = message?.accountKeys.findIndex((accountKey) =>
              accountKey.equals(event.keypair.publicKey)
            );

            return message?.isAccountSigner(accountIndex);
          },
          'is transaction done': (context) =>
            context['Transaction Processor Machine'].status === 'confirmed' ||
            context['Transaction Processor Machine'].status === 'failed',
        },
      },
      {
        'Transaction Processor Machine': {
          id: uuid(),
          createdAt: Date.now(),
          status: 'creating',
          'Create Transaction Machine': {
            feePayer: authority.publicKey,
            instructions,
          },
          'Sign Transaction Machine': {
            signatures: [],
          },
          'Send Transaction Machine': {
            maxAttempts: 5,
            attempt: 0,
          },
        },
        'Blockhash Checker Machine': {},
      }
    )
  ).start();
