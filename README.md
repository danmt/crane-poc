# Transaction Builder

This project intention is to explore a combination of XState, Angular and Solana to have a reactive transaction builder to visually showcase the way a transaction works.

## Create transaction

Creating a transaction is a process that involves knowing about all the programs available, this has a dynamic nature and we're using IDLs and Anchor coders to achieve a UX for composability never seen before.

To make this progressively better, we're using a plugin-based architecture that hopefully can grow into something move more re-usable.

### Plugin Setup

The transaction builder allows you to compose transactions with instructions of multiple open-source and verified protocols. In order to support the growth of the Solana ecosystem, each program integration should be treated as a plugin.

Using a Module with the forRoot static method developers can configure the instructions available. Each plugin is made of a class that's responsible of everything related to that program.

The main features are listed below:

- Developers should be able to list all the instructions available.
- Developers should be create a TransactionInstruction given a namespace, a program and a model.
- Developers should be able to create a formly configuration given a namespace, a program and an instruction.

Developers add all the desired plugins during app initialization, onInit the app component calls `PluginService.start()` which initializes all the plugins available. At this point there's a `PluginService.instructions` property that holds all the instructions available.

Plugins implement the `PluginInterface` that looks like:

```typescript
interface PluginInterface {
  namespace: string;
  name: string;
  getInstruction: (instructionName: string) => IdlInstruction | null;
  getTransactionInstruction: (
    instructionName: string,
    model: {
      args: { [argName: string]: string };
      accounts: { [accountName: string]: string };
    }
  ) => TransactionInstruction | null;
}
```

And the PluginService implements the following interface:

```typescript
interface PluginServiceInterface {
  plugins: PluginInterface[];
  registerAll: (plugins: PluginInterface[]) => void;
  getPlugin: (namespace: string, program: string) => PluginInterface | null;
}
```

Generating the Formly Fields Configuration is responsability of a method called `createInstructionFieldsConfiguration` that receives the arguments and accounts of the instruction and returns an object that matches the form configuration. In order to get the required information, the developer uses `getPlugin` in conjunction with `getInstruction`. With [ngx-formly](https://github.com/ngx-formly/ngx-formly) we generate a form ready to use.

Once an Instruction's form is submitted, the output model is transformed into a `TransactionInstruction` by using `getPlugin` and `getTransactionInstruction`.

When the transaction is done the user clicks "Create Transaction", this fetches the latest blockhash and adds it to the transaction. After finished, the Signing phase starts.

## Sign transaction

The UI displays the number of required signatures and the public key of each signer. When the user signs, the quantity of signatures increases. There has to be a way to check the block height and display to the user how close it is to be invalid.

NOTE: If the block height becomes invalid the signatures become invalid.

There are two ways to sign a transaction:

- Keypair: A Keypair consists of a public key and a private key. Using the private key, users can sign a transaction on behalf of the public key.
- Wallet: Web-based applications can make use of the wallet-adapter library which provides compatibility with multiple wallet providers.

Each method is handled in a different way at the Sign Transaction Machine, each has an action:

- signWithKeypair: This action sends a keypair in the value, then the machine signs the transaction.
- signWithWallet: This action triggers a transition to the Signing with Wallet state, on entry a service is invoked that calls the walletSignerFn and fires the returned Promise.

Note: When instantiating the Sign Transaction machine a walletSignerFn is provided, the walletSignerFn receives a transaction and returns a Promise with the signed transaction.

When the transaction is fully signed the Sending phase automatically starts.

## Send transaction

The user can press a button to send the transaction. Once sent, the Confirmation phase starts.

## Confirm transaction

The user can press a button to confirm the transaction, the transaction signature is shown to the user. The UI tracks the whole confirmation: processed -> confirmed -> finalized. Adds a timestamp for each step of the confirmation.
