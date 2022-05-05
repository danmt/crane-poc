import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { combineLatest, filter, take, takeUntil } from 'rxjs';
import { isNotNull } from '../utils';
import { CreateTransactionButtonStore } from './create-transaction-button.store';

@Component({
  selector: 'xstate-create-transaction-button',
  template: `
    <button
      (click)="onCreateTransaction()"
      [disabled]="disabled$ | async"
      class="px-4 py-2 border-2 border-blue-300 bg-blue-200 disabled:bg-gray-200 disabled:border-gray-300"
    >
      Create transaction
    </button>
  `,
  providers: [CreateTransactionButtonStore],
})
export class CreateTransactionButtonComponent implements OnInit {
  readonly disabled$ = this._createTransactionButtonStore.disabled$;

  @Input() set connection(value: Connection) {
    this._createTransactionButtonStore.setConnection(value);
  }
  @Input() set feePayer(value: PublicKey) {
    this._createTransactionButtonStore.setFeePayer(value);
  }
  @Input() set instructions(value: TransactionInstruction[]) {
    this._createTransactionButtonStore.setInstructions(value);
  }
  @Output() transactionCreated = new EventEmitter();

  constructor(
    private readonly _createTransactionButtonStore: CreateTransactionButtonStore
  ) {}

  ngOnInit() {
    this._createTransactionButtonStore.serviceState$
      .pipe(
        isNotNull,
        filter((state) => state.matches('Transaction created')),
        takeUntil(this._createTransactionButtonStore.destroy$)
      )
      .subscribe(({ context }) =>
        this.transactionCreated.emit(context.transaction)
      );
  }

  onCreateTransaction() {
    this._createTransactionButtonStore.createTransaction(
      combineLatest({
        service: this._createTransactionButtonStore.service$,
        feePayer: this._createTransactionButtonStore.feePayer$,
        instructions: this._createTransactionButtonStore.instructions$,
      }).pipe(take(1))
    );
  }
}
