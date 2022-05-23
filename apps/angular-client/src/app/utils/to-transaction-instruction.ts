import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN } from 'bn.js';
import { snake } from 'case';
import { IdlInstruction } from './types';

export interface InstructionOption {
  namespace: string;
  program: string;
  instruction: {
    name: string;
    accounts: {
      name: string;
      isMut: boolean;
      isSigner: boolean;
    }[];
    args: (
      | {
          name: string;
          type: string;
        }
      | {
          name: string;
          type: {
            defined: string;
          };
        }
      | {
          name: string;
          type: {
            option: string;
          };
        }
    )[];
  };
}

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

  const parsedAccounts = Object.keys(model.accounts).reduce(
    (accounts, accountName) => ({
      ...accounts,
      [accountName]: new PublicKey(model.accounts[accountName]),
    }),
    {}
  );

  return program.methods[instruction.name](...parsedArgs)
    .accounts(parsedAccounts)
    .instruction();
};
