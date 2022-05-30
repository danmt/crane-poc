import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { Transaction, TransactionInstruction } from '@solana/web3.js';
import { combineLatest, filter, of, take, takeUntil } from 'rxjs';
import { PluginsService } from '../plugins';
import { isNotNull } from '../utils';
import { CreateTransactionSectionStore } from './create-transaction-section.store';
import { InstructionOption } from './instruction-autocomplete.component';
import { TransactionForm, TransactionFormModel } from './transaction-form';

@Component({
  selector: 'crane-create-transaction-section',
  template: `
    <section class="p-4">
      <header class="flex justify-between mb-4">
        <h1 class="text-3xl">Crane Playground</h1>

        <button (click)="onRestartTransactionForm()" class="underline">
          Restart form
        </button>
      </header>

      <crane-instruction-autocomplete
        (instructionSelected)="onInstructionSelected($event)"
      ></crane-instruction-autocomplete>

      <ng-container *ngIf="fields$ | async as fields">
        <form
          *ngIf="fields"
          [formGroup]="form"
          (ngSubmit)="onBuildTransaction(model)"
        >
          <formly-form
            [form]="form"
            [fields]="[fields]"
            [model]="model"
          ></formly-form>
        </form>
      </ng-container>
    </section>
  `,
  providers: [CreateTransactionSectionStore],
})
export class CreateTransactionSectionComponent implements OnInit {
  private readonly _transactionForm = new TransactionForm();
  form = new FormGroup({});
  model: TransactionFormModel = {};
  readonly fields$ = this._transactionForm.fields$;
  readonly disabled$ = this._createTransactionSectionStore.disabled$;
  readonly authority$ = this._walletStore.publicKey$;

  @Output() transactionCreated = new EventEmitter<Transaction>();

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _pluginsService: PluginsService,
    private readonly _createTransactionSectionStore: CreateTransactionSectionStore
  ) {}

  ngOnInit() {
    this._createTransactionSectionStore.serviceState$
      .pipe(
        isNotNull,
        filter((state) => state.matches('Transaction created')),
        takeUntil(this._createTransactionSectionStore.destroy$)
      )
      .subscribe(({ context }) =>
        this.transactionCreated.emit(context.transaction)
      );
  }

  onBuildTransaction(model: TransactionFormModel) {
    const instructions = Object.values(model).reduce(
      (
        instructions: TransactionInstruction[],
        { namespace, name, instruction, accounts, args }
      ) => {
        const transactionInstruction =
          this._pluginsService
            .getPlugin(namespace, name)
            ?.getTransactionInstruction(instruction, args, accounts) ?? null;

        if (transactionInstruction === null) {
          throw new Error('Invalid instruction.');
        }

        return [...instructions, transactionInstruction];
      },
      []
    );

    this._createTransactionSectionStore.createTransaction(
      combineLatest({
        service: this._createTransactionSectionStore.service$.pipe(take(1)),
        feePayer: this._walletStore.publicKey$,
        instructions: of(instructions),
      })
    );
  }

  onInstructionSelected(instructionOption: InstructionOption) {
    this._transactionForm.addInstruction(instructionOption);
  }

  onRestartTransactionForm() {
    this._transactionForm.restart();
  }
}
