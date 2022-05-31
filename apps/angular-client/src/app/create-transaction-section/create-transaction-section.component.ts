import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { Transaction, TransactionInstruction } from '@solana/web3.js';
import { combineLatest, filter, of, take, takeUntil } from 'rxjs';
import { PluginsService } from '../plugins';
import { isNotNull } from '../utils';
import { CreateTransactionSectionStore } from './create-transaction-section.store';
import { InstructionOption } from './instruction-autocomplete.component';
import {
  TransactionFormModel,
  TransactionFormService,
} from './transaction-form.service';

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

      <form
        *ngIf="transactionForm$ | async as transactionForm"
        [formGroup]="transactionForm.form"
        (ngSubmit)="onBuildTransaction(transactionForm.model)"
      >
        <formly-form
          [form]="transactionForm.form"
          [fields]="[transactionForm.fields]"
          [model]="transactionForm.model"
        ></formly-form>
      </form>
    </section>
  `,
  providers: [TransactionFormService, CreateTransactionSectionStore],
})
export class CreateTransactionSectionComponent implements OnInit {
  readonly transactionForm$ = this._transactionFormService.transactionForm$;
  readonly disabled$ = this._createTransactionSectionStore.disabled$;
  readonly authority$ = this._walletStore.publicKey$;

  @Output() transactionCreated = new EventEmitter<Transaction>();

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _pluginsService: PluginsService,
    private readonly _transactionFormService: TransactionFormService,
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
    this._transactionFormService.addInstruction(instructionOption);
  }

  onRestartTransactionForm() {
    this._transactionFormService.restart();
  }
}
