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
