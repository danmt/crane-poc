import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { BN } from 'bn.js';
import { capital, snake } from 'case';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { IdlInstruction } from './instruction-autocomplete/instruction-autocomplete.component';
import { isNotNull } from './utils';

export function PublicKeyValidator(
  control: FormControl
): ValidationErrors | null {
  try {
    new PublicKey(control.value);
    return null;
  } catch (error) {
    return { publicKey: true };
  }
}

@Component({
  selector: 'xstate-root',
  template: `
    <header>
      <h1>XState Solana Playground</h1>
    </header>

    <main>
      <section class="p-4">
        <h2>Create transaction</h2>

        <xstate-instruction-autocomplete
          (instructionSelected)="onInstructionSelected($event)"
        ></xstate-instruction-autocomplete>

        <ng-container *ngIf="connection$ | async as connection">
          <ng-container
            *ngIf="selectedInstruction$ | async as selectedInstruction"
          >
            <ng-container *ngIf="fields$ | async as fields">
              <form
                [formGroup]="form"
                (ngSubmit)="onSubmit(connection, model, selectedInstruction)"
                *ngIf="fields.length > 0 && selectedInstruction !== null"
              >
                <formly-form
                  [form]="form"
                  [fields]="fields"
                  [model]="model"
                ></formly-form>
                <button type="submit" mat-raised-button color="primary">
                  Submit
                </button>
              </form>
            </ng-container>
          </ng-container>
        </ng-container>

        <xstate-create-transaction-button
          [connection]="(connection$ | async) ?? null"
          [feePayer]="(authority$ | async) ?? null"
          [instructions]="(instructions$ | async) ?? null"
          (transactionCreated)="onTransactionCreated($event)"
        >
        </xstate-create-transaction-button>
      </section>

      <section>
        <h2>Sign transaction</h2>

        <xstate-sign-transaction-button
          [transaction]="transaction$ | async"
          [signer]="(authority$ | async) ?? null"
          (transactionSigned)="onTransactionSigned($event)"
        >
        </xstate-sign-transaction-button>
      </section>

      <section>
        <h2>Send transaction</h2>

        <xstate-send-transaction-button
          [transaction]="transaction$ | async"
          (transactionSent)="onTransactionSent($event)"
        >
        </xstate-send-transaction-button>
      </section>

      <section>
        <h2>Confirm transaction</h2>

        <xstate-confirm-transaction-button
          [signature]="signature$ | async"
          (transactionConfirmed)="onTransactionConfirmed()"
        >
        </xstate-confirm-transaction-button>
      </section>
    </main>
  `,
  styles: [],
  providers: [ConnectionStore, WalletStore],
})
export class AppComponent implements OnInit {
  private readonly _transaction = new BehaviorSubject<Transaction | null>(null);
  private readonly _signature =
    new BehaviorSubject<TransactionSignature | null>(null);
  readonly connection$ = this._connectionStore.connection$;
  readonly authority$ = this._walletStore.publicKey$;
  readonly instructions$ = this.authority$.pipe(
    isNotNull,
    map((authority) => [
      SystemProgram.transfer({
        fromPubkey: authority,
        toPubkey: Keypair.generate().publicKey,
        lamports: 0.1 * LAMPORTS_PER_SOL,
      }),
    ])
  );
  readonly transaction$ = this._transaction.asObservable();
  readonly signature$ = this._signature.asObservable();

  private readonly _selectedInstruction =
    new BehaviorSubject<IdlInstruction | null>(null);
  readonly selectedInstruction$ = this._selectedInstruction.asObservable();
  form = new FormGroup({});
  model = {
    accounts: {},
    args: {},
  };
  readonly fields$: Observable<FormlyFieldConfig[]> =
    this.selectedInstruction$.pipe(
      map((selectedInstruction) => {
        if (selectedInstruction === null) {
          return [];
        }

        return [
          {
            key: 'accounts',
            templateOptions: { label: 'Accounts' },
            fieldGroup: selectedInstruction.instruction.accounts.map(
              (account) => ({
                key: account.name,
                type: 'input',
                templateOptions: {
                  label: capital(account.name),
                  placeholder: account.name,
                  description: `Enter Public Key for account ${account.name}.`,
                  required: true,
                },
                validators: {
                  required: {
                    expression: (control: FormControl) =>
                      control.value !== null,
                    message: (_: unknown, field: FormlyFieldConfig) =>
                      `"${capital(
                        field.key?.toString() ?? 'unknown'
                      )}" is mandatory.`,
                  },
                  publicKey: {
                    expression: (control: FormControl) =>
                      control.value !== null &&
                      PublicKeyValidator(control) === null,
                    message: (_: unknown, field: FormlyFieldConfig) =>
                      `"${field.formControl?.value}" is not a valid Public Key.`,
                  },
                },
              })
            ),
          },
          {
            key: 'args',
            templateOptions: { label: 'Args' },
            fieldGroup: selectedInstruction.instruction.args.map((arg) => ({
              key: arg.name,
              type: 'input',
              templateOptions: {
                required: true,
                placeholder: arg.name,
              },
            })),
          },
        ];
      })
    );

  constructor(
    private readonly _connectionStore: ConnectionStore,
    private readonly _walletStore: WalletStore
  ) {}

  ngOnInit() {
    this._walletStore.setAdapters([new PhantomWalletAdapter()]);
    this._connectionStore.setEndpoint('http://localhost:8899');
  }

  onInstructionSelected(instruction: IdlInstruction) {
    this._selectedInstruction.next(instruction);
  }

  onTransactionCreated(transaction: Transaction) {
    this._transaction.next(transaction);
  }

  onTransactionSigned(transaction: Transaction) {
    this._transaction.next(transaction);
  }

  onTransactionSent(signature: TransactionSignature) {
    this._signature.next(signature);
  }

  onTransactionConfirmed() {
    console.log('confirmed');
  }

  async onSubmit(
    connection: Connection,
    model: {
      accounts: { [accountName: string]: string };
      args: { [argName: string]: string };
    },
    selectedInstruction: IdlInstruction
  ) {
    try {
      const { IDL, PROGRAM_ID } = await import(
        `../assets/idls/${selectedInstruction.namespace}/${snake(
          selectedInstruction.program
        )}`
      );
      const provider = new AnchorProvider(
        connection,
        {} as Wallet,
        AnchorProvider.defaultOptions()
      );
      const program = new Program(IDL, PROGRAM_ID, provider);

      const parsedArgs = Object.keys(model.args).reduce((args, argName) => {
        const argType = selectedInstruction.instruction.args.find(
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

      const instruction = await program.methods[
        selectedInstruction.instruction.name
      ](...parsedArgs)
        .accounts(parsedAccounts)
        .instruction();

      console.log(instruction);
    } catch (error) {
      console.log({ error });
    }
  }
}
