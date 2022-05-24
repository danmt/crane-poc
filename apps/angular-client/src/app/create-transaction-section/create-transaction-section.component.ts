import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Transaction } from '@solana/web3.js';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  take,
  takeUntil,
} from 'rxjs';
import { PluginsService } from '../plugins';
import { isNotNull, toFormlyFields } from '../utils';
import { CreateTransactionSectionStore } from './create-transaction-section.store';
import { InstructionOption } from './instruction-autocomplete/instruction-autocomplete.component';

@Component({
  selector: 'xstate-create-transaction-section',
  template: `
    <section class="p-4">
      <h2>Create transaction</h2>

      <xstate-instruction-autocomplete
        (instructionSelected)="onInstructionSelected($event)"
      ></xstate-instruction-autocomplete>

      <ng-container *ngIf="selectedInstruction$ | async as selectedInstruction">
        <ng-container *ngIf="fields$ | async as fields">
          <form
            *ngIf="fields.length > 0 && selectedInstruction !== null"
            [formGroup]="form"
            (ngSubmit)="onAddInstruction(model, selectedInstruction)"
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

      <button
        (click)="onBuildTransaction()"
        [disabled]="disabled$ | async"
        class="px-4 py-2 border-2 border-blue-300 bg-blue-200 disabled:bg-gray-200 disabled:border-gray-300"
      >
        Create transaction
      </button>
    </section>
  `,
  providers: [CreateTransactionSectionStore],
})
export class CreateTransactionSectionComponent implements OnInit {
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

  readonly connection$ = this._createTransactionSectionStore.connection$;
  readonly disabled$ = this._createTransactionSectionStore.disabled$;
  readonly authority$ = this._walletStore.publicKey$;

  @Output() transactionCreated = new EventEmitter<Transaction>();

  constructor(
    private readonly _walletStore: WalletStore,
    private readonly _connectionStore: ConnectionStore,
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
    this._createTransactionSectionStore.setConnection(
      this._connectionStore.connection$
    );
  }

  onBuildTransaction() {
    this._createTransactionSectionStore.buildTransaction(
      this._createTransactionSectionStore.service$.pipe(take(1))
    );
  }

  onInstructionSelected(instruction: InstructionOption) {
    this._selectedInstruction.next(instruction);
  }

  onAddInstruction(
    model: {
      accounts: { [accountName: string]: string };
      args: { [argName: string]: string };
    },
    { namespace, program, instruction }: InstructionOption
  ) {
    const transactionInstruction =
      this._pluginsService
        .getPlugin(namespace, program)
        ?.getTransactionInstruction(instruction.name, model) ?? null;

    if (transactionInstruction === null) {
      throw new Error('Invalid instruction.');
    }

    this._createTransactionSectionStore.addInstruction(
      combineLatest({
        service: this._createTransactionSectionStore.service$,
        instruction: of(transactionInstruction),
      }).pipe(take(1))
    );
  }
}
