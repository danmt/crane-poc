import { SplTokenInstructionCoder } from '@project-serum/anchor/dist/cjs/coder/spl-token/instruction';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { IdlInstruction, PluginInterface } from '../../types';
import { IDL } from './token_program';

export class TokenPlugin implements PluginInterface {
  readonly namespace = 'solana';
  readonly program = 'token_program';
  readonly programId = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  readonly instructions = IDL.instructions;

  getInstruction(instructionName: string): IdlInstruction | null {
    return (
      this.instructions.find(
        (instruction) => instruction.name === instructionName
      ) ?? null
    );
  }

  getTransactionInstruction(
    instructionName: string,
    model: {
      args: { [argName: string]: string };
      accounts: { [accountName: string]: string };
    }
  ): TransactionInstruction | null {
    const instruction = this.getInstruction(instructionName);

    if (instruction === null) {
      return null;
    }

    const coder = new SplTokenInstructionCoder(IDL);

    return new TransactionInstruction({
      programId: new PublicKey(this.programId),
      keys: instruction.accounts.map((account) => ({
        pubkey: new PublicKey(model.accounts[account.name]),
        isSigner: account.isSigner,
        isWritable: account.isMut,
      })),
      data: coder.encode(instructionName, model.args),
    });
  }
}
