import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionSignature,
} from '@solana/web3.js';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { InstructionOption } from './instruction-autocomplete/instruction-autocomplete.component';
import { isNotNull, toFormlyFields } from './utils';
import { toTransactionInstruction } from './utils/to-transaction-instruction';

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
    new BehaviorSubject<InstructionOption | null>(null);
  readonly selectedInstruction$ = this._selectedInstruction.asObservable();
  form = new FormGroup({});
  model = {
    accounts: {},
    args: {},
  };
  readonly fields$: Observable<FormlyFieldConfig[]> =
    this.selectedInstruction$.pipe(
      map((selectedInstruction) =>
        selectedInstruction === null
          ? []
          : toFormlyFields(selectedInstruction.instruction)
      )
    );

  constructor(
    private readonly _connectionStore: ConnectionStore,
    private readonly _walletStore: WalletStore
  ) {}

  ngOnInit() {
    this._walletStore.setAdapters([new PhantomWalletAdapter()]);
    this._connectionStore.setEndpoint('http://localhost:8899');
  }

  onInstructionSelected(instruction: InstructionOption) {
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
    { namespace, program, instruction }: InstructionOption
  ) {
    try {
      const transactionInstruction = await toTransactionInstruction(
        connection,
        model,
        namespace,
        program,
        instruction
      );

      console.log(transactionInstruction);
    } catch (error) {
      console.log({ error });
    }
  }
}
