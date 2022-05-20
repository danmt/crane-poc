import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Transaction } from '@solana/web3.js';
import { filter, take, takeUntil } from 'rxjs';
import { isNotNull } from '../utils';
import { SendTransactionButtonStore } from './send-transaction-button.store';

@Component({
  selector: 'xstate-send-transaction-button',
  template: `
    <button
      (click)="onSendTransaction()"
      [disabled]="disabled$ | async"
      class="px-4 py-2 border-2 border-blue-300 bg-blue-200 disabled:bg-gray-200 disabled:border-gray-300"
    >
      Send transaction
    </button>
  `,
  providers: [SendTransactionButtonStore],
})
export class SendTransactionButtonComponent implements OnInit {
  readonly disabled$ = this._sendTransactionButtonStore.disabled$;

  @Input() set transaction(value: Transaction) {
    this._sendTransactionButtonStore.setTransaction(value);
  }

  @Output() transactionSent = new EventEmitter();

  constructor(
    private readonly _sendTransactionButtonStore: SendTransactionButtonStore
  ) {}

  ngOnInit() {
    this._sendTransactionButtonStore.serviceState$
      .pipe(
        isNotNull,
        filter((state) => state.matches('Transaction sent')),
        takeUntil(this._sendTransactionButtonStore.destroy$)
      )
      .subscribe(({ context }) => this.transactionSent.emit(context.signature));
  }

  onSendTransaction() {
    this._sendTransactionButtonStore.sendTransaction(
      this._sendTransactionButtonStore.service$.pipe(take(1))
    );
  }
}
