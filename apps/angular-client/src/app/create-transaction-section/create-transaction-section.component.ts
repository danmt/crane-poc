import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { WalletStore } from '@heavy-duty/wallet-adapter';
import { Transaction } from '@solana/web3.js';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  of,
  take,
  takeUntil,
} from 'rxjs';
import { PluginsService } from '../plugins';
import { isNotNull } from '../utils';
import { CreateTransactionSectionStore } from './create-transaction-section.store';
import { InstructionOption } from './instruction-autocomplete.component';
import { TransactionForm } from './transaction-form';

@Component({
  selector: 'crane-create-transaction-section',
  template: `
    <section class="p-4">
      <header class="flex justify-between mb-4">
        <h1 class="text-3xl">Playground</h1>

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
          (ngSubmit)="onBuildTransaction(model, instructions)"
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
  _transactionForm = new TransactionForm();
  private readonly _selectedInstruction =
    new BehaviorSubject<InstructionOption | null>(null);
  readonly selectedInstruction$ = this._selectedInstruction.asObservable();
  form = new FormGroup({});
  model = {};
  instructions: InstructionOption[] = [];
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
    this._createTransactionSectionStore.setFeePayer(
      combineLatest({
        service: this._createTransactionSectionStore.service$,
        feePayer: this._walletStore.publicKey$,
      })
    );
  }

  onBuildTransaction(
    model: {
      [key: string]: {
        accounts: { [accountName: string]: string };
        args: { [argName: string]: string };
      };
    },
    instructionOptions: InstructionOption[]
  ) {
    const instructions = instructionOptions.map(
      ({ namespace, name, instruction }, index) => {
        const transactionInstruction =
          this._pluginsService
            .getPlugin(namespace, name)
            ?.getTransactionInstruction(instruction.name, model[index + 1]) ??
          null;

        if (transactionInstruction === null) {
          throw new Error('Invalid instruction.');
        }

        return transactionInstruction;
      }
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
    this.instructions.push(instructionOption);
    this._transactionForm.addInstruction(instructionOption);
  }

  onRestartTransactionForm() {
    this._transactionForm.restart();
  }
}
