import { AnchorProvider, Program, Spl, Wallet } from '@project-serum/anchor';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from 'bn.js';
import { snake } from 'case';
import { IdlInstruction } from './types';

export const toTransactionInstruction = async (
  connection: Connection,
  model: {
    accounts: { [accountName: string]: string };
    args: { [argName: string]: string };
  },
  namespace: string,
  programId: string,
  instruction: IdlInstruction
): Promise<TransactionInstruction> => {
  const { IDL, PROGRAM_ID } = await import(
    `../../assets/idls/${namespace}/${snake(programId)}`
  );
  const provider = new AnchorProvider(
    connection,
    {} as Wallet,
    AnchorProvider.defaultOptions()
  );
  const program = new Program(IDL, PROGRAM_ID, provider);

  const parsedArgs = Object.keys(model.args).reduce((args, argName) => {
    const argType = instruction.args.find(
      (selectedArg) => selectedArg.name === argName
    );

    if (argType === undefined) {
      return args;
    }

    console.log(argType);

    if (typeof argType.type === 'string') {
      switch (argType.type) {
        case 'u8':
        case 'u16':
        case 'u32': {
          return [...args, Number(model.args[argName])];
        }
        case 'u64': {
          return [...args, new BN(model.args[argName])];
        }
        case 'publicKey': {
          return [...args, new PublicKey(model.args[argName])];
        }
        default:
          return [...args, model.args[argName]];
      }
    } else {
      return [...args, null];
    }
  }, [] as unknown[]);

  const parsedAccounts: any = Object.keys(model.accounts).reduce(
    (accounts, accountName) => ({
      ...accounts,
      [accountName]: new PublicKey(model.accounts[accountName]),
    }),
    {}
  );

  console.log({ parsedArgs, parsedAccounts });

  const a = Spl.token(provider);

  // Seems like the amount in the token program is not u64 or something weird
  // there's an issue with the amount.

  const ixAnchor = await a.methods
    .transfer(...(parsedArgs as any))
    .accounts({
      authority: parsedAccounts['authority'],
      source: parsedAccounts['source'],
      destination: parsedAccounts['destination'],
    })
    .instruction();

  const ixOurs = await program.methods[instruction.name](...parsedArgs)
    .accounts(parsedAccounts)
    .instruction();

  console.log({
    ixAnchor,
    ixOurs,
  });

  return ixOurs;
};
