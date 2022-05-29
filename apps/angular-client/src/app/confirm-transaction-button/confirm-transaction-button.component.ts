import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TransactionSignature } from '@solana/web3.js';
import { filter, take, takeUntil } from 'rxjs';
import { isNotNull } from '../utils';
import { ConfirmTransactionButtonStore } from './confirm-transaction-button.store';

@Component({
  selector: 'crane-confirm-transaction-button',
  template: `
    <button
      (click)="onConfirmTransaction()"
      [disabled]="disabled$ | async"
      class="px-4 py-2 border-2 border-blue-300 bg-blue-200 disabled:bg-gray-200 disabled:border-gray-300"
    >
      Confirm transaction
    </button>
  `,
  providers: [ConfirmTransactionButtonStore],
})
export class ConfirmTransactionButtonComponent implements OnInit {
  readonly disabled$ = this._confirmTransactionButtonStore.disabled$;

  @Input() set signature(value: TransactionSignature | null) {
    if (value !== null) {
      this._confirmTransactionButtonStore.setSignature(value);
    }
  }

  @Output() transactionConfirmed = new EventEmitter();

  constructor(
    private readonly _confirmTransactionButtonStore: ConfirmTransactionButtonStore
  ) {}

  ngOnInit() {
    this._confirmTransactionButtonStore.serviceState$
      .pipe(
        isNotNull,
        filter((state) => state.matches('Transaction confirmed')),
        takeUntil(this._confirmTransactionButtonStore.destroy$)
      )
      .subscribe(() => this.transactionConfirmed.emit());
  }

  onConfirmTransaction() {
    this._confirmTransactionButtonStore.confirmTransaction(
      this._confirmTransactionButtonStore.service$.pipe(take(1))
    );
  }
}
