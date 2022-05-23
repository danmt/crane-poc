import { TransactionInstruction } from '@solana/web3.js';

export interface IdlInstruction {
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
}

export interface PluginInterface {
  namespace: string;
  program: string;
  programId: string;
  instructions: IdlInstruction[];
  getInstruction(instructionName: string): IdlInstruction | null;
  getTransactionInstruction(
    instructionName: string,
    model: {
      args: { [argName: string]: string };
      accounts: { [accountName: string]: string };
    }
  ): TransactionInstruction | null;
}

export interface PluginsServiceInterface {
  plugins: PluginInterface[];
  registerAll(plugins: PluginInterface[]): void;
  getPlugin(namespace: string, program: string): PluginInterface | null;
}
