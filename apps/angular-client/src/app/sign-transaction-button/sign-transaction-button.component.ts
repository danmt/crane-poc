import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PublicKey, Transaction } from '@solana/web3.js';
import { combineLatest, filter, take, takeUntil } from 'rxjs';
import { isNotNull } from '../utils';
import { SignTransactionButtonStore } from './sign-transaction-button.store';

@Component({
  selector: 'xstate-sign-transaction-button',
  template: `
    <button
      (click)="onSignTransaction()"
      [disabled]="disabled$ | async"
      class="px-4 py-2 border-2 border-blue-300 bg-blue-200 disabled:bg-gray-200 disabled:border-gray-300"
    >
      Sign transaction
    </button>
  `,
  providers: [SignTransactionButtonStore],
})
export class SignTransactionButtonComponent implements OnInit {
  readonly disabled$ = this._signTransactionButtonStore.disabled$;

  @Input() set signer(value: PublicKey | null) {
    if (value !== null) {
      this._signTransactionButtonStore.setSigner(value);
    }
  }
  @Input() set transaction(value: Transaction | null) {
    if (value !== null) {
      this._signTransactionButtonStore.setTransaction(value);
    }
  }

  @Output() transactionSigned = new EventEmitter();

  constructor(
    private readonly _signTransactionButtonStore: SignTransactionButtonStore
  ) {}

  ngOnInit() {
    this._signTransactionButtonStore.serviceState$
      .pipe(
        isNotNull,
        filter((state) => state.matches('Transaction signed')),
        takeUntil(this._signTransactionButtonStore.destroy$)
      )
      .subscribe(({ context }) =>
        this.transactionSigned.emit(new Transaction(context.transaction))
      );
  }

  onSignTransaction() {
    this._signTransactionButtonStore.signTransaction(
      combineLatest({
        service: this._signTransactionButtonStore.service$,
        signer: this._signTransactionButtonStore.signer$,
      }).pipe(take(1))
    );
  }
}
